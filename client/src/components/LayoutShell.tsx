// ============================================================
// ObraTrack — Layout Shell: Bottom Nav (móvil) + Sidebar (desktop)
// Design: Blueprint Engineering — azul acero, naranja obra
// ============================================================

import { useLocation } from 'wouter';
import { Link } from 'wouter';
import {
  LayoutDashboard, FileSpreadsheet, HardHat, DollarSign,
  Moon, Sun, Wifi, WifiOff, RefreshCw, Building2, LogOut, Eye
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

const LOGO_URL = '/logo.png';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/app', label: 'Proyectos', icon: Building2 },
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/presupuesto', label: 'Línea Base', icon: FileSpreadsheet },
  { href: '/ejecucion', label: 'Ejecución', icon: HardHat },
  { href: '/costos', label: 'Costos', icon: DollarSign },
  { href: '/cliente', label: 'Vista Cliente', icon: Eye },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme() as { theme: string; toggleTheme: () => void; switchable: boolean };
  const { state, proyectoActivo, sincronizar } = useApp();
  const { user, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!state.isOnline) {
      toast.error('Sin conexión a internet');
      return;
    }
    setSyncing(true);
    try {
      await sincronizar();
      toast.success('✓ Sincronización completada');
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── Sidebar Desktop ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={LOGO_URL} alt="ObraTrack" className="w-9 h-9 rounded-lg object-contain bg-white p-0.5" />
          <div>
            <p className="font-bold text-sidebar-foreground text-base leading-tight">ObraTrack</p>
            <p className="text-xs text-sidebar-foreground/60">Control de Obras Civiles</p>
          </div>
        </div>

        {/* Proyecto activo */}
        {proyectoActivo && (
          <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/60 shrink-0" />
              <p className="text-xs text-sidebar-foreground/60 font-medium">Proyecto Activo</p>
            </div>
            <p className="text-sm font-semibold text-sidebar-foreground mt-0.5 leading-snug">
              {proyectoActivo.nombre}
            </p>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{label}</span>
                  {href === '/ejecucion' && state.pendientesSincronizacion > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {state.pendientesSincronizacion}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          {/* Estado de conexión */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
            ${state.isOnline
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
            }`}>
            {state.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{state.isOnline ? 'Conectado' : 'Sin conexión'}</span>
            {state.pendientesSincronizacion > 0 && (
              <span className="ml-auto font-bold">{state.pendientesSincronizacion} pend.</span>
            )}
          </div>

          {/* Botón sincronizar */}
          {state.pendientesSincronizacion > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing || !state.isOnline}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
          )}

          {/* Toggle tema */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </button>

          <FeedbackModal />

          {/* Usuario + Cerrar sesión */}
          <div className="border-t border-sidebar-border pt-2 mt-1">
            {user && (
              <div className="px-3 py-1.5 mb-1">
                <p className="text-xs text-sidebar-foreground/50 font-medium truncate">{user.email}</p>
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.nombre}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
      {/* ── Contenido Principal ──────────────────────────── */}
      <main className="flex-1 min-w-0">
        {/* Header móvil */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="ObraTrack" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-border" />
            <div>
              <p className="font-bold text-sm leading-tight">ObraTrack</p>
              {proyectoActivo && (
                <p className="text-xs text-muted-foreground leading-tight truncate max-w-[160px]">
                  {proyectoActivo.nombre}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador online */}
            <div className={`w-2 h-2 rounded-full ${state.isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {/* Toggle tema */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            {/* Cerrar sesión (móvil) */}
            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Contenido de página */}
        <div className="px-4 py-5 lg:px-8 lg:py-6 max-w-2xl lg:max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Bottom Navigation Móvil ──────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border safe-area-pb">
        <div className="flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href} className="flex-1">
                <div className={`flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {/* Indicador activo */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                  <div className="relative">
                    <Icon className={`w-5.5 h-5.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {href === '/ejecucion' && state.pendientesSincronizacion > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {state.pendientesSincronizacion > 9 ? '9+' : state.pendientesSincronizacion}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
