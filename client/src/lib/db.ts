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

// ── Servicio de Sincronización Cloud ─────────────────────
// Preparado para conectar con Supabase o Firebase en la siguiente fase.
// Los métodos están implementados como stubs que retornan un resultado exitoso
// simulado. En la siguiente fase, reemplazar el cuerpo con las llamadas reales.

export const cloudSyncService: CloudSyncService = {
  /**
   * Sube los registros pendientes al backend remoto.
   *
   * SIGUIENTE FASE — Implementación con Supabase:
   * ```ts
   * const { data, error } = await supabase
   *   .from('ejecuciones')
   *   .upsert(pendingEjecuciones, { onConflict: 'id' });
   * ```
   *
   * SIGUIENTE FASE — Implementación con Firebase:
   * ```ts
   * const batch = writeBatch(db);
   * pendingEjecuciones.forEach(e => {
   *   batch.set(doc(firestore, 'ejecuciones', e.id), e);
   * });
   * await batch.commit();
   * ```
   */
  async syncToCloud(proyectoId: string): Promise<SyncResult> {
    console.info(`[ObraTrack] syncToCloud() → proyectoId: ${proyectoId}`);
    console.info('[ObraTrack] TODO: Conectar con Supabase/Firebase en la siguiente fase');

    // Simular latencia de red
    await new Promise(r => setTimeout(r, 800));

    // Marcar como sincronizados localmente
    await markAllSynced(proyectoId);

    return {
      success: true,
      sincronizados: await db.ejecuciones.where('proyectoId').equals(proyectoId).count() +
                     await db.gastos.where('proyectoId').equals(proyectoId).count(),
      errores: [],
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Descarga los datos del backend y los fusiona con los locales.
   *
   * SIGUIENTE FASE — Implementación con Supabase:
   * ```ts
   * const { data } = await supabase
   *   .from('ejecuciones')
   *   .select('*')
   *   .eq('proyecto_id', proyectoId)
   *   .gt('updated_at', lastSyncTimestamp);
   * await db.ejecuciones.bulkPut(data);
   * ```
   */
  async fetchFromCloud(proyectoId: string): Promise<SyncResult> {
    console.info(`[ObraTrack] fetchFromCloud() → proyectoId: ${proyectoId}`);
    console.info('[ObraTrack] TODO: Conectar con Supabase/Firebase en la siguiente fase');

    // Simular latencia de red
    await new Promise(r => setTimeout(r, 600));

    return {
      success: true,
      sincronizados: 0,
      errores: [],
      timestamp: new Date().toISOString(),
    };
  },
};
