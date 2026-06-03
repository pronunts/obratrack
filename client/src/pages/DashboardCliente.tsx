// ============================================================
// ObraTrack — Dashboard Ejecutivo del Cliente
// Vista pública/compartida: avance, curva S, hitos, fotos
// ============================================================

import { useMemo, useState } from 'react';
import { MapPin, Calendar, Share2, Check, Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useImagenes } from '@/hooks/useImagenes';
import { AvanceFisicoFinanciero } from '@/components/AvanceFisicoFinanciero';
import { CurvaAvanceS } from '@/components/CurvaAvanceS';
import { HitosYFotos } from '@/components/HitosYFotos';

const HERO_IMG = 'https://private-us-east-1.manuscdn.com/sessionFile/FTtUQULIBZNay0pvsbzuTe/sandbox/NsPWxdjdEySWGjqv8Pe7N3-img-1_1771515159000_na1fn_aGVyby1kYXNoYm9hcmQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRlR0VVFVTElCWk5heTBwdnNienVUZS9zYW5kYm94L05zUFd4ZGpkRXlTV0dqcXY4UGU3TjMtaW1nLTFfMTc3MTUxNTE1OTAwMF9uYTFmbl9hR1Z5Ynkxa1lYTm9ZbTloY21RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UNxmMusBBoZW85uV1ETbrwX4aOLDFWNiobKPV9SO62lcFqZKK3vixV50S6GHaDsa703x9wBXCrzkYdy~w5VcEuunGjaAGk65WyiaxLuPR0G1H3J0o~jA0NVCqfjO3oBwaWt09lzlJaCIgQvlVkdm5l1XpUeHfn0uVFMgRoR6rq7Cpae6fn9cwzT4KHRkntjmW8gy6Lf8rVxP0xC8c5cxPx5yssQDsb3-R0wGkvtY9QhSb7alfqoScjgtxZuwsjeWuCFESn3fmnfkh7xq-KqGYWkZVTSIrSpD702rklvaYRSVwtv88muiTqE~uxUQuTAMjZGRoG0kioM8lZYDM68GdQ__';

function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Avance de obra', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // usuario canceló el share o no disponible
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600/80 border border-slate-600 text-slate-300 text-xs font-medium transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Copiado' : 'Compartir'}
    </button>
  );
}

export default function DashboardCliente() {
  const { state, proyectoActivo, getResumenPartidas } = useApp();
  const resumenes = getResumenPartidas();
  const { imagenes, subirImagen, eliminarImagen } = useImagenes(state.proyectoActivoId);

  const totalPresupuestadoUSD = state.partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  const totalGastadoUSD       = state.gastos.reduce((s, g) => s + g.montoUSD, 0);

  const avanceFisico = useMemo(() => {
    if (resumenes.length === 0) return 0;
    return resumenes.reduce((s, r) => s + Math.min(r.porcentajeAvance, 100), 0) / resumenes.length;
  }, [resumenes]);

  const avanceFinanciero = totalPresupuestadoUSD > 0
    ? Math.min((totalGastadoUSD / totalPresupuestadoUSD) * 100, 100)
    : 0;

  const fechaFormateada = (iso?: string) =>
    iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    }) : null;

  if (!proyectoActivo || state.partidas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-300 font-semibold">No hay proyecto activo</p>
          <p className="text-slate-500 text-sm">
            Seleccioná un proyecto desde el panel de control para ver su avance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero ── */}
      <div className="relative h-52 overflow-hidden">
        <img src={HERO_IMG} alt="Obra" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5">
          {/* Badge tipo */}
          <span className="self-start mb-2 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            Dashboard Ejecutivo
          </span>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight truncate">
                {proyectoActivo.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                {proyectoActivo.ubicacion && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {proyectoActivo.ubicacion}
                  </span>
                )}
                {proyectoActivo.fechaInicio && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {fechaFormateada(proyectoActivo.fechaInicio)}
                    {proyectoActivo.fechaFin && ` → ${fechaFormateada(proyectoActivo.fechaFin)}`}
                  </span>
                )}
              </div>
            </div>
            <ShareButton />
          </div>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="px-4 py-5 space-y-4 max-w-3xl mx-auto pb-12">

        {/* Módulo 1: Donuts */}
        <AvanceFisicoFinanciero
          avanceFisico={avanceFisico}
          avanceFinanciero={avanceFinanciero}
          totalPresupuestadoUSD={totalPresupuestadoUSD}
          totalGastadoUSD={totalGastadoUSD}
        />

        {/* Módulo 2: Curva S */}
        <CurvaAvanceS
          partidas={state.partidas}
          ejecuciones={state.ejecuciones}
          fechaInicio={proyectoActivo.fechaInicio}
          fechaFin={proyectoActivo.fechaFin}
        />

        {/* Módulo 3: Hitos + Fotos */}
        <HitosYFotos
          resumenes={resumenes}
          imagenes={imagenes}
          onSubirImagen={subirImagen}
          onEliminarImagen={eliminarImagen}
        />

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 pt-2">
          Generado por ObraTrack · {new Date().toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
