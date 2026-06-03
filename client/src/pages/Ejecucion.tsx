// ============================================================
// ObraTrack — Módulo 2: Ejecución en Campo (Offline-First)
// Design: Blueprint Engineering — botones grandes, campo real
// ============================================================

import { useState, useMemo, useRef } from 'react';
import {
  Search, Plus, CheckCircle2, Clock, Wifi, WifiOff,
  ChevronDown, ChevronUp, Calendar, Hash, Layers,
  FileText, Edit2, Trash2, X, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import type { PartidaPresupuesto } from '@/lib/types';

function ProgressRing({ pct, size = 48 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct / 100, 1) * circ;
  const color = pct >= 100 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 50 ? '#f57c00' : '#94a3b8';

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
    </svg>
  );
}

interface RegistroFormProps {
  partida: PartidaPresupuesto;
  onClose: () => void;
}

function RegistroForm({ partida, onClose }: RegistroFormProps) {
  const { registrarEjecucion, state } = useApp();
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuánto ya fue ejecutado en esta partida
  const yaEjecutado = state.ejecuciones
    .filter(e => e.partidaId === partida.id)
    .reduce((s, e) => s + e.cantidadEjecutada, 0);
  const restante = Math.max(0, partida.cantidadPlaneada - yaEjecutado);
  const pctActual = partida.cantidadPlaneada > 0
    ? Math.min((yaEjecutado / partida.cantidadPlaneada) * 100, 100)
    : 0;
  const completa = restante <= 0;

  const fmt = (n: number) => n.toLocaleString('es-US', { maximumFractionDigits: 2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cant = parseFloat(cantidad);
    if (!cant || cant <= 0) {
      toast.error('Ingresa una cantidad válida mayor a 0');
      inputRef.current?.focus();
      return;
    }
    if (cant > restante) {
      toast.error(`Supera el máximo permitido`, {
        description: `Podés registrar hasta ${fmt(restante)} ${partida.unidad} (${(100 - pctActual).toFixed(1)}% restante)`,
      });
      inputRef.current?.focus();
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    registrarEjecucion(partida.id, cant, fecha, obs || undefined);
    toast.success(`✓ ${fmt(cant)} ${partida.unidad} registrados`, {
      description: state.isOnline ? 'Guardado y sincronizado' : 'Guardado localmente — pendiente de sincronización',
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                {partida.codigo}
              </span>
              <Badge variant="outline" className="text-xs">{partida.unidad}</Badge>
              {completa && (
                <Badge className="text-xs bg-emerald-500 text-white border-0">
                  100% completada
                </Badge>
              )}
            </div>
            <p className="font-semibold text-sm leading-snug">{partida.descripcion}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Barra de avance actual */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ejecutado: <span className="font-semibold text-foreground tabular-nums">{fmt(yaEjecutado)} {partida.unidad}</span></span>
              <span className="font-semibold tabular-nums">{pctActual.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pctActual >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(pctActual, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completa
                ? 'Esta partida ya está al 100% — no se puede registrar más avance.'
                : <>Disponible para registrar: <span className="font-semibold text-foreground tabular-nums">{fmt(restante)} {partida.unidad}</span> ({(100 - pctActual).toFixed(1)}%)</>
              }
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cantidad" className="text-sm font-semibold">
              Cantidad a Registrar ({partida.unidad})
            </Label>
            <Input
              ref={inputRef}
              id="cantidad"
              type="number"
              step="0.01"
              min="0.01"
              max={restante > 0 ? restante : undefined}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder={completa ? 'Partida completada' : `Máx. ${fmt(restante)} ${partida.unidad}`}
              className="h-14 text-xl font-bold text-center tabular-nums"
              autoFocus
              disabled={completa}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha" className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Fecha de Ejecución
            </Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-sm font-medium">
              Observaciones (opcional)
            </Label>
            <Input
              id="obs"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Condiciones del terreno, incidentes..."
              className="h-12"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-13" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-13 text-base font-bold" disabled={saving || completa}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Ejecucion() {
  const { state, getResumenPartidas, dispatch, sincronizar } = useApp();
  const [query, setQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedPartida, setSelectedPartida] = useState<PartidaPresupuesto | null>(null);
  const [expandedPartida, setExpandedPartida] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const resumenes = getResumenPartidas();

  const chapters = useMemo(() => {
    const seen = new Set<string>();
    const caps: string[] = [];
    state.partidas.forEach((p) => {
      if (!seen.has(p.capitulo)) { seen.add(p.capitulo); caps.push(p.capitulo); }
    });
    return caps;
  }, [state.partidas]);

  const filtered = useMemo(() => {
    return resumenes.filter((p) => {
      const matchQuery =
        !query ||
        p.descripcion.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo.toLowerCase().includes(query.toLowerCase()) ||
        p.capitulo.toLowerCase().includes(query.toLowerCase());
      const matchChapter = !selectedChapter || p.capitulo === selectedChapter;
      return matchQuery && matchChapter;
    });
  }, [resumenes, query, selectedChapter]);

  const handleSync = async () => {
    if (!state.isOnline) {
      toast.error('Sin conexión a internet', { description: 'Conéctate para sincronizar' });
      return;
    }
    setSyncing(true);
    try {
      await sincronizar();
      toast.success('✓ Datos sincronizados correctamente');
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const getEjecucionesPartida = (partidaId: string) =>
    state.ejecuciones
      .filter((e) => e.partidaId === partidaId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const fmt = (n: number) => n.toLocaleString('es-US', { maximumFractionDigits: 2 });

  if (state.partidas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <Layers className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Sin presupuesto cargado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ve al módulo de Línea Base e importa tu CSV primero
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ejecución</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro de avance en campo</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador online/offline */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            ${state.isOnline
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
            }`}>
            {state.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {state.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Banner de pendientes */}
      {state.pendientesSincronizacion > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {state.pendientesSincronizacion} registro{state.pendientesSincronizacion > 1 ? 's' : ''} pendiente{state.pendientesSincronizacion > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Guardados localmente — sincroniza cuando tengas señal
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSync}
            disabled={syncing || !state.isOnline}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white h-9"
          >
            {syncing ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sincronizar'
            )}
          </Button>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar partida por nombre o código..."
          className="h-13 pl-10 text-base"
        />
        {query && (
          <button
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtro por capítulo */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedChapter('')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
            ${!selectedChapter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          Todos ({state.partidas.length})
        </button>
        {chapters.map((cap) => (
          <button
            key={cap}
            onClick={() => setSelectedChapter(cap === selectedChapter ? '' : cap)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors max-w-[160px] truncate
              ${selectedChapter === cap
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {cap.length > 20 ? cap.substring(0, 18) + '…' : cap}
          </button>
        ))}
      </div>

      {/* Lista de partidas */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron partidas</p>
          </div>
        )}

        {filtered.map((p) => {
          const ejecuciones = getEjecucionesPartida(p.id);
          const isExpanded = expandedPartida === p.id;
          const pendientes = ejecuciones.filter((e) => !e.sincronizado).length;

          return (
            <div
              key={p.id}
              className={`bg-card border border-border rounded-xl overflow-hidden transition-shadow
                ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
            >
              {/* Fila principal */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Progress ring */}
                  <div className="relative shrink-0">
                    <ProgressRing pct={p.porcentajeAvance} size={52} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
                      {Math.round(p.porcentajeAvance)}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {p.codigo}
                      </span>
                      <Badge variant="outline" className="text-xs">{p.unidad}</Badge>
                      {pendientes > 0 && (
                        <Badge className="text-xs bg-amber-500 text-white border-0">
                          {pendientes} pend.
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-snug">{p.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {fmt(p.cantidadEjecutadaTotal)} / {fmt(p.cantidadPlaneada)} {p.unidad}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-3">
                  <Button
                    className="flex-1 h-12 text-sm font-bold gap-2"
                    onClick={() => setSelectedPartida(p)}
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Avance
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-3"
                    onClick={() => setExpandedPartida(isExpanded ? null : p.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Historial de ejecuciones */}
              {isExpanded && (
                <div className="border-t border-border">
                  {ejecuciones.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <FileText className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      Sin registros aún
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      <div className="px-4 py-2 bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Historial de Registros
                        </p>
                      </div>
                      {ejecuciones.map((ej) => (
                        <div key={ej.id} className="px-4 py-3 flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${ej.sincronizado ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold tabular-nums">
                                {fmt(ej.cantidadEjecutada)} {p.unidad}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {ej.fecha}
                              </span>
                            </div>
                            {ej.observaciones && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {ej.observaciones}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {ej.sincronizado ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                            <button
                              className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => {
                                dispatch({ type: 'DELETE_EJECUCION', payload: ej.id });
                                toast.info('Registro eliminado');
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de registro */}
      {selectedPartida && (
        <RegistroForm
          partida={selectedPartida}
          onClose={() => setSelectedPartida(null)}
        />
      )}
    </div>
  );
}
