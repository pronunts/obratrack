// ============================================================
// ObraTrack — Contexto Global v2 (Multi-Proyecto + IndexedDB)
// Design: Blueprint Engineering
// Persistencia: Dexie.js (IndexedDB) — sin límite de 5MB
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { nanoid } from 'nanoid';
import type {
  AppState,
  Proyecto,
  PartidaPresupuesto,
  RegistroEjecucion,
  GastoDiario,
  ResumenPartida,
  ResumenProyecto,
  ParseResult,
} from '@/lib/types';
import {
  db,
  getUIPrefs,
  setUIPrefs,
  loadProyectos,
  loadProyectoData,
  countAllPendientes,
  deleteProyecto as dbDeleteProyecto,
  importarPartidasBulk,
  fetchAllFromCloud,
  syncAllToCloud,
  descartarTodosLosPendientes,
} from '@/lib/db';
import { useAuth } from './AuthContext';

// ── Estado Inicial ────────────────────────────────────────

const initialState: AppState = {
  proyectos: [],
  proyectoActivoId: null,
  partidas: [],
  ejecuciones: [],
  gastos: [],
  pendientesSincronizacion: 0,
  ultimaSincronizacion: localStorage.getItem('obratrack_ultima_sync') ?? undefined,
  isOnline: navigator.onLine,
  isLoading: true,
};

// ── Acciones ──────────────────────────────────────────────

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_ULTIMA_SINCRONIZACION'; payload: string }
  | { type: 'INIT_DONE'; payload: Omit<AppState, 'isOnline'> }
  | { type: 'SET_PROYECTOS'; payload: Proyecto[] }
  | { type: 'ADD_PROYECTO'; payload: Proyecto }
  | { type: 'UPDATE_PROYECTO'; payload: Proyecto }
  | { type: 'REMOVE_PROYECTO'; payload: string }
  | { type: 'SET_PROYECTO_ACTIVO'; payload: { id: string; partidas: PartidaPresupuesto[]; ejecuciones: RegistroEjecucion[]; gastos: GastoDiario[] } }
  | { type: 'SET_PARTIDAS'; payload: PartidaPresupuesto[] }
  | { type: 'ADD_EJECUCION'; payload: RegistroEjecucion }
  | { type: 'UPDATE_EJECUCION'; payload: RegistroEjecucion }
  | { type: 'DELETE_EJECUCION'; payload: string }
  | { type: 'ADD_GASTO'; payload: GastoDiario }
  | { type: 'UPDATE_GASTO'; payload: GastoDiario }
  | { type: 'DELETE_GASTO'; payload: string }
  | { type: 'MARK_ALL_SYNCED' }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_PENDIENTES'; payload: number };

function calcPendientes(ejecuciones: RegistroEjecucion[], gastos: GastoDiario[]): number {
  return ejecuciones.filter(e => !e.sincronizado).length +
         gastos.filter(g => !g.sincronizado).length;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true };

    case 'SET_ULTIMA_SINCRONIZACION':
      return { ...state, ultimaSincronizacion: action.payload };

    case 'INIT_DONE':
      return { ...state, ...action.payload, isLoading: false };

    case 'SET_PROYECTOS':
      return { ...state, proyectos: action.payload };

    case 'ADD_PROYECTO':
      return { ...state, proyectos: [action.payload, ...state.proyectos] };

    case 'UPDATE_PROYECTO':
      return {
        ...state,
        proyectos: state.proyectos.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'REMOVE_PROYECTO': {
      const proyectos = state.proyectos.filter(p => p.id !== action.payload);
      const isActive = state.proyectoActivoId === action.payload;
      return {
        ...state,
        proyectos,
        proyectoActivoId: isActive ? null : state.proyectoActivoId,
        partidas: isActive ? [] : state.partidas,
        ejecuciones: isActive ? [] : state.ejecuciones,
        gastos: isActive ? [] : state.gastos,
        pendientesSincronizacion: isActive ? 0 : state.pendientesSincronizacion,
      };
    }

    case 'SET_PROYECTO_ACTIVO':
      return {
        ...state,
        proyectoActivoId: action.payload.id,
        partidas: action.payload.partidas,
        ejecuciones: action.payload.ejecuciones,
        gastos: action.payload.gastos,
        pendientesSincronizacion: calcPendientes(
          action.payload.ejecuciones,
          action.payload.gastos
        ),
      };

    case 'SET_PARTIDAS':
      return { ...state, partidas: action.payload };

    case 'ADD_EJECUCION': {
      const next = [...state.ejecuciones, action.payload];
      return { ...state, ejecuciones: next, pendientesSincronizacion: calcPendientes(next, state.gastos) };
    }

    case 'UPDATE_EJECUCION': {
      const next = state.ejecuciones.map(e => e.id === action.payload.id ? action.payload : e);
      return { ...state, ejecuciones: next, pendientesSincronizacion: calcPendientes(next, state.gastos) };
    }

    case 'DELETE_EJECUCION': {
      const next = state.ejecuciones.filter(e => e.id !== action.payload);
      return { ...state, ejecuciones: next, pendientesSincronizacion: calcPendientes(next, state.gastos) };
    }

    case 'ADD_GASTO': {
      const next = [...state.gastos, action.payload];
      return { ...state, gastos: next, pendientesSincronizacion: calcPendientes(state.ejecuciones, next) };
    }

    case 'UPDATE_GASTO': {
      const next = state.gastos.map(g => g.id === action.payload.id ? action.payload : g);
      return { ...state, gastos: next, pendientesSincronizacion: calcPendientes(state.ejecuciones, next) };
    }

    case 'DELETE_GASTO': {
      const next = state.gastos.filter(g => g.id !== action.payload);
      return { ...state, gastos: next, pendientesSincronizacion: calcPendientes(state.ejecuciones, next) };
    }

    case 'MARK_ALL_SYNCED': {
      const ej = state.ejecuciones.map(e => ({ ...e, sincronizado: true }));
      const ga = state.gastos.map(g => ({ ...g, sincronizado: true }));
      return { ...state, ejecuciones: ej, gastos: ga, pendientesSincronizacion: 0 };
    }

    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };

    case 'SET_PENDIENTES':
      return { ...state, pendientesSincronizacion: action.payload };

    default:
      return state;
  }
}

// ── Interfaz del Contexto ─────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Proyecto activo (getter conveniente)
  proyectoActivo: Proyecto | null;
  // Helpers calculados
  getResumenPartidas: () => ResumenPartida[];
  getResumenPartida: (id: string) => ResumenPartida | undefined;
  getResumenProyectos: () => ResumenProyecto[];
  // Acciones de proyectos
  crearProyecto: (data: Omit<Proyecto, 'id' | 'creadoEn' | 'actualizadoEn' | 'sincronizado'>) => Promise<Proyecto>;
  seleccionarProyecto: (id: string) => Promise<void>;
  eliminarProyecto: (id: string) => Promise<void>;
  actualizarProyecto: (proyecto: Proyecto) => Promise<void>;
  // Acciones de presupuesto
  importarPresupuesto: (result: ParseResult, proyectoData?: Partial<Proyecto>) => Promise<void>;
  // Acciones de ejecución
  registrarEjecucion: (partidaId: string, cantidad: number, fecha: string, observaciones?: string) => Promise<void>;
  eliminarEjecucion: (id: string) => Promise<void>;
  // Acciones de gastos
  registrarGasto: (
    partidaId: string,
    descripcion: string,
    monto: number,
    moneda: 'USD' | 'LOCAL',
    tasaCambio: number,
    categoria: GastoDiario['categoria'],
    fecha: string
  ) => Promise<void>;
  eliminarGasto: (id: string) => Promise<void>;
  // Sincronización
  sincronizar: () => Promise<void>;
  descartarCambiosLocales: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();
  const prevUserIdRef = useRef<number | null | undefined>(undefined);

  // ── Inicialización: cloud fetch + IndexedDB ───────────
  useEffect(() => {
    async function init() {
      dispatch({ type: 'SET_LOADING' });
      try {
        // Si hay token, traer datos del servidor primero (sync cross-device)
        const token = localStorage.getItem('obratrack_token');
        if (token) {
          try {
            await fetchAllFromCloud();
          } catch (e) {
            console.warn('[ObraTrack] Cloud fetch falló, usando datos locales:', e);
          }
        }

        const proyectos = await loadProyectos();
        const prefs = getUIPrefs();
        const pendientes = await countAllPendientes();

        let proyectoActivoId = prefs.proyectoActivoId;
        let partidas: PartidaPresupuesto[] = [];
        let ejecuciones: RegistroEjecucion[] = [];
        let gastos: GastoDiario[] = [];

        if (proyectoActivoId && proyectos.some(p => p.id === proyectoActivoId)) {
          const data = await loadProyectoData(proyectoActivoId);
          partidas = data.partidas;
          ejecuciones = data.ejecuciones;
          gastos = data.gastos;
        } else {
          proyectoActivoId = null;
        }

        dispatch({
          type: 'INIT_DONE',
          payload: {
            proyectos,
            proyectoActivoId,
            partidas,
            ejecuciones,
            gastos,
            pendientesSincronizacion: pendientes,
            isLoading: false,
          },
        });
      } catch (err) {
        console.error('[ObraTrack] Error inicializando:', err);
        dispatch({
          type: 'INIT_DONE',
          payload: { ...initialState, isLoading: false },
        });
      }
    }

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // Inicializa en mount (undefined → any) o cuando el usuario hace login (null → number)
    if (prevUserId === undefined || (currentUserId !== null && prevUserId === null)) {
      prevUserIdRef.current = currentUserId;
      init();
    } else {
      prevUserIdRef.current = currentUserId;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Conectividad ──────────────────────────────────────
  useEffect(() => {
    const on = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const off = () => dispatch({ type: 'SET_ONLINE', payload: false });
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Getter: proyecto activo ───────────────────────────
  const proyectoActivo = state.proyectos.find(p => p.id === state.proyectoActivoId) ?? null;

  // ── Helpers calculados ────────────────────────────────
  const getResumenPartidas = useCallback((): ResumenPartida[] => {
    return state.partidas.map(p => {
      const ejPartida = state.ejecuciones.filter(e => e.partidaId === p.id);
      const gastosPartida = state.gastos.filter(g => g.partidaId === p.id);
      const cantidadEjecutadaTotal = ejPartida.reduce((s, e) => s + e.cantidadEjecutada, 0);
      const porcentajeAvance = p.cantidadPlaneada > 0
        ? Math.min((cantidadEjecutadaTotal / p.cantidadPlaneada) * 100, 999)
        : 0;
      const gastoRealUSD = gastosPartida.reduce((s, g) => s + g.montoUSD, 0);
      const desviacionUSD = gastoRealUSD - p.precioTotalUSD;
      const desviacionPorcentaje = p.precioTotalUSD > 0
        ? (desviacionUSD / p.precioTotalUSD) * 100
        : 0;
      let estado: ResumenPartida['estado'] = 'ok';
      if (desviacionPorcentaje > 20) estado = 'critico';
      else if (desviacionPorcentaje > 10) estado = 'alerta';
      return { ...p, cantidadEjecutadaTotal, porcentajeAvance, gastoRealUSD, desviacionUSD, desviacionPorcentaje, estado };
    });
  }, [state.partidas, state.ejecuciones, state.gastos]);

  const getResumenPartida = useCallback(
    (id: string) => getResumenPartidas().find(r => r.id === id),
    [getResumenPartidas]
  );

  const getResumenProyectos = useCallback((): ResumenProyecto[] => {
    return state.proyectos.map(proyecto => {
      // Para el proyecto activo usamos datos en memoria; para los demás solo contamos
      const isActive = proyecto.id === state.proyectoActivoId;
      const totalPresupuestadoUSD = isActive
        ? state.partidas.reduce((s, p) => s + p.precioTotalUSD, 0)
        : 0; // se podría cargar async, pero para el dashboard es suficiente
      const totalGastadoUSD = isActive
        ? state.gastos.reduce((s, g) => s + g.montoUSD, 0)
        : 0;
      const avancePromedio = isActive && state.partidas.length > 0
        ? getResumenPartidas().reduce((s, r) => s + Math.min(r.porcentajeAvance, 100), 0) / state.partidas.length
        : 0;
      const pendientesSincronizacion = isActive ? state.pendientesSincronizacion : 0;
      const ultimaActividad = isActive
        ? [...state.ejecuciones, ...state.gastos]
            .map(r => r.creadoEn)
            .sort()
            .reverse()[0]
        : undefined;
      return {
        proyecto,
        totalPartidas: isActive ? state.partidas.length : 0,
        totalPresupuestadoUSD,
        totalGastadoUSD,
        avancePromedio,
        pendientesSincronizacion,
        ultimaActividad,
      };
    });
  }, [state, getResumenPartidas]);

  // ── Acciones de Proyectos ─────────────────────────────

  const crearProyecto = useCallback(async (
    data: Omit<Proyecto, 'id' | 'creadoEn' | 'actualizadoEn' | 'sincronizado'>
  ): Promise<Proyecto> => {
    const now = new Date().toISOString();
    const proyecto: Proyecto = {
      ...data,
      id: nanoid(),
      creadoEn: now,
      actualizadoEn: now,
      sincronizado: false,
    };
    await db.proyectos.put(proyecto);
    dispatch({ type: 'ADD_PROYECTO', payload: proyecto });
    return proyecto;
  }, []);

  const seleccionarProyecto = useCallback(async (id: string) => {
    const data = await loadProyectoData(id);
    dispatch({
      type: 'SET_PROYECTO_ACTIVO',
      payload: { id, ...data },
    });
    setUIPrefs({ proyectoActivoId: id });
  }, []);

  const eliminarProyecto = useCallback(async (id: string) => {
    await dbDeleteProyecto(id);
    dispatch({ type: 'REMOVE_PROYECTO', payload: id });
    if (getUIPrefs().proyectoActivoId === id) {
      setUIPrefs({ proyectoActivoId: null });
    }
  }, []);

  const actualizarProyecto = useCallback(async (proyecto: Proyecto) => {
    const updated = { ...proyecto, actualizadoEn: new Date().toISOString() };
    await db.proyectos.put(updated);
    dispatch({ type: 'UPDATE_PROYECTO', payload: updated });
  }, []);

  // ── Importar Presupuesto ──────────────────────────────

  const importarPresupuesto = useCallback(async (
    result: ParseResult,
    proyectoData?: Partial<Proyecto>
  ) => {
    const now = new Date().toISOString();
    let proyectoId = state.proyectoActivoId;

    // Si no hay proyecto activo o se pasan datos nuevos, crear/actualizar
    if (!proyectoId || proyectoData) {
      const existing = proyectoId
        ? state.proyectos.find(p => p.id === proyectoId)
        : null;
      const proyecto: Proyecto = {
        id: proyectoId ?? nanoid(),
        nombre: proyectoData?.nombre ?? existing?.nombre ?? 'Proyecto Sin Nombre',
        descripcion: proyectoData?.descripcion ?? existing?.descripcion,
        ubicacion: proyectoData?.ubicacion ?? existing?.ubicacion,
        fechaInicio: proyectoData?.fechaInicio ?? existing?.fechaInicio ?? now.split('T')[0],
        fechaFin: proyectoData?.fechaFin ?? existing?.fechaFin,
        monedaLocal: proyectoData?.monedaLocal ?? existing?.monedaLocal ?? 'COP',
        tasaCambioDefault: proyectoData?.tasaCambioDefault ?? existing?.tasaCambioDefault ?? 4000,
        archivoOrigen: proyectoData?.archivoOrigen ?? existing?.archivoOrigen,
        creadoEn: existing?.creadoEn ?? now,
        actualizadoEn: now,
        sincronizado: false,
      };
      await db.proyectos.put(proyecto);
      proyectoId = proyecto.id;

      if (existing) {
        dispatch({ type: 'UPDATE_PROYECTO', payload: proyecto });
      } else {
        dispatch({ type: 'ADD_PROYECTO', payload: proyecto });
      }
      setUIPrefs({ proyectoActivoId: proyectoId });
    }

    // Agregar proyectoId y sincronizado a las partidas
    const partidas: PartidaPresupuesto[] = result.partidas.map(p => ({
      ...p,
      proyectoId: proyectoId!,
      sincronizado: false,
    }));

    await importarPartidasBulk(proyectoId!, partidas);
    dispatch({ type: 'SET_PARTIDAS', payload: partidas });
    dispatch({ type: 'SET_PROYECTO_ACTIVO', payload: {
      id: proyectoId!,
      partidas,
      ejecuciones: state.ejecuciones,
      gastos: state.gastos,
    }});
  }, [state.proyectoActivoId, state.proyectos, state.ejecuciones, state.gastos]);

  // ── Acciones de Ejecución ─────────────────────────────

  const registrarEjecucion = useCallback(async (
    partidaId: string,
    cantidad: number,
    fecha: string,
    observaciones?: string
  ) => {
    if (!state.proyectoActivoId) return;
    const ejecucion: RegistroEjecucion = {
      id: nanoid(),
      proyectoId: state.proyectoActivoId,
      partidaId,
      fecha,
      cantidadEjecutada: cantidad,
      observaciones,
      sincronizado: false,
      creadoEn: new Date().toISOString(),
    };
    await db.ejecuciones.put(ejecucion);
    dispatch({ type: 'ADD_EJECUCION', payload: ejecucion });
  }, [state.proyectoActivoId]);

  const eliminarEjecucion = useCallback(async (id: string) => {
    await db.ejecuciones.delete(id);
    dispatch({ type: 'DELETE_EJECUCION', payload: id });
  }, []);

  // ── Acciones de Gastos ────────────────────────────────

  const registrarGasto = useCallback(async (
    partidaId: string,
    descripcion: string,
    monto: number,
    moneda: 'USD' | 'LOCAL',
    tasaCambio: number,
    categoria: GastoDiario['categoria'],
    fecha: string
  ) => {
    if (!state.proyectoActivoId) return;
    const montoUSD = moneda === 'USD' ? monto : monto / tasaCambio;
    const gasto: GastoDiario = {
      id: nanoid(),
      proyectoId: state.proyectoActivoId,
      partidaId,
      fecha,
      descripcion,
      monto,
      moneda,
      tasaCambio,
      montoUSD,
      categoria,
      sincronizado: false,
      creadoEn: new Date().toISOString(),
    };
    await db.gastos.put(gasto);
    dispatch({ type: 'ADD_GASTO', payload: gasto });
  }, [state.proyectoActivoId]);

  const eliminarGasto = useCallback(async (id: string) => {
    await db.gastos.delete(id);
    dispatch({ type: 'DELETE_GASTO', payload: id });
  }, []);

  // ── Sincronización ────────────────────────────────────

  // Helper para registrar timestamp y recargar estado tras un sync exitoso
  const postSyncReload = useCallback(async () => {
    const proyectos = await loadProyectos();
    dispatch({ type: 'SET_PROYECTOS', payload: proyectos });

    if (state.proyectoActivoId && proyectos.some(p => p.id === state.proyectoActivoId)) {
      const data = await loadProyectoData(state.proyectoActivoId);
      dispatch({ type: 'SET_PROYECTO_ACTIVO', payload: { id: state.proyectoActivoId, ...data } });
    }

    const pendientes = await countAllPendientes();
    dispatch({ type: 'SET_PENDIENTES', payload: pendientes });

    const now = new Date().toISOString();
    localStorage.setItem('obratrack_ultima_sync', now);
    dispatch({ type: 'SET_ULTIMA_SINCRONIZACION', payload: now });
  }, [state.proyectoActivoId]);

  // Ciclo completo: sube pendientes → baja cambios del server → reload
  const sincronizar = useCallback(async () => {
    await syncAllToCloud();
    await fetchAllFromCloud();
    await postSyncReload();
  }, [postSyncReload]);

  // Descarta todos los cambios offline y vuelve al estado del servidor
  const descartarCambiosLocales = useCallback(async () => {
    await descartarTodosLosPendientes();
    await fetchAllFromCloud();
    await postSyncReload();
  }, [postSyncReload]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      proyectoActivo,
      getResumenPartidas,
      getResumenPartida,
      getResumenProyectos,
      crearProyecto,
      seleccionarProyecto,
      eliminarProyecto,
      actualizarProyecto,
      importarPresupuesto,
      registrarEjecucion,
      eliminarEjecucion,
      registrarGasto,
      eliminarGasto,
      sincronizar,
      descartarCambiosLocales,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
