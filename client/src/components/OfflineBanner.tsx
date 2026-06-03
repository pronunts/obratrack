// ============================================================
// ObraTrack — SyncBanner (reemplaza OfflineBanner)
// Estados: offline | online+pendiente(sync/descartar) | syncing
// ============================================================
import { useState } from 'react';
import { WifiOff, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

type BannerStatus = 'idle' | 'syncing' | 'discarding' | 'confirm-discard';

function getRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function OfflineBanner() {
  const { state, sincronizar, descartarCambiosLocales } = useApp();
  const [status, setStatus] = useState<BannerStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { isOnline, pendientesSincronizacion: pending, ultimaSincronizacion } = state;

  // ── Handlers ──────────────────────────────────────────
  const handleSync = async () => {
    setStatus('syncing');
    setError(null);
    try {
      await sincronizar();
      toast.success(`✓ Sincronización completada`);
    } catch (e: any) {
      setError('Error al sincronizar. Verificá tu conexión.');
      toast.error('No se pudo sincronizar');
    } finally {
      setStatus('idle');
    }
  };

  const handleDiscard = async () => {
    setStatus('discarding');
    setError(null);
    try {
      await descartarCambiosLocales();
      toast.success('Cambios locales descartados — datos actualizados del servidor');
    } catch (e: any) {
      setError('Error al descartar. Intentá de nuevo.');
      toast.error('No se pudo descartar');
    } finally {
      setStatus('idle');
    }
  };

  // ── Render ─────────────────────────────────────────────

  // Syncing / discarding
  if (status === 'syncing' || status === 'discarding') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2.5 shadow-lg">
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
        <span>{status === 'syncing' ? 'Sincronizando con el servidor...' : 'Descartando cambios locales...'}</span>
      </div>
    );
  }

  // Online sin pendientes → no mostrar nada
  if (isOnline && pending === 0) return null;

  // Online con pendientes — mostrar opciones de sync/descartar
  if (isOnline && pending > 0) {
    // Paso de confirmación de descarte
    if (status === 'confirm-discard') {
      return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 shadow-lg flex-wrap text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            ¿Seguro? Se eliminarán permanentemente {pending} {pending === 1 ? 'cambio local' : 'cambios locales'}.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className="bg-white text-amber-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-50 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Confirmar descarte
            </button>
            <button
              onClick={() => { setStatus('idle'); setError(null); }}
              className="border border-white/40 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    // Banner principal con opciones
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 shadow-lg flex-wrap text-sm">
        <RefreshCw className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          {pending} {pending === 1 ? 'cambio local' : 'cambios locales'} sin sincronizar
          {ultimaSincronizacion ? ` · última sync ${getRelativeTime(ultimaSincronizacion)}` : ''}
        </span>
        {error && (
          <span className="text-amber-100 text-xs font-normal">{error}</span>
        )}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSync}
            className="bg-white text-amber-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-50 flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            Sincronizar
          </button>
          <button
            onClick={() => setStatus('confirm-discard')}
            className="border border-white/50 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Descartar
          </button>
        </div>
      </div>
    );
  }

  // Offline
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Sin conexión
        {pending > 0
          ? ` · ${pending} ${pending === 1 ? 'cambio guardado localmente' : 'cambios guardados localmente'}`
          : ' · los cambios se guardan localmente'}
      </span>
    </div>
  );
}
