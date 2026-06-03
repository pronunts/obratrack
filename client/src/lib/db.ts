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
  ImagenObra,
  SyncResult,
  CloudSyncService,
} from './types';

// ── Definición de la Base de Datos ───────────────────────

export class ObraTrackDB extends Dexie {
  proyectos!: Table<Proyecto, string>;
  partidas!: Table<PartidaPresupuesto, string>;
  ejecuciones!: Table<RegistroEjecucion, string>;
  gastos!: Table<GastoDiario, string>;
  imagenes!: Table<ImagenObra, string>;

  constructor() {
    super('ObraTrackDB');

    this.version(1).stores({
      proyectos:   '&id, nombre, creadoEn, sincronizado',
      partidas:    '&id, proyectoId, capitulo, codigo, sincronizado',
      ejecuciones: '&id, proyectoId, partidaId, fecha, sincronizado, creadoEn',
      gastos:      '&id, proyectoId, partidaId, fecha, sincronizado, creadoEn',
    });

    this.version(2).stores({
      proyectos:   '&id, nombre, creadoEn, sincronizado',
      partidas:    '&id, proyectoId, capitulo, codigo, sincronizado',
      ejecuciones: '&id, proyectoId, partidaId, fecha, sincronizado, creadoEn',
      gastos:      '&id, proyectoId, partidaId, fecha, sincronizado, creadoEn',
      imagenes:    '&id, proyectoId, fecha, creadoEn',
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

// ── Fetch + Reconcile con el servidor ────────────────────────────────────────
//
// ANALOGÍA OBRA CIVIL:
//   El servidor es el "Libro de Actas Notarial" — la versión oficial.
//   Cada dispositivo tiene una "Copia de Campo".
//   Esta función es el proceso de "actualizar la copia de campo":
//     1. PULL: trae todo lo que tiene el acta oficial  → agrega/actualiza local
//     2. RECONCILE: lo que está en la copia de campo pero YA NO está en el
//        acta oficial fue anulado/eliminado → se tacha de la copia de campo
//
// REGLAS de qué se puede borrar localmente:
//   - Solo se borra si sincronizado = true  (ya fue reconocido por el servidor)
//   - NUNCA se borra si sincronizado = false (son cambios pendientes de elevar
//     al acta — equivale a una hoja de campo aún no firmada)

export async function fetchAllFromCloud(): Promise<void> {
  const token = localStorage.getItem('obratrack_token');
  if (!token) return;

  const response = await axios.get('/api/sync', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const {
    proyectos: sProyectos = [],
    partidas:  sPartidas  = [],
    ejecuciones: sEjecuciones = [],
    gastos:    sGastos    = [],
  } = response.data;

  // IDs que el servidor reconoce como vigentes
  const serverProyectoIds  = new Set<string>(sProyectos.map((p: any) => p.id));
  const serverPartidaIds   = new Set<string>(sPartidas.map((p: any) => p.id));
  const serverEjecucionIds = new Set<string>(sEjecuciones.map((e: any) => e.id));
  const serverGastoIds     = new Set<string>(sGastos.map((g: any) => g.id));

  // Registros locales que el servidor ya no tiene → fueron eliminados en otro dispositivo
  // Solo tocamos los que tienen sincronizado=true (los pendientes son offline y los protegemos)
  const [
    localProyectosSynced,
    localPartidasSynced,
    localEjecucionesSynced,
    localGastosSynced,
  ] = await Promise.all([
    db.proyectos.filter(p => !!p.sincronizado).toArray(),
    db.partidas.filter(p => !!p.sincronizado).toArray(),
    db.ejecuciones.filter(e => !!e.sincronizado).toArray(),
    db.gastos.filter(g => !!g.sincronizado).toArray(),
  ]);

  const toDeleteProyectos  = localProyectosSynced.filter(p => !serverProyectoIds.has(p.id)).map(p => p.id);
  const toDeletePartidas   = localPartidasSynced.filter(p => !serverPartidaIds.has(p.id)).map(p => p.id);
  const toDeleteEjecuciones = localEjecucionesSynced.filter(e => !serverEjecucionIds.has(e.id)).map(e => e.id);
  const toDeleteGastos     = localGastosSynced.filter(g => !serverGastoIds.has(g.id)).map(g => g.id);

  // IDs pendientes (no subidos aún) — no los pisamos con datos del server
  const pendingEjIds = new Set(
    (await db.ejecuciones.filter(e => !e.sincronizado).toArray()).map(e => e.id)
  );
  const pendingGaIds = new Set(
    (await db.gastos.filter(g => !g.sincronizado).toArray()).map(g => g.id)
  );

  await db.transaction('rw', db.proyectos, db.partidas, db.ejecuciones, db.gastos, async () => {
    // ── Paso 1: eliminar lo que el servidor ya no tiene ───────────────────
    if (toDeleteProyectos.length)   await db.proyectos.bulkDelete(toDeleteProyectos);
    if (toDeletePartidas.length)    await db.partidas.bulkDelete(toDeletePartidas);
    if (toDeleteEjecuciones.length) await db.ejecuciones.bulkDelete(toDeleteEjecuciones);
    if (toDeleteGastos.length)      await db.gastos.bulkDelete(toDeleteGastos);

    // ── Paso 2: agregar / actualizar con datos del servidor ───────────────
    // Proyectos: server gana si es más nuevo O si ya estaba sincronizado
    for (const sp of sProyectos) {
      const local = await db.proyectos.get(sp.id);
      const offlinePendiente = local && !local.sincronizado;
      const serverEsMasNuevo = !local || new Date(sp.actualizadoEn) >= new Date(local.actualizadoEn);
      if (!offlinePendiente || serverEsMasNuevo) {
        await db.proyectos.put({ ...sp, sincronizado: true });
      }
    }

    // Partidas: el servidor siempre manda (provienen de importación CSV)
    if (sPartidas.length) await db.partidas.bulkPut(sPartidas);

    // Ejecuciones y Gastos: agregar del server, pero no pisar los pendientes locales
    const ejToAdd = sEjecuciones.filter((e: any) => !pendingEjIds.has(e.id));
    const gaToAdd = sGastos.filter((g: any) => !pendingGaIds.has(g.id));
    if (ejToAdd.length) await db.ejecuciones.bulkPut(ejToAdd);
    if (gaToAdd.length) await db.gastos.bulkPut(gaToAdd);
  });
}

/** Elimina un proyecto del servidor en la nube */
export async function deleteProyectoFromCloud(proyectoId: string): Promise<void> {
  const token = localStorage.getItem('obratrack_token');
  if (!token) return;
  await axios.delete(`/api/sync/proyecto/${proyectoId}`, {
    headers: { Authorization: `Bearer ${token}` },
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

// ── Imágenes de Obra ─────────────────────────────────────

export async function loadImagenes(proyectoId: string): Promise<ImagenObra[]> {
  return db.imagenes.where('proyectoId').equals(proyectoId).sortBy('fecha');
}

export async function addImagen(imagen: ImagenObra): Promise<void> {
  await db.imagenes.put(imagen);
}

export async function deleteImagen(id: string): Promise<void> {
  await db.imagenes.delete(id);
}

/** Elimina todas las imágenes de un proyecto (llamado al eliminar el proyecto) */
export async function deleteImagenesProyecto(proyectoId: string): Promise<void> {
  await db.imagenes.where('proyectoId').equals(proyectoId).delete();
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
