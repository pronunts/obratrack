import type { PartidaPresupuesto, RegistroEjecucion, ShareCurvaPoint } from './types';

const PUNTOS = 24;

/** Genera la curva S planificada (sigmoidea) entre dos fechas. */
export function generarCurvaPlanificada(
  inicio: Date,
  fin: Date,
): { mes: string; planificado: number }[] {
  const resultado: { mes: string; planificado: number }[] = [];
  const duracionMs = fin.getTime() - inicio.getTime();
  const k = 10;
  const sigMin = 1 / (1 + Math.exp(-k * (0 - 0.5)));
  const sigMax = 1 / (1 + Math.exp(-k * (1 - 0.5)));

  for (let i = 0; i <= PUNTOS; i++) {
    const t = i / PUNTOS;
    const s = 1 / (1 + Math.exp(-k * (t - 0.5)));
    const pct = ((s - sigMin) / (sigMax - sigMin)) * 100;
    const fecha = new Date(inicio.getTime() + duracionMs * t);
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    resultado.push({ mes, planificado: Math.round(pct * 10) / 10 });
  }
  return resultado;
}

/**
 * Genera el array combinado planificado + real para el gráfico.
 * Usa comparación directa por fecha YYYY-MM-DD para evitar problemas
 * de locale entre Node.js y diferentes browsers.
 */
export function buildCurvaData(
  partidas: PartidaPresupuesto[],
  ejecuciones: RegistroEjecucion[],
  fechaInicio: string,
  fechaFin?: string,
): ShareCurvaPoint[] {
  const inicio = new Date(fechaInicio + 'T12:00:00');
  const fin    = fechaFin
    ? new Date(fechaFin + 'T12:00:00')
    : new Date(inicio.getTime() + 365 * 24 * 60 * 60 * 1000);

  const duracionMs = fin.getTime() - inicio.getTime();
  const curvaPlan  = generarCurvaPlanificada(inicio, fin);
  const hoy        = new Date();

  const totalPeso = partidas.reduce((s, p) => s + p.precioTotalUSD, 0);

  // Sin presupuesto o sin ejecuciones → no hay línea real
  if (totalPeso === 0 || ejecuciones.length === 0) {
    return curvaPlan.map(p => ({ ...p, real: undefined }));
  }

  return curvaPlan.map(({ mes, planificado }, i) => {
    const fechaPunto = new Date(inicio.getTime() + duracionMs * (i / PUNTOS));

    // Puntos futuros no se dibujan
    if (fechaPunto > hoy) return { mes, planificado, real: undefined };

    // Todas las ejecuciones hasta esta fecha (YYYY-MM-DD ≤ cutoff)
    const cutoff = fechaPunto.toISOString().slice(0, 10);
    const ejHasta = ejecuciones.filter(ej => ej.fecha <= cutoff);

    // Si no hay ejecuciones hasta este punto, no dibujar
    if (ejHasta.length === 0) return { mes, planificado, real: undefined };

    // Acumular cantidad ejecutada por partida
    const ejPorPartida = new Map<string, number>();
    for (const ej of ejHasta) {
      ejPorPartida.set(ej.partidaId, (ejPorPartida.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada);
    }

    // Avance ponderado por presupuesto
    let avancePonderado = 0;
    for (const p of partidas) {
      const ejecutado = ejPorPartida.get(p.id) ?? 0;
      const pct = p.cantidadPlaneada > 0 ? Math.min(ejecutado / p.cantidadPlaneada, 1) : 0;
      avancePonderado += pct * (p.precioTotalUSD / totalPeso);
    }

    return { mes, planificado, real: Math.round(avancePonderado * 1000) / 10 };
  });
}
