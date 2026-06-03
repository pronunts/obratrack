// ============================================================
// ObraTrack — Tipos Centrales v2 (Multi-Proyecto)
// Design: Blueprint Engineering
// Arquitectura: Proyectos → Capítulos → Partidas
// ============================================================

// ── Entidades de Dominio ──────────────────────────────────

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  fechaInicio: string;       // YYYY-MM-DD
  fechaFin?: string;         // YYYY-MM-DD
  monedaLocal: string;       // ej. "COP", "PEN", "BOB"
  tasaCambioDefault: number; // unidades de moneda local por 1 USD
  archivoOrigen?: string;    // nombre del archivo importado
  creadoEn: string;          // ISO timestamp
  actualizadoEn: string;     // ISO timestamp
  // Metadatos de sincronización
  sincronizado: boolean;
  remoteId?: string;         // ID en Supabase/Firebase cuando se conecte
}

export interface PartidaPresupuesto {
  id: string;
  proyectoId: string;        // FK → Proyecto
  capitulo: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadPlaneada: number;
  precioUnitarioUSD: number;
  precioTotalUSD: number;
  // Metadatos de sincronización
  sincronizado: boolean;
}

export interface RegistroEjecucion {
  id: string;
  proyectoId: string;        // FK → Proyecto (desnormalizado para queries rápidas)
  partidaId: string;
  fecha: string;             // YYYY-MM-DD
  cantidadEjecutada: number;
  observaciones?: string;
  sincronizado: boolean;
  creadoEn: string;          // ISO timestamp
}

export type Moneda = 'USD' | 'LOCAL';

export interface GastoDiario {
  id: string;
  proyectoId: string;        // FK → Proyecto
  partidaId: string;
  fecha: string;             // YYYY-MM-DD
  descripcion: string;
  monto: number;
  moneda: Moneda;
  tasaCambio: number;        // tasa usada en el momento del registro
  montoUSD: number;          // calculado: monto / tasaCambio si LOCAL
  categoria: 'material' | 'mano_obra' | 'equipo' | 'otro';
  sincronizado: boolean;
  creadoEn: string;
}

// ── Estado de la Aplicación ───────────────────────────────

export interface AppState {
  // Multi-proyecto
  proyectos: Proyecto[];
  proyectoActivoId: string | null;
  // Datos del proyecto activo (cargados en memoria)
  partidas: PartidaPresupuesto[];
  ejecuciones: RegistroEjecucion[];
  gastos: GastoDiario[];
  // Estado de sincronización
  pendientesSincronizacion: number;
  ultimaSincronizacion?: string; // ISO timestamp de la última sync exitosa
  isOnline: boolean;
  // Estado de carga inicial
  isLoading: boolean;
}

// Getter conveniente
export type ProyectoActivo = Proyecto | null;

// ── Resumen Calculado ─────────────────────────────────────

export interface ResumenPartida extends PartidaPresupuesto {
  cantidadEjecutadaTotal: number;
  porcentajeAvance: number;
  gastoRealUSD: number;
  desviacionUSD: number;
  desviacionPorcentaje: number;
  estado: 'ok' | 'alerta' | 'critico';
}

export interface ResumenProyecto {
  proyecto: Proyecto;
  totalPartidas: number;
  totalPresupuestadoUSD: number;
  totalGastadoUSD: number;
  avancePromedio: number;
  pendientesSincronizacion: number;
  ultimaActividad?: string; // ISO timestamp
}

// ── Imágenes de Obra ─────────────────────────────────────

export interface ImagenObra {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  fecha: string;        // YYYY-MM-DD
  ubicacion?: string;
  dataUrl: string;      // base64 data URL (almacenado en IndexedDB)
  creadoEn: string;     // ISO timestamp
}

// ── Share Snapshot (Dashboard Ejecutivo del Cliente) ─────

export interface ShareHito {
  label: string;
  estado: 'logrado' | 'en_curso' | 'proximo';
  pct: number;
}

export interface ShareImagen {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha: string;
  ubicacion?: string;
  dataUrl: string;
}

export interface ShareCurvaPoint {
  mes: string;
  planificado: number;
  real?: number;
}

export interface ShareSnapshot {
  proyecto: {
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    fechaInicio: string;
    fechaFin?: string;
    monedaLocal: string;
    tasaCambioDefault: number;
  };
  kpis: {
    avanceFisico: number;
    avanceFinanciero: number;
    totalPresupuestadoUSD: number;
    totalGastadoUSD: number;
    desviacionPct: number;
    totalPartidas: number;
    partidasCompletas: number;
    diasTranscurridos: number;
    diasRestantes: number | null;
  };
  curvaData: ShareCurvaPoint[];
  hitos: ShareHito[];
  imagenes: ShareImagen[];
  generadoEn: string;
}

// ── Resultado del Parser ──────────────────────────────────

export interface ParseResult {
  partidas: Omit<PartidaPresupuesto, 'proyectoId' | 'sincronizado'>[];
  errores: string[];
  advertencias: string[];
  totalFilas: number;
  filasOk: number;
  filasOmitidas: number;
  // Metadatos detectados del archivo
  meta: {
    formatoDetectado: 'mapre x' | 'generico' | 'desconocido';
    filaEncabezadoEncontrada?: number;
    columnasDetectadas: string[];
  };
}

// ── Servicios de Sincronización (preparados para Supabase/Firebase) ──

export interface SyncResult {
  success: boolean;
  sincronizados: number;
  errores: string[];
  timestamp: string;
}

export interface CloudSyncService {
  /**
   * Sube los registros pendientes al backend remoto.
   * Preparado para conectar con Supabase o Firebase en la siguiente fase.
   * @param proyectoId ID del proyecto a sincronizar
   */
  syncToCloud(proyectoId: string): Promise<SyncResult>;

  /**
   * Descarga los datos del backend y los fusiona con los locales.
   * Preparado para conectar con Supabase o Firebase en la siguiente fase.
   * @param proyectoId ID del proyecto a descargar
   */
  fetchFromCloud(proyectoId: string): Promise<SyncResult>;
}
