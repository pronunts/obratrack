// ============================================================
// ObraTrack — Capa de Persistencia IndexedDB con Dexie.js v2
// Design: Blueprint Engineering — offline-first, multi-proyecto
//
// ARQUITECTURA:
//   IndexedDB (Dexie) → almacenamiento principal, sin límite de 5MB
//   localStorage       → solo para preferencias UI (tema, proyectoActivoId)
//
// PREPARADO PARA:
//   syncToCloud()   → Supabase / Firebase en la siguiente fase
//   fetchFromCloud() → Supabase / Firebase en la siguiente fase
// ============================================================

import Dexie, { type Table } from 'dexie';
import axios from 'axios';
import type {
  Proyecto,
  PartidaPresupuesto,
  RegistroEjecucion,
  GastoDiario,
  SyncResult,
  CloudSyncService,
} from './types';

// ── Definición de la Base de Datos ───────────────────────

export class ObraTrackDB extends Dexie {
  proyectos!: Table<Proyecto, string>;
  partidas!: Table<PartidaPresupuesto, string>;
  ejecuciones!: Table<RegistroEjecucion, string>;
  gastos!: Table<GastoDiario, string>;

  constructor() {
    super('ObraTrackDB');

    this.version(1).stores({
      // Índices: clave primaria + campos para queries frecuentes
      proyectos:   '&id, nombre, creadoEn, sincronizado',
      partidas:    '&id, proyectoId, capitulo, codigo, sincronizado',
      ejecuciones: '&id, proyectoId, partidaId, fecha, sincronizado, creadoEn',
      gastos:      '&id, proyectoId, partidaId, fecha, sincronizado, creadoEn',
    });
  }
}

// Instancia singleton
export const db = new ObraTrackDB();

// ── Preferencias UI en localStorage ──────────────────────
const PREFS_KEY = 'obratrack_prefs_v2';

interface UIPrefs {
  proyectoActivoId: string | null;
}

export function getUIPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { proyectoActivoId: null };
  } catch {
    return { proyectoActivoId: null };
  }
}

export function setUIPrefs(prefs: Partial<UIPrefs>): void {
  try {
    const current = getUIPrefs();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch (e) {
    console.error('[ObraTrack] Error guardando preferencias:', e);
  }
}

// ── Operaciones de Alto Nivel ─────────────────────────────

/** Carga todos los proyectos ordenados por fecha de creación (más reciente primero) */
export async function loadProyectos(): Promise<Proyecto[]> {
  return db.proyectos.orderBy('creadoEn').reverse().toArray();
}

/** Carga todos los datos de un proyecto específico */
export async function loadProyectoData(proyectoId: string) {
  const [partidas, ejecuciones, gastos] = await Promise.all([
    db.partidas.where('proyectoId').equals(proyectoId).toArray(),
    db.ejecuciones.where('proyectoId').equals(proyectoId).toArray(),
    db.gastos.where('proyectoId').equals(proyectoId).toArray(),
  ]);
  return { partidas, ejecuciones, gastos };
}

/** Cuenta registros pendientes de sincronización de un proyecto */
export async function countPendientes(proyectoId: string): Promise<number> {
  const [ej, ga] = await Promise.all([
    db.ejecuciones.where({ proyectoId, sincronizado: 0 as any }).count(),
    db.gastos.where({ proyectoId, sincronizado: 0 as any }).count(),
  ]);
  return ej + ga;
}

/** Cuenta TODOS los pendientes de todos los proyectos */
export async function countAllPendientes(): Promise<number> {
  const [ej, ga] = await Promise.all([
    db.ejecuciones.filter(e => !e.sincronizado).count(),
    db.gastos.filter(g => !g.sincronizado).count(),
  ]);
  return ej + ga;
}

/** Elimina un proyecto y todos sus datos asociados */
export async function deleteProyecto(proyectoId: string): Promise<void> {
  await db.transaction('rw', db.proyectos, db.partidas, db.ejecuciones, db.gastos, async () => {
    await Promise.all([
      db.proyectos.delete(proyectoId),
      db.partidas.where('proyectoId').equals(proyectoId).delete(),
      db.ejecuciones.where('proyectoId').equals(proyectoId).delete(),
      db.gastos.where('proyectoId').equals(proyectoId).delete(),
    ]);
  });
}

/** Marca todos los registros de un proyecto como sincronizados */
export async function markAllSynced(proyectoId: string): Promise<void> {
  await db.transaction('rw', db.ejecuciones, db.gastos, db.proyectos, async () => {
    const now = new Date().toISOString();
    await Promise.all([
      db.ejecuciones
        .where('proyectoId').equals(proyectoId)
        .modify({ sincronizado: true }),
      db.gastos
        .where('proyectoId').equals(proyectoId)
        .modify({ sincronizado: true }),
      db.proyectos
        .where('id').equals(proyectoId)
        .modify({ sincronizado: true, actualizadoEn: now }),
    ]);
  });
}

/** Importa partidas en bloque (reemplaza las existentes del proyecto) */
export async function importarPartidasBulk(
  proyectoId: string,
  partidas: PartidaPresupuesto[]
): Promise<void> {
  await db.transaction('rw', db.partidas, async () => {
    // Eliminar partidas anteriores del proyecto
    await db.partidas.where('proyectoId').equals(proyectoId).delete();
    // Insertar nuevas
    await db.partidas.bulkPut(partidas);
  });
}

// ── Sync: sube TODOS los pendientes al servidor ───────────────────────────────
// Estrategia: last-write-wins con `actualizadoEn` para proyectos,
// append-only para ejecuciones/gastos (IDs únicos, sin conflicto real).

export async function syncAllToCloud(): Promise<{ uploaded: number }> {
  const token = localStorage.getItem('obratrack_token');
  if (!token) return { uploaded: 0 };

  const [pendingProyectos, pendingPartidas, pendingEjecuciones, pendingGastos] = await Promise.all([
    db.proyectos.filter(p => !p.sincronizado).toArray(),
    db.partidas.filter(p => !p.sincronizado).toArray(),
    db.ejecuciones.filter(e => !e.sincronizado).toArray(),
    db.gastos.filter(g => !g.sincronizado).toArray(),
  ]);

  const total = pendingProyectos.length + pendingPartidas.length + pendingEjecuciones.length + pendingGastos.length;
  if (total === 0) return { uploaded: 0 };

  await axios.post('/api/sync', {
    proyectos: pendingProyectos,
    partidas: pendingPartidas,
    ejecuciones: pendingEjecuciones,
    gastos: pendingGastos,
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Marcar todo como sincronizado en IndexedDB
  await db.transaction('rw', db.proyectos, db.partidas, db.ejecuciones, db.gastos, async () => {
    await db.proyectos.filter(p => !p.sincronizado).modify({ sincronizado: true });
    await db.partidas.filter(p => !p.sincronizado).modify({ sincronizado: true });
    await db.ejecuciones.filter(e => !e.sincronizado).modify({ sincronizado: true });
    await db.gastos.filter(g => !g.sincronizado).modify({ sincronizado: true });
  });

  return { uploaded: pendingEjecuciones.length + pendingGastos.length };
}

// ── Fetch del servidor con merge inteligente ──────────────────────────────────
// Reglas de merge:
//   Proyectos:  server gana si `actualizadoEn` server ≥ local, o si local ya está sincronizado.
//   Partidas:   server siempre gana (son read-only post-importación).
//   Ejecuciones/Gastos: append-only — el server agrega los suyos, NO sobreescribe
//               items locales con `sincronizado: false` (cambios offline del usuario).

export async function fetchAllFromCloud(): Promise<void> {
  const token = localStorage.getItem('obratrack_token');
  if (!token) return;

  const response = await axios.get('/api/sync', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const {
    proyectos: sProyectos = [],
    partidas: sPartidas = [],
    ejecuciones: sEjecuciones = [],
    gastos: sGastos = [],
  } = response.data;

  // Obtener IDs de items pendientes locales para protegerlos del sobreescritura
  const [pendingEj, pendingGa] = await Promise.all([
    db.ejecuciones.filter(e => !e.sincronizado).toArray(),
    db.gastos.filter(g => !g.sincronizado).toArray(),
  ]);
  const pendingEjIds = new Set(pendingEj.map(e => e.id));
  const pendingGaIds = new Set(pendingGa.map(g => g.id));

  await db.transaction('rw', db.proyectos, db.partidas, db.ejecuciones, db.gastos, async () => {
    // Proyectos: merge por timestamp
    for (const sp of sProyectos) {
      const local = await db.proyectos.get(sp.id);
      const serverIsNewer = !local || new Date(sp.actualizadoEn) >= new Date(local.actualizadoEn);
      const localHasOfflineChanges = local && !local.sincronizado;

      if (!localHasOfflineChanges || serverIsNewer) {
        await db.proyectos.put({ ...sp, sincronizado: true });
      }
    }

    // Partidas: server siempre gana (importación masiva, read-only)
    if (sPartidas.length) {
      await db.partidas.bulkPut(sPartidas);
    }

    // Ejecuciones: agregar solo las que no existen localmente como pendientes
    const ejToAdd = sEjecuciones.filter((e: any) => !pendingEjIds.has(e.id));
    if (ejToAdd.length) await db.ejecuciones.bulkPut(ejToAdd);

    // Gastos: ídem
    const gaToAdd = sGastos.filter((g: any) => !pendingGaIds.has(g.id));
    if (gaToAdd.length) await db.gastos.bulkPut(gaToAdd);
  });
}

// ── Descarta TODOS los cambios pendientes (todas los proyectos) ───────────────
// Usar cuando el usuario quiere volver al estado del servidor.

export async function descartarTodosLosPendientes(): Promise<number> {
  const [pendingEj, pendingGa] = await Promise.all([
    db.ejecuciones.filter(e => !e.sincronizado).toArray(),
    db.gastos.filter(g => !g.sincronizado).toArray(),
  ]);

  const count = pendingEj.length + pendingGa.length;
  if (count === 0) return 0;

  await db.transaction('rw', db.ejecuciones, db.gastos, async () => {
    await Promise.all([
      ...pendingEj.map(e => db.ejecuciones.delete(e.id)),
      ...pendingGa.map(g => db.gastos.delete(g.id)),
    ]);
  });

  return count;
}

// ── Servicio legacy (mantenido por compatibilidad interna) ────────────────────

export const cloudSyncService: CloudSyncService = {
  async syncToCloud(_proyectoId: string): Promise<SyncResult> {
    try {
      const { uploaded } = await syncAllToCloud();
      return { success: true, sincronizados: uploaded, errores: [], timestamp: new Date().toISOString() };
    } catch (e: any) {
      return { success: false, sincronizados: 0, errores: [e?.message ?? 'Error'], timestamp: new Date().toISOString() };
    }
  },

  async fetchFromCloud(_proyectoId: string): Promise<SyncResult> {
    try {
      await fetchAllFromCloud();
      return { success: true, sincronizados: 0, errores: [], timestamp: new Date().toISOString() };
    } catch (e: any) {
      return { success: false, sincronizados: 0, errores: [e?.message ?? 'Error'], timestamp: new Date().toISOString() };
    }
  },
};
