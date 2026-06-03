// ============================================================
// ObraTrack — Módulo: Avance Físico vs. Financiero (Donut Charts)
// Dashboard Ejecutivo del Cliente
// ============================================================

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, DollarSign } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  avanceFisico: number;        // porcentaje 0-100
  avanceFinanciero: number;    // porcentaje 0-100
  totalPresupuestadoUSD: number;
  totalGastadoUSD: number;
}

const CYAN   = '#06b6d4';
const ORANGE = '#f97316';

function fmtUSD(n: number) {
  return new Intl.NumberFormat('es-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

interface TooltipFisicoProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  totalPresupuestadoUSD: number;
  totalGastadoUSD: number;
}

function TooltipFisico({ active, payload, totalPresupuestadoUSD }: TooltipFisicoProps) {
  if (!active || !payload?.length) return null;
  const pct = payload[0].value;
  // valor absoluto estimado: pct% del presupuesto como proxy de obra física
  const estimadoUSD = (pct / 100) * totalPresupuestadoUSD;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-cyan-500 font-bold">{pct.toFixed(1)}% construido</p>
      <p className="text-foreground">≈ {fmtUSD(estimadoUSD)} de obra</p>
      <p className="text-muted-foreground">Presupuesto total: {fmtUSD(totalPresupuestadoUSD)}</p>
    </div>
  );
}

interface TooltipFinancieroProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  totalPresupuestadoUSD: number;
  totalGastadoUSD: number;
}

function TooltipFinanciero({ active, payload, totalPresupuestadoUSD, totalGastadoUSD }: TooltipFinancieroProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-orange-500 font-bold">{payload[0].value.toFixed(1)}% ejecutado</p>
      <p className="text-foreground">Gastado: {fmtUSD(totalGastadoUSD)}</p>
      <p className="text-muted-foreground">Presupuesto: {fmtUSD(totalPresupuestadoUSD)}</p>
    </div>
  );
}

function DonutChart({
  pct,
  color,
  icon: Icon,
  label,
  tooltipContent,
}: {
  pct: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltipContent: React.ReactNode;
}) {
  const { theme } = useTheme() as { theme: string };
  const TRACK = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  const data = [
    { name: 'Completado', value: Math.min(pct, 100) },
    { name: 'Restante',   value: Math.max(100 - pct, 0) },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{label}</p>
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="82%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell key="done"  fill={color} />
              <Cell key="rest"  fill={TRACK} />
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <div>
                  {active && payload?.length ? tooltipContent : null}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div style={{ color }}>
            <Icon className="w-5 h-5 mb-1" />
          </div>
          <span className="text-2xl font-extrabold tabular-nums text-foreground leading-none">
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AvanceFisicoFinanciero({
  avanceFisico,
  avanceFinanciero,
  totalPresupuestadoUSD,
  totalGastadoUSD,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">
        Avance del Proyecto
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <DonutChart
          pct={avanceFisico}
          color={CYAN}
          icon={Building2}
          label="Avance Físico Real"
          tooltipContent={
            <TooltipFisico
              active
              payload={[{ value: avanceFisico, name: 'Completado' }]}
              totalPresupuestadoUSD={totalPresupuestadoUSD}
              totalGastadoUSD={totalGastadoUSD}
            />
          }
        />
        <DonutChart
          pct={avanceFinanciero}
          color={ORANGE}
          icon={DollarSign}
          label="Avance Financiero"
          tooltipContent={
            <TooltipFinanciero
              active
              payload={[{ value: avanceFinanciero, name: 'Ejecutado' }]}
              totalPresupuestadoUSD={totalPresupuestadoUSD}
              totalGastadoUSD={totalGastadoUSD}
            />
          }
        />
      </div>
      {/* Leyenda de montos */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Presupuesto</p>
          <p className="text-sm font-bold text-foreground tabular-nums">
            {fmtUSD(totalPresupuestadoUSD)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ejecutado</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: ORANGE }}>
            {fmtUSD(totalGastadoUSD)}
          </p>
        </div>
      </div>
    </div>
  );
}
