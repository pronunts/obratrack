// ============================================================
// ObraTrack — Dashboard Ejecutivo del Cliente (Admin View)
// Layout horizontal — genera el share link para el cliente
// ============================================================

import { useMemo, useState } from 'react';
import {
  MapPin, Calendar, Share2, Building2,
  TrendingUp, TrendingDown, DollarSign, Layers, Clock, AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useImagenes } from '@/hooks/useImagenes';
import { AvanceFisicoFinanciero } from '@/components/AvanceFisicoFinanciero';
import { CurvaAvanceS } from '@/components/CurvaAvanceS';
import { HitosYFotos } from '@/components/HitosYFotos';
import { SharePanel } from '@/components/SharePanel';

// ── Helpers ──────────────────────────────────────────────

function fmtUSD(n: number) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// ── KPI Card ─────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'default', icon: Icon }: {
  label: string; value: string; sub?: string;
  color?: 'default' | 'green' | 'red' | 'amber' | 'cyan';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const colorMap = {
    default: 'text-slate-200',
    green:   'text-emerald-400',
    red:     'text-red-400',
    amber:   'text-amber-400',
    cyan:    'text-cyan-400',
  };
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className={`text-lg font-extrabold tabular-nums ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}


// ── Componente principal ─────────────────────────────────

export default function DashboardCliente() {
  const { state, proyectoActivo, getResumenPartidas } = useApp();
  const resumenes = getResumenPartidas();
  const { imagenes, subirImagen, eliminarImagen } = useImagenes(state.proyectoActivoId);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const totalPresupuestadoUSD = state.partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  const totalGastadoUSD       = state.gastos.reduce((s, g) => s + g.montoUSD, 0);
  const desviacionPct = totalPresupuestadoUSD > 0
    ? ((totalGastadoUSD - totalPresupuestadoUSD) / totalPresupuestadoUSD) * 100
    : 0;

  const avanceFisico = useMemo(() => {
    if (resumenes.length === 0) return 0;
    return resumenes.reduce((s, r) => s + Math.min(r.porcentajeAvance, 100), 0) / resumenes.length;
  }, [resumenes]);

  const avanceFinanciero = totalPresupuestadoUSD > 0
    ? Math.min((totalGastadoUSD / totalPresupuestadoUSD) * 100, 100)
    : 0;

  const { diasTranscurridos, diasRestantes } = useMemo(() => {
    if (!proyectoActivo) return { diasTranscurridos: 0, diasRestantes: null };
    const inicio = new Date(proyectoActivo.fechaInicio + 'T12:00:00');
    const hoy    = new Date();
    const trans  = Math.max(0, Math.floor((hoy.getTime() - inicio.getTime()) / 86400000));
    const rest   = proyectoActivo.fechaFin
      ? Math.max(0, Math.floor((new Date(proyectoActivo.fechaFin + 'T12:00:00').getTime() - hoy.getTime()) / 86400000))
      : null;
    return { diasTranscurridos: trans, diasRestantes: rest };
  }, [proyectoActivo]);

  const partidasCompletas = resumenes.filter(r => r.porcentajeAvance >= 100).length;


  const fechaFmt = (iso?: string) =>
    iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  if (!proyectoActivo || state.partidas.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <p className="font-semibold text-lg">Sin proyecto activo</p>
          <p className="text-sm text-muted-foreground">
            Seleccioná un proyecto e importá el presupuesto para ver la vista del cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground -mx-4 -mt-5 lg:-mx-8 lg:-mt-6 px-4 py-6 lg:px-10 xl:px-16">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-2">
            Vista Ejecutiva
          </span>
          <h1 className="text-2xl font-extrabold leading-tight">{proyectoActivo.nombre}</h1>
          {proyectoActivo.descripcion && (
            <p className="text-sm text-slate-400 mt-1">{proyectoActivo.descripcion}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {proyectoActivo.ubicacion && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />{proyectoActivo.ubicacion}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {fechaFmt(proyectoActivo.fechaInicio)}
              {proyectoActivo.fechaFin && ` → ${fechaFmt(proyectoActivo.fechaFin)}`}
            </span>
          </div>
        </div>
        <button
          onClick={() => setPanelAbierto(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-900/30 shrink-0"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Presupuesto" value={fmtUSD(totalPresupuestadoUSD)} icon={DollarSign} color="cyan" />
        <KpiCard
          label="Ejecutado"
          value={fmtUSD(totalGastadoUSD)}
          icon={TrendingUp}
          color={desviacionPct > 20 ? 'red' : desviacionPct > 10 ? 'amber' : 'green'}
        />
        <KpiCard
          label="Desviación"
          value={`${desviacionPct > 0 ? '+' : ''}${desviacionPct.toFixed(1)}%`}
          icon={desviacionPct > 10 ? AlertTriangle : TrendingDown}
          color={desviacionPct > 20 ? 'red' : desviacionPct > 10 ? 'amber' : 'green'}
          sub={desviacionPct > 0 ? 'sobre presupuesto' : 'bajo presupuesto'}
        />
        <KpiCard
          label="Partidas"
          value={`${partidasCompletas} / ${state.partidas.length}`}
          icon={Layers}
          color="default"
          sub="completadas"
        />
        <KpiCard
          label="Días transcurridos"
          value={`${diasTranscurridos}d`}
          icon={Clock}
          color="default"
        />
        <KpiCard
          label={diasRestantes !== null ? 'Días restantes' : 'Sin fecha fin'}
          value={diasRestantes !== null ? `${diasRestantes}d` : '—'}
          icon={Calendar}
          color={diasRestantes !== null && diasRestantes < 30 ? 'amber' : 'default'}
        />
      </div>

      {/* ── Fila 1: Donuts | Curva S ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-1">
          <AvanceFisicoFinanciero
            avanceFisico={avanceFisico}
            avanceFinanciero={avanceFinanciero}
            totalPresupuestadoUSD={totalPresupuestadoUSD}
            totalGastadoUSD={totalGastadoUSD}
          />
        </div>
        <div className="lg:col-span-2">
          <CurvaAvanceS
            partidas={state.partidas}
            ejecuciones={state.ejecuciones}
            fechaInicio={proyectoActivo.fechaInicio}
            fechaFin={proyectoActivo.fechaFin}
          />
        </div>
      </div>

      {/* ── Fila 2: Hitos + Fotos ── */}
      <HitosYFotos
        resumenes={resumenes}
        imagenes={imagenes}
        onSubirImagen={subirImagen}
        onEliminarImagen={eliminarImagen}
      />

      <p className="text-center text-xs text-slate-700 pb-4">
        ObraTrack · {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>

      {panelAbierto && proyectoActivo && (
        <SharePanel
          proyectoId={proyectoActivo.id}
          onClose={() => setPanelAbierto(false)}
        />
      )}
    </div>
  );
}
