// ============================================================
// ObraTrack — Panel de compartir (estilo artifact publish)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Share2, Copy, Check, ExternalLink, X,
  Globe, EyeOff, RefreshCw, Link2,
} from 'lucide-react';

interface ShareInfo {
  token: string;
  active: boolean;
  creadoEn: string;
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('obratrack_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Props {
  proyectoId: string;
  onClose: () => void;
}

export function SharePanel({ proyectoId, onClose }: Props) {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [working, setWorking]     = useState(false);
  const [copied, setCopied]       = useState(false);

  const shareUrl = shareInfo
    ? `${window.location.origin}/share/${shareInfo.token}`
    : null;

  // Cargar estado actual del share para este proyecto
  const loadShare = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/shares/project/${proyectoId}`, {
        headers: { ...authHeader() },
      });
      if (!r.ok) throw new Error();
      const { share } = await r.json();
      setShareInfo(share);
    } catch {
      setShareInfo(null);
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => { loadShare(); }, [loadShare]);

  const handleActivar = async () => {
    setWorking(true);
    try {
      const r = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ proyectoId }),
      });
      if (!r.ok) throw new Error();
      const { token } = await r.json();
      setShareInfo({ token, active: true, creadoEn: new Date().toISOString() });
    } finally {
      setWorking(false);
    }
  };

  const handleRevocar = async () => {
    if (!shareInfo) return;
    setWorking(true);
    try {
      await fetch(`/api/shares/${shareInfo.token}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
      });
      setShareInfo({ ...shareInfo, active: false });
    } finally {
      setWorking(false);
    }
  };

  const handleCopiar = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fechaFmt = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Handle móvil */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Compartir con cliente</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Estado */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                shareInfo?.active
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-800/60 border-slate-700'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  shareInfo?.active ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {shareInfo?.active ? 'Compartiendo activamente' : 'Sin compartir'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {shareInfo?.active
                      ? `Cualquier persona con el link puede ver el avance · Activo desde ${fechaFmt(shareInfo.creadoEn)}`
                      : 'El cliente necesita el link para acceder al reporte'
                    }
                  </p>
                </div>
              </div>

              {/* Link (solo cuando activo) */}
              {shareInfo?.active && shareUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                    <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="flex-1 text-xs text-slate-300 font-mono truncate">
                      {shareUrl}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopiar}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                      }`}
                    >
                      {copied
                        ? <><Check className="w-4 h-4" />Copiado</>
                        : <><Copy className="w-4 h-4" />Copiar link</>
                      }
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors border border-cyan-500"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver reporte
                    </a>
                  </div>
                </div>
              )}

              {/* Info datos en vivo */}
              {shareInfo?.active && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Los datos se actualizan <span className="text-slate-300 font-medium">automáticamente</span> cada vez que se sincroniza el proyecto. El cliente siempre ve la información más reciente.
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="space-y-2 pt-1">
                {!shareInfo?.active ? (
                  <button
                    onClick={handleActivar}
                    disabled={working}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-cyan-900/30"
                  >
                    {working
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</>
                      : <><Globe className="w-4 h-4" />Generar link</>
                    }
                  </button>
                ) : (
                  <button
                    onClick={handleRevocar}
                    disabled={working}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-transparent hover:bg-red-500/10 disabled:opacity-50 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 font-medium text-sm transition-colors"
                  >
                    {working
                      ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <EyeOff className="w-4 h-4" />
                    }
                    Revocar acceso
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
