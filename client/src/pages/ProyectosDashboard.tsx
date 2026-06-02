// ============================================================
// ObraTrack — Dashboard de Proyectos (pantalla de aterrizaje)
// Design: Blueprint Engineering — multi-proyecto
// ============================================================

import { useState } from 'react';
import {
  Plus, Building2, ChevronRight, Trash2, FolderOpen,
  Calendar, DollarSign, Layers, Clock, CheckCircle2,
  AlertTriangle, WifiOff, Wifi, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import type { Proyecto } from '@/lib/types';

const HERO_IMG = 'https://private-us-east-1.manuscdn.com/sessionFile/FTtUQULIBZNay0pvsbzuTe/sandbox/NsPWxdjdEySWGjqv8Pe7N3-img-1_1771515159000_na1fn_aGVyby1kYXNoYm9hcmQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRlR0VVFVTElCWk5heTBwdnNienVUZS9zYW5kYm94L05zUFd4ZGpkRXlTV0dqcXY4UGU3TjMtaW1nLTFfMTc3MTUxNTE1OTAwMF9uYTFmbl9hR1Z5Ynkxa1lYTm9ZbTloY21RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UNxmMusBBoZW85uV1ETbrwX4aOLDFWNiobKPV9SO62lcFqZKK3vixV50S6GHaDsa703x9wBXCrzkYdy~w5VcEuunGjaAGk65WyiaxLuPR0G1H3J0o~jA0NVCqfjO3oBwaWt09lzlJaCIgQvlVkdm5l1XpUeHfn0uVFMgRoR6rq7Cpae6fn9cwzT4KHRkntjmW8gy6Lf8rVxP0xC8c5cxPx5yssQDsb3-R0wGkvtY9QhSb7alfqoScjgtxZuwsjeWuCFESn3fmnfkh7xq-KqGYWkZVTSIrSpD702rklvaYRSVwtv88muiTqE~uxUQuTAMjZGRoG0kioM8lZYDM68GdQ__';

interface NuevoProyectoFormProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

function NuevoProyectoForm({ onClose, onCreated }: NuevoProyectoFormProps) {
  const { crearProyecto, seleccionarProyecto } = useApp();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [monedaLocal, setMonedaLocal] = useState('COP');
  const [tasaCambio, setTasaCambio] = useState(4000);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error('El nombre del proyecto es requerido'); return; }
    setSaving(true);
    try {
      const proyecto = await crearProyecto({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        ubicacion: ubicacion.trim() || undefined,
        fechaInicio,
        monedaLocal: monedaLocal.toUpperCase(),
        tasaCambioDefault: tasaCambio,
      });
      await seleccionarProyecto(proyecto.id);
      toast.success(`✓ Proyecto "${proyecto.nombre}" creado`);
      onCreated(proyecto.id);
    } catch (err) {
      toast.error('Error al crear el proyecto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Nuevo Proyecto</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Nombre del Proyecto *</Label>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Construcción Puente Km 45"
              className="h-12"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descripción</Label>
            <Input
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción breve del proyecto"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Ubicación</Label>
            <Input
              value={ubicacion}
              onChange={e => setUbicacion(e.target.value)}
              placeholder="Ej. Km 45, Vía Bogotá-Medellín"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Fecha de Inicio</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Moneda Local</Label>
              <Input
                value={monedaLocal}
                onChange={e => setMonedaLocal(e.target.value.toUpperCase())}
                placeholder="COP, PEN, BOB..."
                maxLength={5}
                className="h-11 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tasa (Local/USD)</Label>
              <Input
                type="number"
                value={tasaCambio}
                onChange={e => setTasaCambio(Number(e.target.value))}
                className="h-11 font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-12 font-bold" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Proyecto
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProyectoCardProps {
  proyecto: Proyecto;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ProyectoCard({ proyecto, isActive, onSelect, onDelete }: ProyectoCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className={`relative bg-card border rounded-2xl overflow-hidden transition-all cursor-pointer group
        ${isActive
          ? 'border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-sm'
        }`}
      onClick={onSelect}
    >
      {/* Barra de color superior */}
      <div className={`h-1.5 w-full ${isActive ? 'bg-primary' : 'bg-border'}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm leading-tight truncate">{proyecto.nombre}</p>
                {isActive && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0 shrink-0">
                    Activo
                  </Badge>
                )}
              </div>
              {proyecto.descripcion && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{proyecto.descripcion}</p>
              )}
              {proyecto.ubicacion && (
                <p className="text-xs text-muted-foreground/70 truncate">{proyecto.ubicacion}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${
                confirmDelete
                  ? 'bg-destructive text-destructive-foreground'
                  : 'hover:bg-destructive/10 hover:text-destructive text-muted-foreground opacity-0 group-hover:opacity-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-primary' : 'text-muted-foreground'} group-hover:translate-x-0.5`} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{proyecto.fechaInicio}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span className="font-mono">{proyecto.monedaLocal}/{proyecto.tasaCambioDefault.toLocaleString()}</span>
          </div>
          {!proyecto.sincronizado && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              <span>Pend.</span>
            </div>
          )}
        </div>

        {confirmDelete && (
          <div className="mt-2 p-2 bg-destructive/10 rounded-lg text-xs text-destructive font-medium text-center">
            Toca de nuevo para confirmar eliminación
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProyectosDashboard() {
  const { state, seleccionarProyecto, eliminarProyecto } = useApp();
  const [showForm, setShowForm] = useState(false);

  const handleSelect = async (id: string) => {
    if (id === state.proyectoActivoId) return;
    try {
      await seleccionarProyecto(id);
      toast.success('Proyecto cargado');
    } catch {
      toast.error('Error al cargar el proyecto');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eliminarProyecto(id);
      toast.info('Proyecto eliminado');
    } catch {
      toast.error('Error al eliminar el proyecto');
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-40">
        <img src={HERO_IMG} alt="Obras civiles" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
            ${state.isOnline ? 'bg-emerald-900/70 text-emerald-300' : 'bg-red-900/70 text-red-300'}`}>
            {state.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {state.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-bold text-white">Mis Proyectos</h1>
          <p className="text-xs text-white/70 mt-0.5">
            {state.proyectos.length} proyecto{state.proyectos.length !== 1 ? 's' : ''} · Selecciona uno para trabajar
          </p>
        </div>
      </div>

      {/* Botón nuevo proyecto */}
      <Button className="w-full h-13 gap-2 font-bold text-base" onClick={() => setShowForm(true)}>
        <Plus className="w-5 h-5" />
        Nuevo Proyecto
      </Button>

      {/* Lista de proyectos */}
      {state.proyectos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin proyectos aún</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Crea tu primer proyecto y luego importa el presupuesto CSV/XLSX desde la pestaña "Línea Base"
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Proyectos Guardados
          </p>
          {state.proyectos.map(proyecto => (
            <ProyectoCard
              key={proyecto.id}
              proyecto={proyecto}
              isActive={proyecto.id === state.proyectoActivoId}
              onSelect={() => handleSelect(proyecto.id)}
              onDelete={() => handleDelete(proyecto.id)}
            />
          ))}
        </div>
      )}

      {/* Info de almacenamiento */}
      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
        <Layers className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Los datos se almacenan en <strong>IndexedDB</strong> en tu dispositivo (sin límite de 5MB).
          Usa el botón "Sincronizar" cuando tengas conexión para respaldar en la nube.
        </p>
      </div>

      {showForm && (
        <NuevoProyectoForm
          onClose={() => setShowForm(false)}
          onCreated={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
