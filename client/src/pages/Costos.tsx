// ============================================================
// ObraTrack — Módulo 3: Control de Costos (Bimonetario) v2
// Design: Blueprint Engineering — USD verde, LOCAL azul
// ============================================================

import { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, X,
  AlertTriangle, Trash2, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import type { GastoDiario } from '@/lib/types';

const CATEGORIAS: { value: GastoDiario['categoria']; label: string; icon: string }[] = [
  { value: 'material',  label: 'Material',        icon: '🧱' },
  { value: 'mano_obra', label: 'Mano de Obra',     icon: '👷' },
  { value: 'equipo',    label: 'Equipo/Maquinaria', icon: '🚜' },
  { value: 'otro',      label: 'Otro',             icon: '📦' },
];

// ── Formulario de Gasto ───────────────────────────────────

function GastoForm({ onClose }: { onClose: () => void }) {
  const { state, proyectoActivo, registrarGasto } = useApp();
  const [partidaId, setPartidaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'USD' | 'LOCAL'>('USD');
  const [tasaCambio, setTasaCambio] = useState(proyectoActivo?.tasaCambioDefault ?? 4000);
  const [categoria, setCategoria] = useState<GastoDiario['categoria']>('material');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const montoUSD = useMemo(() => {
    const m = parseFloat(monto) || 0;
    return moneda === 'USD' ? m : m / tasaCambio;
  }, [monto, moneda, tasaCambio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidaId) { toast.error('Selecciona una partida'); return; }
    const m = parseFloat(monto);
    if (!m || m <= 0) { toast.error('Ingresa un monto válido'); return; }
    if (!descripcion.trim()) { toast.error('Ingresa una descripción'); return; }
    setSaving(true);
    await registrarGasto(partidaId, descripcion, m, moneda, tasaCambio, categoria, fecha);
    toast.success(`✓ Gasto registrado: $${montoUSD.toFixed(2)} USD`);
    setSaving(false);
    onClose();
  };

  const monedaLabel = proyectoActivo?.monedaLocal ?? 'LOCAL';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h3 className="font-bold text-lg">Registrar Gasto</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Partida */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Partida</Label>
            <Select value={partidaId} onValueChange={setPartidaId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona una partida..." />
              </SelectTrigger>
              <SelectContent>
                {state.partidas.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{p.codigo}</span>
                    {p.descripcion.length > 40 ? p.descripcion.substring(0, 38) + '…' : p.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descripción del Gasto</Label>
            <Input
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej. Compra de cemento Portland, 50 sacos"
              className="h-12"
              required
            />
          </div>

          {/* Monto y Moneda */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Monto</Label>
            <div className="flex gap-2">
              <Input
                type="number" step="0.01" min="0.01"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0.00"
                className="flex-1 h-14 text-xl font-bold text-center tabular-nums"
                required
              />
              <div className="w-28">
                <Select value={moneda} onValueChange={v => setMoneda(v as 'USD' | 'LOCAL')}>
                  <SelectTrigger className="h-14 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      <span className="text-emerald-600 font-bold">USD $</span>
                    </SelectItem>
                    <SelectItem value="LOCAL">
                      <span className="text-blue-600 font-bold">{monedaLabel}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tasa de cambio */}
          {moneda === 'LOCAL' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tasa de Cambio ({monedaLabel} / USD)</Label>
              <Input
                type="number"
                value={tasaCambio}
                onChange={e => setTasaCambio(Number(e.target.value))}
                className="h-12 font-mono"
              />
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Equivalente: <strong className="tabular-nums">${montoUSD.toFixed(2)} USD</strong>
                </p>
              </div>
            </div>
          )}

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Categoría</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoria(cat.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all
                    ${categoria === cat.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/30'}`}
                >
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-12" required />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 h-12 font-bold" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Registrar</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tooltip del gráfico ───────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold mb-2 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold tabular-nums text-foreground">
            ${Number(entry.value).toLocaleString('es-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────

export default function Costos() {
  const { state, proyectoActivo, getResumenPartidas, eliminarGasto } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [expandedPartida, setExpandedPartida] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'top10' | 'all'>('top10');

  const resumenes = getResumenPartidas();

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmtFull = (n: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

  const totalPresupuestado = state.partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  const totalGastado = state.gastos.reduce((s, g) => s + g.montoUSD, 0);
  const desviacionTotal = totalGastado - totalPresupuestado;
  const desviacionPct = totalPresupuestado > 0 ? (desviacionTotal / totalPresupuestado) * 100 : 0;

  const chartData = useMemo(() => {
    const data = resumenes
      .filter(r => r.precioTotalUSD > 0 || r.gastoRealUSD > 0)
      .map(r => ({
        name: r.descripcion.length > 22 ? r.descripcion.substring(0, 20) + '…' : r.descripcion,
        Presupuestado: Math.round(r.precioTotalUSD),
        Ejecutado: Math.round(r.gastoRealUSD),
        estado: r.estado,
      }))
      .sort((a, b) => b.Presupuestado - a.Presupuestado);
    return chartView === 'top10' ? data.slice(0, 10) : data;
  }, [resumenes, chartView]);

  const partidasConGastos = resumenes.filter(r => r.gastoRealUSD > 0);

  if (state.partidas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <div>
          <p className="font-semibold">Sin presupuesto cargado</p>
          <p className="text-sm text-muted-foreground mt-1">Ve a "Línea Base" e importa tu archivo primero</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Costos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {proyectoActivo?.monedaLocal ?? 'LOCAL'} · Tasa: {proyectoActivo?.tasaCambioDefault?.toLocaleString() ?? '—'}
          </p>
        </div>
        <Button className="h-12 gap-2 font-bold" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />Gasto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Presupuestado</p>
          <p className="text-lg font-bold tabular-nums">{fmt(totalPresupuestado)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{state.partidas.length} partidas</p>
        </div>
        <div className={`bg-card border rounded-xl p-4 ${
          totalGastado === 0 ? 'border-border' :
          desviacionPct > 20 ? 'border-red-300 dark:border-red-800' :
          desviacionPct > 10 ? 'border-amber-300 dark:border-amber-800' : 'border-emerald-300 dark:border-emerald-800'}`}>
          <p className="text-xs text-muted-foreground mb-1">Gasto Real</p>
          <p className={`text-lg font-bold tabular-nums ${
            totalGastado === 0 ? 'text-foreground' :
            desviacionPct > 20 ? 'text-red-600 dark:text-red-400' :
            desviacionPct > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {fmt(totalGastado)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{state.gastos.length} registros</p>
        </div>
        <div className="col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Desviación Total</p>
              <p className={`text-xl font-bold tabular-nums ${
                desviacionTotal === 0 ? 'text-foreground' :
                desviacionTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {desviacionTotal >= 0 ? '+' : ''}{fmtFull(desviacionTotal)}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold
              ${desviacionTotal === 0 ? 'bg-muted text-muted-foreground' :
                desviacionTotal > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
              {desviacionTotal > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(desviacionPct).toFixed(1)}%
            </div>
          </div>
          {totalGastado > 0 && (
            <div className="mt-3 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  desviacionPct > 20 ? 'bg-red-500' : desviacionPct > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min((totalGastado / totalPresupuestado) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de barras */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Presupuestado vs. Ejecutado</h3>
            <div className="flex gap-1">
              {(['top10', 'all'] as const).map(v => (
                <button key={v}
                  onClick={() => setChartView(v)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                    ${chartView === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {v === 'top10' ? 'Top 10' : 'Todos'}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: Math.max(chartData.length * 80, 320) }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Presupuestado" fill="#1565C0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Ejecutado" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={
                        entry.estado === 'critico' ? '#C62828' :
                        entry.estado === 'alerta' ? '#F57C00' : '#2E7D32'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { color: 'bg-emerald-700', label: 'OK (<10% desv.)' },
              { color: 'bg-orange-600', label: 'Alerta (10–20%)' },
              { color: 'bg-red-700', label: 'Crítico (>20%)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle por partida */}
      {partidasConGastos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Detalle por Partida</h3>
          {partidasConGastos.map(p => {
            const gastosPartida = state.gastos
              .filter(g => g.partidaId === p.id)
              .sort((a, b) => b.fecha.localeCompare(a.fecha));
            const isExpanded = expandedPartida === p.id;
            return (
              <div key={p.id} className={`bg-card border rounded-xl overflow-hidden border-l-4
                ${p.estado === 'critico' ? 'border-l-red-500' :
                  p.estado === 'alerta' ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
                <button
                  className="w-full p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedPartida(isExpanded ? null : p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p.codigo}</span>
                      <Badge className={`text-xs border-0 ${
                        p.estado === 'critico' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                        p.estado === 'alerta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                        {p.estado === 'critico' ? '⚠ Crítico' : p.estado === 'alerta' ? '⚡ Alerta' : '✓ OK'}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold">{p.descripcion}</p>
                    <div className="flex gap-4 mt-1 text-xs tabular-nums">
                      <span className="text-muted-foreground">Pres: <span className="font-medium text-foreground">{fmtFull(p.precioTotalUSD)}</span></span>
                      <span className="text-muted-foreground">Real: <span className={`font-bold ${
                        p.estado === 'critico' ? 'text-red-600 dark:text-red-400' :
                        p.estado === 'alerta' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {fmtFull(p.gastoRealUSD)}</span></span>
                    </div>
                    {p.desviacionUSD !== 0 && (
                      <p className={`text-xs font-semibold mt-0.5 tabular-nums ${
                        p.desviacionUSD > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {p.desviacionUSD > 0 ? '+' : ''}{fmtFull(p.desviacionUSD)} ({p.desviacionPorcentaje.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="px-4 py-2 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gastos Registrados</p>
                    </div>
                    {gastosPartida.map(g => {
                      const catInfo = CATEGORIAS.find(c => c.value === g.categoria);
                      return (
                        <div key={g.id} className="px-4 py-3 flex items-center gap-3 border-b border-border/50 last:border-0">
                          <span className="text-lg shrink-0">{catInfo?.icon ?? '📦'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{g.descripcion}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{g.fecha}</span>
                              <span>·</span>
                              <span className={g.moneda === 'USD'
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-blue-600 dark:text-blue-400 font-semibold'}>
                                {g.moneda === 'USD' ? '$' : proyectoActivo?.monedaLocal ?? 'L'}
                                {g.monto.toLocaleString('es-US', { maximumFractionDigits: 2 })} {g.moneda}
                              </span>
                              {g.moneda === 'LOCAL' && (
                                <><span>·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ${g.montoUSD.toFixed(2)} USD
                                </span></>
                              )}
                            </div>
                          </div>
                          <button
                            className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                            onClick={() => { eliminarGasto(g.id); toast.info('Gasto eliminado'); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {state.gastos.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Sin gastos registrados</p>
          <p className="text-xs mt-1">Toca el botón "Gasto" para registrar el primer gasto</p>
        </div>
      )}

      {showForm && <GastoForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
