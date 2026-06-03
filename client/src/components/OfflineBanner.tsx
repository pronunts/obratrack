// ============================================================
// ObraTrack — Banner de Sin Conexión
// Se muestra dentro de la app cuando no hay internet
// ============================================================
import { WifiOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function OfflineBanner() {
  const { state } = useApp();

  if (state.isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Sin conexión — trabajando en modo offline. Tus datos se guardan localmente.</span>
    </div>
  );
}
