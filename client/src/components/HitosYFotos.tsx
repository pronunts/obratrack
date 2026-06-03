// ============================================================
// ObraTrack — Módulo: Hitos y Fotos Recientes
// Hitos derivados de capítulos + galería con lightbox
// ============================================================

import { useState, useRef } from 'react';
import { CheckCircle2, Clock, Plus, X, ZoomIn, Trash2 } from 'lucide-react';
import type { ResumenPartida, ImagenObra, ShareHito } from '@/lib/types';

// ── Hitos ────────────────────────────────────────────────

type Hito = ShareHito;

function derivarHitos(resumenes: ResumenPartida[]): Hito[] {
  // Agrupar por capítulo
  const capitulosMap = new Map<string, ResumenPartida[]>();
  for (const r of resumenes) {
    const lista = capitulosMap.get(r.capitulo) ?? [];
    lista.push(r);
    capitulosMap.set(r.capitulo, lista);
  }

  const hitos: Hito[] = [];
  for (const capitulo of Array.from(capitulosMap.keys())) {
    const partidas = capitulosMap.get(capitulo)!;
    const avgPct = partidas.reduce((s: number, p: ResumenPartida) => s + Math.min(p.porcentajeAvance, 100), 0) / partidas.length;
    let estado: Hito['estado'];
    if (avgPct >= 90)      estado = 'logrado';
    else if (avgPct >= 5)  estado = 'en_curso';
    else                    estado = 'proximo';

    hitos.push({ label: capitulo, pct: Math.round(avgPct), estado });
  }

  // Ordenar: logrados primero, luego en curso, luego próximos
  return hitos.sort((a, b) => {
    const orden = { logrado: 0, en_curso: 1, proximo: 2 };
    return orden[a.estado] - orden[b.estado];
  });
}

function HitoItem({ hito }: { hito: Hito }) {
  const esLogrado = hito.estado === 'logrado';
  const esProximo = hito.estado === 'proximo';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-700/50 last:border-0">
      {esLogrado ? (
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
      ) : esProximo ? (
        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
        </div>
      ) : (
        <Clock className="w-4 h-4 shrink-0 text-cyan-400" />
      )}
      <span className={`flex-1 text-sm leading-snug ${
        esLogrado ? 'text-slate-300 line-through opacity-70' :
        esProximo ? 'text-orange-300' : 'text-cyan-300'
      }`}>
        {hito.label}
      </span>
      <span className={`text-xs font-bold tabular-nums shrink-0 ${
        esLogrado ? 'text-emerald-400' :
        esProximo ? 'text-orange-400' : 'text-cyan-400'
      }`}>
        {hito.pct}%
      </span>
    </div>
  );
}

// ── Galería / Lightbox ───────────────────────────────────

interface LightboxProps {
  imagen: ImagenObra;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

function Lightbox({ imagen, onClose, onDelete }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full rounded-2xl overflow-hidden bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imagen.dataUrl}
          alt={imagen.nombre}
          className="w-full max-h-[70vh] object-contain"
        />
        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {imagen.descripcion && (
              <p className="text-sm text-slate-200 font-medium truncate">{imagen.descripcion}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {imagen.fecha}
              {imagen.ubicacion && ` · ${imagen.ubicacion}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {onDelete && (
              <button
                onClick={() => { onDelete(imagen.id); onClose(); }}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                title="Eliminar foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FotoThumbProps {
  imagen: ImagenObra;
  onClick: () => void;
}

function FotoThumb({ imagen, onClick }: FotoThumbProps) {
  return (
    <button
      onClick={onClick}
      className="group relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-500/60 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
    >
      <img src={imagen.dataUrl} alt={imagen.nombre} className="w-full h-full object-cover" />
      {/* Overlay con info */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-1">
        <p className="text-[9px] text-white/90 leading-tight truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {imagen.ubicacion ?? imagen.fecha}
        </p>
      </div>
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
      </div>
      {/* Etiqueta de fecha siempre visible */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
        <p className="text-[9px] text-white/80 truncate">{imagen.fecha}</p>
      </div>
    </button>
  );
}

// ── Componente Principal ─────────────────────────────────

interface Props {
  resumenes: ResumenPartida[];
  hitosPrecomputados?: Hito[];   // para la vista pública (snapshot pre-calculado)
  imagenes: ImagenObra[];
  onSubirImagen: (file: File, opts?: { descripcion?: string; ubicacion?: string }) => Promise<void>;
  onEliminarImagen: (id: string) => void;
  soloLectura?: boolean;
}

export function HitosYFotos({
  resumenes,
  hitosPrecomputados,
  imagenes,
  onSubirImagen,
  onEliminarImagen,
  soloLectura = false,
}: Props) {
  const [lightbox, setLightbox] = useState<ImagenObra | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hitos = hitosPrecomputados ?? derivarHitos(resumenes);
  const logrados = hitos.filter(h => h.estado === 'logrado');
  const proximos  = hitos.filter(h => h.estado !== 'logrado');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSubiendo(true);
    try {
      for (const file of files) {
        await onSubirImagen(file);
      }
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      {lightbox && (
        <Lightbox
          imagen={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={soloLectura ? undefined : onEliminarImagen}
        />
      )}

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-5">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Hitos y Fotos de Obra
        </h3>

        {/* ── Hitos ── */}
        <div>
          {resumenes.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Sin datos de avance registrados.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {/* Logrados */}
              {logrados.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    Logrado
                  </p>
                  {logrados.map(h => <HitoItem key={h.label} hito={h} />)}
                </div>
              )}
              {/* Próximos / En curso */}
              {proximos.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
                    Próximo / En Curso
                  </p>
                  {proximos.slice(0, 5).map(h => <HitoItem key={h.label} hito={h} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Galería ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Fotos Recientes ({imagenes.length})
            </p>
            {!soloLectura && (
              <label
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors
                  ${subiendo
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-600/30'
                  }`}
              >
                <Plus className="w-3.5 h-3.5" />
                {subiendo ? 'Subiendo...' : 'Subir foto'}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={subiendo}
                />
              </label>
            )}
          </div>

          {imagenes.length === 0 ? (
            <div
              className={`rounded-xl border-2 border-dashed border-slate-700 p-6 text-center ${
                soloLectura ? '' : 'cursor-pointer hover:border-cyan-600/50 transition-colors'
              }`}
              onClick={() => !soloLectura && inputRef.current?.click()}
            >
              <p className="text-xs text-slate-500">
                {soloLectura ? 'Sin fotos de obra registradas.' : 'Sin fotos aún. Hacé clic para subir.'}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
              {[...imagenes].reverse().map(img => (
                <FotoThumb
                  key={img.id}
                  imagen={img}
                  onClick={() => setLightbox(img)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
