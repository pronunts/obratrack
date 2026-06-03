// Utilidades para el cálculo de la Curva S (compartido entre componentes y snapshot)

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
    const sigmoid = 1 / (1 + Math.exp(-k * (t - 0.5)));
    const pct = ((sigmoid - sigMin) / (sigMax - sigMin)) * 100;
    const fecha = new Date(inicio.getTime() + duracionMs * t);
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    resultado.push({ mes, planificado: Math.round(pct * 10) / 10 });
  }
  return resultado;
}

/** Calcula el avance real acumulado mes a mes. */
export function calcularAvanceReal(
  partidas: PartidaPresupuesto[],
  ejecuciones: RegistroEjecucion[],
  inicio: Date,
  fin: Date,
): Map<string, number> {
  const totalPeso = partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  if (totalPeso === 0) return new Map();

  const duracionMs = fin.getTime() - inicio.getTime();
  const porMes = new Map<string, RegistroEjecucion[]>();
  for (const ej of ejecuciones) {
    const fecha = new Date(ej.fecha + 'T12:00:00');
    const clave = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    const lista = porMes.get(clave) ?? [];
    lista.push(ej);
    porMes.set(clave, lista);
  }

  const mesesOrdenados: string[] = [];
  for (let i = 0; i <= PUNTOS; i++) {
    const fecha = new Date(inicio.getTime() + duracionMs * (i / PUNTOS));
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    if (!mesesOrdenados.includes(mes)) mesesOrdenados.push(mes);
  }

  const resultado = new Map<string, number>();
  const ejecutadoAcumulado = new Map<string, number>();

  for (const mes of mesesOrdenados) {
    const ejMes = porMes.get(mes) ?? [];
    for (const ej of ejMes) {
      ejecutadoAcumulado.set(ej.partidaId, (ejecutadoAcumulado.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada);
    }
    let avancePonderado = 0;
    for (const partida of partidas) {
      const ejecutado = ejecutadoAcumulado.get(partida.id) ?? 0;
      const pctPartida = partida.cantidadPlaneada > 0 ? Math.min(ejecutado / partida.cantidadPlaneada, 1) : 0;
      avancePonderado += pctPartida * (partida.precioTotalUSD / totalPeso);
    }
    resultado.set(mes, Math.round(avancePonderado * 1000) / 10);
  }
  return resultado;
}

/** Genera el array combinado para el gráfico. */
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

  const curvaPlan  = generarCurvaPlanificada(inicio, fin);
  const avanceReal = calcularAvanceReal(partidas, ejecuciones, inicio, fin);

  return curvaPlan.map(({ mes, planificado }) => ({
    mes,
    planificado,
    real: avanceReal.has(mes) ? avanceReal.get(mes) : undefined,
  }));
}
