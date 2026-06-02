// ============================================================
// ObraTrack — Dashboard: Resumen General del Proyecto
// Design: Blueprint Engineering — hero con imagen de obra
// ============================================================

import { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Wifi, WifiOff, FileText, BarChart3, Layers,
  Calendar, Building2
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip
} from 'recharts';
import { useApp } from '@/contexts/AppContext';

const HERO_IMG = 'https://private-us-east-1.manuscdn.com/sessionFile/FTtUQULIBZNay0pvsbzuTe/sandbox/NsPWxdjdEySWGjqv8Pe7N3-img-1_1771515159000_na1fn_aGVyby1kYXNoYm9hcmQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRlR0VVFVTElCWk5heTBwdnNienVUZS9zYW5kYm94L05zUFd4ZGpkRXlTV0dqcXY4UGU3TjMtaW1nLTFfMTc3MTUxNTE1OTAwMF9uYTFmbl9hR1Z5Ynkxa1lYTm9ZbTloY21RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UNxmMusBBoZW85uV1ETbrwX4aOLDFWNiobKPV9SO62lcFqZKK3vixV50S6GHaDsa703x9wBXCrzkYdy~w5VcEuunGjaAGk65WyiaxLuPR0G1H3J0o~jA0NVCqfjO3oBwaWt09lzlJaCIgQvlVkdm5l1XpUeHfn0uVFMgRoR6rq7Cpae6fn9cwzT4KHRkntjmW8gy6Lf8rVxP0xC8c5cxPx5yssQDsb3-R0wGkvtY9QhSb7alfqoScjgtxZuwsjeWuCFESn3fmnfkh7xq-KqGYWkZVTSIrSpD702rklvaYRSVwtv88muiTqE~uxUQuTAMjZGRoG0kioM8lZYDM68GdQ__';

function StatCard({ label, value, sub, color = 'default' }: {
  label: string; value: string; sub?: string;
  color?: 'default' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const colorMap = {
    default: 'text-foreground',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { state, proyectoActivo, getResumenPartidas } = useApp();
  const resumenes = getResumenPartidas();

  const totalPresupuestado = state.partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  const totalGastado = state.gastos.reduce((s, g) => s + g.montoUSD, 0);
  const desviacionPct = totalPresupuestado > 0 ? ((totalGastado - totalPresupuestado) / totalPresupuestado) * 100 : 0;

  const avancePromedio = useMemo(() => {
    if (resumenes.length === 0) return 0;
    return resumenes.reduce((s, r) => s + Math.min(r.porcentajeAvance, 100), 0) / resumenes.length;
  }, [resumenes]);

  const alertas = resumenes.filter((r) => r.estado !== 'ok' && r.gastoRealUSD > 0);
  const criticos = alertas.filter((r) => r.estado === 'critico');

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const radialData = [
    { name: 'Avance', value: Math.round(avancePromedio), fill: '#1565C0' },
  ];

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (state.partidas.length === 0) {
    return (
      <div className="space-y-6 pb-24">
        {/* Hero vacío */}
        <div className="relative rounded-2xl overflow-hidden h-48">
          <img src={HERO_IMG} alt="Obra civil" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="text-2xl font-bold text-white">ObraTrack</h1>
            <p className="text-sm text-white/80">Control de Obras Civiles</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
            <Building2 className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">Bienvenido a ObraTrack</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Importa tu presupuesto CSV en la pestaña "Línea Base" para comenzar a controlar tu obra
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full max-w-sm text-left">
            {[
              { icon: FileText, label: '1. Importa tu CSV', desc: 'Carga el presupuesto planeado' },
              { icon: Layers, label: '2. Registra avances', desc: 'Anota lo ejecutado cada día' },
              { icon: BarChart3, label: '3. Controla costos', desc: 'Compara real vs. presupuesto' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Hero con imagen */}
      <div className="relative rounded-2xl overflow-hidden h-44">
        <img src={HERO_IMG} alt="Obra civil" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
            ${state.isOnline
              ? 'bg-emerald-900/70 text-emerald-300'
              : 'bg-red-900/70 text-red-300'
            }`}>
            {state.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {state.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs text-white/60 mb-0.5 capitalize">{today}</p>
          <h1 className="text-xl font-bold text-white leading-tight">
            {proyectoActivo?.nombre ?? 'Mi Proyecto'}
          </h1>
          {state.pendientesSincronizacion > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">
                {state.pendientesSincronizacion} pendiente{state.pendientesSincronizacion > 1 ? 's' : ''} de sincronizar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Avance general con radial */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={90 - (avancePromedio / 100) * 360}
              >
                <RadialBar dataKey="value" background={{ fill: 'var(--muted)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold tabular-nums">{Math.round(avancePromedio)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Avance General</p>
            <p className="text-sm text-muted-foreground">
              {state.ejecuciones.length} registro{state.ejecuciones.length !== 1 ? 's' : ''} de ejecución
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Partidas: </span>
                <span className="font-semibold">{state.partidas.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Capítulos: </span>
                <span className="font-semibold">
                  {new Set(state.partidas.map((p) => p.capitulo)).size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Presupuesto Total"
          value={fmt(totalPresupuestado)}
          sub={`${state.partidas.length} partidas`}
          color="blue"
        />
        <StatCard
          label="Gasto Real"
          value={fmt(totalGastado)}
          sub={`${state.gastos.length} registros`}
          color={desviacionPct > 20 ? 'red' : desviacionPct > 10 ? 'amber' : 'green'}
        />
      </div>

      {/* Alertas */}
      {criticos.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="font-semibold text-sm text-red-800 dark:text-red-300">
              {criticos.length} partida{criticos.length > 1 ? 's' : ''} con desviación crítica
            </p>
          </div>
          <div className="space-y-1.5">
            {criticos.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-red-700 dark:text-red-400 truncate flex-1 mr-2">{r.descripcion}</span>
                <span className="font-bold text-red-600 dark:text-red-400 tabular-nums shrink-0">
                  +{r.desviacionPorcentaje.toFixed(0)}%
                </span>
              </div>
            ))}
            {criticos.length > 3 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                +{criticos.length - 3} más...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumen de estado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold tabular-nums">
            {resumenes.filter((r) => r.estado === 'ok' && r.gastoRealUSD > 0).length}
          </p>
          <p className="text-xs text-muted-foreground">OK</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold tabular-nums">
            {resumenes.filter((r) => r.estado === 'alerta').length}
          </p>
          <p className="text-xs text-muted-foreground">Alerta</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold tabular-nums">{criticos.length}</p>
          <p className="text-xs text-muted-foreground">Crítico</p>
        </div>
      </div>

      {/* Últimos registros */}
      {state.ejecuciones.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Últimos Registros de Ejecución
            </p>
          </div>
          {[...state.ejecuciones]
            .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
            .slice(0, 5)
            .map((ej) => {
              const partida = state.partidas.find((p) => p.id === ej.partidaId);
              return (
                <div key={ej.id} className="px-4 py-3 flex items-center gap-3 border-b border-border/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ej.sincronizado ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {partida?.descripcion ?? 'Partida eliminada'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ej.cantidadEjecutada} {partida?.unidad ?? ''} · {ej.fecha}
                    </p>
                  </div>
                  {!ej.sincronizado && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                      Pend.
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
