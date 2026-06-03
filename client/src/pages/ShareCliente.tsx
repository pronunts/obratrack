// ============================================================
// ObraTrack — Vista pública del cliente (sin auth)
// Carga el snapshot desde /api/shares/:token
// ============================================================

import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import {
  MapPin, Calendar, DollarSign, TrendingUp, TrendingDown,
  Layers, Clock, AlertTriangle, Building2,
} from 'lucide-react';
import { AvanceFisicoFinanciero } from '@/components/AvanceFisicoFinanciero';
import { CurvaAvanceS } from '@/components/CurvaAvanceS';
import { HitosYFotos } from '@/components/HitosYFotos';
import type { ShareSnapshot } from '@/lib/types';

const LOGO_URL = '/logo.png';

function fmtUSD(n: number) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

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

function Spinner() {
  return (
    <div className="dark min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Cargando reporte...</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="dark min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-white">Link no encontrado</h1>
        <p className="text-slate-400 text-sm">
          Este link no existe o fue revocado por el administrador del proyecto.
        </p>
      </div>
    </div>
  );
}

export default function ShareCliente() {
  const params = useParams<{ token: string }>();
  const token  = params.token;

  const [snapshot, setSnapshot] = useState<ShareSnapshot | null>(null);
  const [creadoEn, setCreadoEn] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/shares/${token}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return; }
        if (!r.ok) throw new Error('Error del servidor');
        const data = await r.json();
        setSnapshot(data.snapshot);
        setCreadoEn(data.creadoEn);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)   return <Spinner />;
  if (notFound || !snapshot) return <NotFound />;

  const { proyecto, kpis, curvaData, hitos, imagenes } = snapshot;
  const fechaFmt = (iso?: string) =>
    iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="dark min-h-screen bg-slate-950 text-white">

      {/* ── Navbar mínima ── */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
        <div>
          <p className="font-bold text-sm leading-tight text-white">ObraTrack</p>
          <p className="text-[10px] text-slate-500">Reporte de avance · Solo lectura</p>
        </div>
        {creadoEn && (
          <p className="ml-auto text-[10px] text-slate-500 hidden sm:block">
            Generado {new Date(creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </header>

      <div className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-5">

        {/* ── Header proyecto ── */}
        <div>
          <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-2">
            Informe Ejecutivo
          </span>
          <h1 className="text-2xl font-extrabold">{proyecto.nombre}</h1>
          {proyecto.descripcion && (
            <p className="text-sm text-slate-400 mt-1">{proyecto.descripcion}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {proyecto.ubicacion && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />{proyecto.ubicacion}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {fechaFmt(proyecto.fechaInicio)}
              {proyecto.fechaFin && ` → ${fechaFmt(proyecto.fechaFin)}`}
            </span>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Presupuesto" value={fmtUSD(kpis.totalPresupuestadoUSD)} icon={DollarSign} color="cyan" />
          <KpiCard
            label="Ejecutado"
            value={fmtUSD(kpis.totalGastadoUSD)}
            icon={TrendingUp}
            color={kpis.desviacionPct > 20 ? 'red' : kpis.desviacionPct > 10 ? 'amber' : 'green'}
          />
          <KpiCard
            label="Desviación"
            value={`${kpis.desviacionPct > 0 ? '+' : ''}${kpis.desviacionPct.toFixed(1)}%`}
            icon={kpis.desviacionPct > 10 ? AlertTriangle : TrendingDown}
            color={kpis.desviacionPct > 20 ? 'red' : kpis.desviacionPct > 10 ? 'amber' : 'green'}
            sub={kpis.desviacionPct > 0 ? 'sobre presupuesto' : 'bajo presupuesto'}
          />
          <KpiCard
            label="Partidas"
            value={`${kpis.partidasCompletas} / ${kpis.totalPartidas}`}
            icon={Layers}
            sub="completadas"
          />
          <KpiCard label="Días transcurridos" value={`${kpis.diasTranscurridos}d`} icon={Clock} />
          <KpiCard
            label={kpis.diasRestantes !== null ? 'Días restantes' : 'Sin fecha fin'}
            value={kpis.diasRestantes !== null ? `${kpis.diasRestantes}d` : '—'}
            icon={Calendar}
            color={kpis.diasRestantes !== null && kpis.diasRestantes < 30 ? 'amber' : 'default'}
          />
        </div>

        {/* ── Fila 1: Donuts | Curva S ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <AvanceFisicoFinanciero
              avanceFisico={kpis.avanceFisico}
              avanceFinanciero={kpis.avanceFinanciero}
              totalPresupuestadoUSD={kpis.totalPresupuestadoUSD}
              totalGastadoUSD={kpis.totalGastadoUSD}
            />
          </div>
          <div className="lg:col-span-2">
            <CurvaAvanceS curvaData={curvaData} />
          </div>
        </div>

        {/* ── Fila 2: Hitos + Fotos ── */}
        <HitosYFotos
          resumenes={[]}
          hitosPrecomputados={hitos}
          imagenes={imagenes.map(img => ({ ...img, proyectoId: '', creadoEn: img.fecha }))}
          onSubirImagen={async () => {}}
          onEliminarImagen={() => {}}
          soloLectura
        />

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 pt-2 pb-4">
          ObraTrack · Reporte generado el {new Date(snapshot.generadoEn).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
