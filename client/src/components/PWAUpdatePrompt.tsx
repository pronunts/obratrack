// ============================================================
// ObraTrack — PWA Update Prompt
// Muestra un banner cuando hay una nueva versión disponible
// ============================================================
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Revisar por actualizaciones cada hora
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-industrial-navy border border-brand-orange/40 rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4 text-brand-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Nueva versión disponible</p>
          <p className="text-xs text-white/60 mt-0.5">Actualiza para obtener las últimas mejoras.</p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="mt-2 text-xs font-semibold text-brand-orange hover:text-orange-400 transition-colors"
          >
            Actualizar ahora →
          </button>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
