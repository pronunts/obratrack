// ============================================================
// ObraTrack — Módulo: Curva de Avance S
// Planificado (curva S sigmoidea sintética) vs. Real (datos de ejecución)
// ============================================================

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { PartidaPresupuesto, RegistroEjecucion } from '@/lib/types';

interface Props {
  partidas: PartidaPresupuesto[];
  ejecuciones: RegistroEjecucion[];
  fechaInicio: string;   // YYYY-MM-DD
  fechaFin?: string;     // YYYY-MM-DD
}

/** Genera la curva S planificada (sigmoidea) entre dos fechas. */
function generarCurvaPlanificada(
  inicio: Date,
  fin: Date,
  puntos: number
): { mes: string; planificado: number }[] {
  const resultado: { mes: string; planificado: number }[] = [];
  const duracionMs = fin.getTime() - inicio.getTime();
  const k = 10; // pendiente de la sigmoide

  for (let i = 0; i <= puntos; i++) {
    const t = i / puntos; // 0..1
    const sigmoid = 1 / (1 + Math.exp(-k * (t - 0.5)));
    // Normalizar: sigmoide(0)≈0.0067, sigmoide(1)≈0.9933 → escalar a 0-100
    const sigMin = 1 / (1 + Math.exp(-k * (0 - 0.5)));
    const sigMax = 1 / (1 + Math.exp(-k * (1 - 0.5)));
    const pct = ((sigmoid - sigMin) / (sigMax - sigMin)) * 100;

    const fecha = new Date(inicio.getTime() + duracionMs * t);
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

    resultado.push({ mes, planificado: Math.round(pct * 10) / 10 });
  }
  return resultado;
}

/** Calcula el avance real acumulado mes a mes. */
function calcularAvanceReal(
  partidas: PartidaPresupuesto[],
  ejecuciones: RegistroEjecucion[],
  inicio: Date,
  fin: Date,
  puntos: number
): Map<string, number> {
  // Total de "peso" del proyecto (sum de cantidadPlaneada * precioUnitario como proxy)
  const totalPeso = partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  if (totalPeso === 0) return new Map();

  // Agrupar ejecuciones por mes: { 'ene 24': [ej, ...] }
  const porMes = new Map<string, RegistroEjecucion[]>();
  for (const ej of ejecuciones) {
    const fecha = new Date(ej.fecha + 'T12:00:00');
    const clave = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    const lista = porMes.get(clave) ?? [];
    lista.push(ej);
    porMes.set(clave, lista);
  }

  // Calcular avance acumulado para los mismos puntos que la curva planificada
  const duracionMs = fin.getTime() - inicio.getTime();
  const resultado = new Map<string, number>();

  // Índice: cantidadEjecutada acumulada por partida hasta cada punto
  const ejecutadoAcumulado = new Map<string, number>();

  // Construir lista de meses en orden
  const mesesOrdenados: string[] = [];
  for (let i = 0; i <= puntos; i++) {
    const fecha = new Date(inicio.getTime() + duracionMs * (i / puntos));
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    if (!mesesOrdenados.includes(mes)) mesesOrdenados.push(mes);
  }

  // Acumular ejecuciones mes a mes
  for (const mes of mesesOrdenados) {
    const ejMes = porMes.get(mes) ?? [];
    for (const ej of ejMes) {
      ejecutadoAcumulado.set(
        ej.partidaId,
        (ejecutadoAcumulado.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada
      );
    }

    // Calcular avance ponderado por presupuesto
    let avancePonderado = 0;
    for (const partida of partidas) {
      const ejecutado = ejecutadoAcumulado.get(partida.id) ?? 0;
      const pctPartida = partida.cantidadPlaneada > 0
        ? Math.min(ejecutado / partida.cantidadPlaneada, 1)
        : 0;
      avancePonderado += pctPartida * (partida.precioTotalUSD / totalPeso);
    }

    resultado.set(mes, Math.round(avancePonderado * 1000) / 10);
  }

  return resultado;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 font-medium mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value?.toFixed(1) ?? '—'}%
        </p>
      ))}
    </div>
  );
}

export function CurvaAvanceS({ partidas, ejecuciones, fechaInicio, fechaFin }: Props) {
  const { data, mesActual, pctRealActual } = useMemo(() => {
    const inicio = new Date(fechaInicio + 'T12:00:00');
    const fin    = fechaFin
      ? new Date(fechaFin + 'T12:00:00')
      : new Date(inicio.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 año si no hay fecha fin

    const PUNTOS = 24;
    const curvaPlan = generarCurvaPlanificada(inicio, fin, PUNTOS);
    const avanceReal = calcularAvanceReal(partidas, ejecuciones, inicio, fin, PUNTOS);

    const hoy = new Date();
    const mesActualStr = hoy.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    const esHoyEnRango = hoy >= inicio && hoy <= fin;

    const combined = curvaPlan.map(({ mes, planificado }) => ({
      mes,
      planificado,
      real: avanceReal.has(mes) ? avanceReal.get(mes) : undefined,
    }));

    // % real actual (último valor conocido)
    const realesConocidos = combined.filter(d => d.real !== undefined);
    const pctRealActual = realesConocidos.length > 0
      ? realesConocidos[realesConocidos.length - 1].real ?? 0
      : 0;

    return {
      data: combined,
      mesActual: esHoyEnRango ? mesActualStr : null,
      pctRealActual,
    };
  }, [partidas, ejecuciones, fechaInicio, fechaFin]);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Curva de Avance S
        </h3>
        {pctRealActual > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Real: {pctRealActual.toFixed(1)}%
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#64748b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
            formatter={(value) => (
              <span style={{ color: '#94a3b8' }}>{value}</span>
            )}
          />

          {/* Línea actual */}
          {mesActual && (
            <ReferenceLine
              x={mesActual}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{ value: 'Hoy', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }}
            />
          )}

          {/* Planificado */}
          <Area
            type="monotone"
            dataKey="planificado"
            name="Planificado"
            stroke="#64748b"
            strokeDasharray="6 3"
            strokeWidth={2}
            fill="url(#gradPlan)"
            dot={false}
            activeDot={{ r: 4, fill: '#64748b' }}
          />

          {/* Real */}
          <Area
            type="monotone"
            dataKey="real"
            name="Real"
            stroke="#22c55e"
            strokeWidth={2.5}
            fill="url(#gradReal)"
            dot={false}
            connectNulls={false}
            activeDot={{ r: 5, fill: '#22c55e' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
