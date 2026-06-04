import type { PartidaPresupuesto, RegistroEjecucion, ShareCurvaPoint } from './types';

const PUNTOS = 24;
const k = 10;
const sigMin = 1 / (1 + Math.exp(-k * (0 - 0.5)));
const sigMax = 1 / (1 + Math.exp(-k * (1 - 0.5)));

/** Genera la curva S planificada (sigmoidea) entre dos fechas. */
export function generarCurvaPlanificada(
  inicio: Date,
  fin: Date,
): { mes: string; planificado: number }[] {
  const duracionMs = fin.getTime() - inicio.getTime();
  const resultado: { mes: string; planificado: number }[] = [];
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
 *
 * ESTRATEGIA DE PUNTOS REALES:
 *   1. Calcula el avance real en cada uno de los 24 puntos del plan (por fecha).
 *   2. Además, añade un punto mensual por cada mes transcurrido desde el inicio
 *      del proyecto hasta hoy — esto garantiza datos más granulares para proyectos nuevos.
 *   3. Siempre añade "hoy" como punto final explícito.
 *   4. Si tras todo eso solo hay 1 punto real (proyecto muy nuevo), antepone un
 *      punto "Inicio" con real=0 para que Recharts pueda dibujar una línea.
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
  const hoy        = new Date();
  const duracionMs = fin.getTime() - inicio.getTime();

  const mesLabel = (d: Date) =>
    d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

  const planAt = (d: Date): number => {
    const t = Math.max(0, Math.min(1, (d.getTime() - inicio.getTime()) / duracionMs));
    const s = 1 / (1 + Math.exp(-k * (t - 0.5)));
    return Math.round(((s - sigMin) / (sigMax - sigMin)) * 1000) / 10;
  };

  const totalPeso = partidas.reduce((s, p) => s + p.precioTotalUSD, 0);

  const progressAt = (d: Date): number => {
    if (totalPeso === 0) return 0;
    const cutoff = d.toISOString().slice(0, 10);
    const ejHasta = ejecuciones.filter(ej => ej.fecha <= cutoff);
    const ejPP = new Map<string, number>();
    for (const ej of ejHasta) {
      ejPP.set(ej.partidaId, (ejPP.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada);
    }
    let acc = 0;
    for (const p of partidas) {
      const ej  = ejPP.get(p.id) ?? 0;
      const pct = p.cantidadPlaneada > 0 ? Math.min(ej / p.cantidadPlaneada, 1) : 0;
      acc += pct * (p.precioTotalUSD / totalPeso);
    }
    return Math.round(acc * 1000) / 10;
  };

  // ── Mapa de puntos (clave = etiqueta del mes) ─────────────
  // Usamos un Map para deduplicar por mes; si hay dos fechas en el mismo mes
  // tomamos la última (que tendrá el avance más actualizado).
  const map = new Map<string, { date: Date; planificado: number; real?: number }>();

  // Paso 1: los 24 puntos del plan
  for (let i = 0; i <= PUNTOS; i++) {
    const d   = new Date(inicio.getTime() + duracionMs * (i / PUNTOS));
    const mes = mesLabel(d);
    if (!map.has(mes)) {
      map.set(mes, { date: d, planificado: planAt(d) });
    }
  }

  // Paso 2 y 3: anclajes mensuales pasados + "hoy" explícito
  if (ejecuciones.length > 0 && totalPeso > 0 && hoy >= inicio) {
    const anchors: Date[] = [];

    // Inicio del proyecto
    anchors.push(new Date(inicio));

    // Primer día de cada mes entre inicio y hoy
    const cursor = new Date(inicio);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= hoy) {
      anchors.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Hoy siempre (así la línea llega hasta la fecha actual)
    anchors.push(new Date(hoy));

    for (const d of anchors) {
      if (d > hoy) continue;
      const mes  = mesLabel(d);
      const real = progressAt(d);
      if (map.has(mes)) {
        map.set(mes, { ...map.get(mes)!, real });
      } else {
        map.set(mes, { date: d, planificado: planAt(d), real });
      }
    }
  }

  // Ordenar por fecha
  const sorted = Array.from(map.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const result: ShareCurvaPoint[] = sorted.map(({ date, planificado, real }) => {
    const esFuturo = date > hoy;
    return {
      mes:         mesLabel(date),
      planificado: Math.round(planificado * 10) / 10,
      real:        esFuturo ? undefined : real,
    };
  });

  // Paso 4: garantía de mínimo 2 puntos reales para dibujar línea
  // Si solo hay 1 punto real (proyecto muy nuevo, todo en el mismo mes),
  // anteponemos un punto "Inicio" con real=0.
  if (ejecuciones.length > 0 && totalPeso > 0) {
    const realCount = result.filter(d => d.real !== undefined).length;
    if (realCount === 1) {
      result.unshift({ mes: 'Inicio', planificado: 0, real: 0 });
    }
  }

  return result;
}
