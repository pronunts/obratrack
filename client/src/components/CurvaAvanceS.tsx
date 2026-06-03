// ============================================================
// ObraTrack — Módulo: Curva de Avance S
// ============================================================

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { PartidaPresupuesto, RegistroEjecucion, ShareCurvaPoint } from '@/lib/types';
import { buildCurvaData } from '@/lib/curvaUtils';

// Acepta datos crudos (admin view) o datos pre-calculados (share view)
interface PropsFromData {
  partidas: PartidaPresupuesto[];
  ejecuciones: RegistroEjecucion[];
  fechaInicio: string;
  fechaFin?: string;
  curvaData?: never;
}
interface PropsFromPrecomputed {
  curvaData: ShareCurvaPoint[];
  partidas?: never;
  ejecuciones?: never;
  fechaInicio?: never;
  fechaFin?: never;
}
type Props = PropsFromData | PropsFromPrecomputed;

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

export function CurvaAvanceS(props: Props) {
  const { data, mesActual, pctRealActual } = useMemo(() => {
    let combined: ShareCurvaPoint[];

    if (props.curvaData) {
      combined = props.curvaData;
    } else {
      combined = buildCurvaData(props.partidas, props.ejecuciones, props.fechaInicio, props.fechaFin);
    }

    const hoy = new Date();
    const mesActualStr = hoy.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    const realesConocidos = combined.filter(d => d.real !== undefined);
    const pctRealActual = realesConocidos.length > 0
      ? (realesConocidos[realesConocidos.length - 1].real ?? 0)
      : 0;
    const estaEnRango = combined.some(d => d.mes === mesActualStr);

    return { data: combined, mesActual: estaEnRango ? mesActualStr : null, pctRealActual };
  }, [props]);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 h-full">
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
          <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
          {mesActual && (
            <ReferenceLine x={mesActual} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5}
              label={{ value: 'Hoy', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
          )}
          <Area type="monotone" dataKey="planificado" name="Planificado" stroke="#64748b" strokeDasharray="6 3" strokeWidth={2} fill="url(#gradPlan)" dot={false} activeDot={{ r: 4, fill: '#64748b' }} />
          <Area type="monotone" dataKey="real" name="Real" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradReal)" dot={false} connectNulls={false} activeDot={{ r: 5, fill: '#22c55e' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
