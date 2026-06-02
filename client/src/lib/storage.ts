// ============================================================
// ObraTrack — Capa de Persistencia (localStorage offline-first)
// Design: Blueprint Engineering
// ============================================================

import type {
  Proyecto,
  PartidaPresupuesto,
  RegistroEjecucion,
  GastoDiario,
} from './types';

const KEYS = {
  PROYECTO: 'obratrack_proyecto',
  PARTIDAS: 'obratrack_partidas',
  EJECUCIONES: 'obratrack_ejecuciones',
  GASTOS: 'obratrack_gastos',
} as const;

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[ObraTrack] Error guardando ${key}:`, e);
  }
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`[ObraTrack] Error cargando ${key}:`, e);
    return fallback;
  }
}

// ── Proyecto ──────────────────────────────────────────────
export const proyectoStorage = {
  get: () => load<Proyecto | null>(KEYS.PROYECTO, null),
  set: (p: Proyecto) => save(KEYS.PROYECTO, p),
  clear: () => localStorage.removeItem(KEYS.PROYECTO),
};

// ── Partidas ──────────────────────────────────────────────
export const partidasStorage = {
  get: () => load<PartidaPresupuesto[]>(KEYS.PARTIDAS, []),
  set: (items: PartidaPresupuesto[]) => save(KEYS.PARTIDAS, items),
  clear: () => localStorage.removeItem(KEYS.PARTIDAS),
};

// ── Ejecuciones ───────────────────────────────────────────
export const ejecucionesStorage = {
  get: () => load<RegistroEjecucion[]>(KEYS.EJECUCIONES, []),
  set: (items: RegistroEjecucion[]) => save(KEYS.EJECUCIONES, items),
  add: (item: RegistroEjecucion) => {
    const current = ejecucionesStorage.get();
    const idx = current.findIndex((e) => e.id === item.id);
    if (idx >= 0) current[idx] = item;
    else current.push(item);
    save(KEYS.EJECUCIONES, current);
  },
  remove: (id: string) => {
    const current = ejecucionesStorage.get().filter((e) => e.id !== id);
    save(KEYS.EJECUCIONES, current);
  },
  clear: () => localStorage.removeItem(KEYS.EJECUCIONES),
};

// ── Gastos ────────────────────────────────────────────────
export const gastosStorage = {
  get: () => load<GastoDiario[]>(KEYS.GASTOS, []),
  set: (items: GastoDiario[]) => save(KEYS.GASTOS, items),
  add: (item: GastoDiario) => {
    const current = gastosStorage.get();
    const idx = current.findIndex((g) => g.id === item.id);
    if (idx >= 0) current[idx] = item;
    else current.push(item);
    save(KEYS.GASTOS, current);
  },
  remove: (id: string) => {
    const current = gastosStorage.get().filter((g) => g.id !== id);
    save(KEYS.GASTOS, current);
  },
  clear: () => localStorage.removeItem(KEYS.GASTOS),
};

// ── Utilidades ────────────────────────────────────────────
export function clearAllData(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function countPendientes(): number {
  const ej = ejecucionesStorage.get().filter((e) => !e.sincronizado).length;
  const ga = gastosStorage.get().filter((g) => !g.sincronizado).length;
  return ej + ga;
}
