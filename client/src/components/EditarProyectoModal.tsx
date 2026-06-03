import { useState } from 'react';
import { X, Save, Building2, MapPin, Calendar, DollarSign, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import type { Proyecto } from '@/lib/types';

const MONEDAS = ['COP', 'PEN', 'BOB', 'ARS', 'CLP', 'MXN', 'VES', 'USD'];

interface Props {
  proyecto: Proyecto;
  onClose: () => void;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export function EditarProyectoModal({ proyecto, onClose }: Props) {
  const { actualizarProyecto } = useApp();

  const [nombre, setNombre]                   = useState(proyecto.nombre);
  const [descripcion, setDescripcion]         = useState(proyecto.descripcion ?? '');
  const [ubicacion, setUbicacion]             = useState(proyecto.ubicacion ?? '');
  const [cliente, setCliente]                 = useState(proyecto.cliente ?? '');
  const [ingenieroResidente, setIngRes]       = useState(proyecto.ingenieroResidente ?? '');
  const [contacto, setContacto]               = useState(proyecto.contacto ?? '');
  const [fechaInicio, setFechaInicio]         = useState(proyecto.fechaInicio);
  const [fechaFin, setFechaFin]               = useState(proyecto.fechaFin ?? '');
  const [monedaLocal, setMonedaLocal]         = useState(proyecto.monedaLocal);
  const [tasaCambio, setTasaCambio]           = useState(String(proyecto.tasaCambioDefault));
  const [saving, setSaving]                   = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (fechaFin && fechaFin < fechaInicio) e.fechaFin = 'La fecha fin debe ser mayor o igual a la fecha inicio';
    const tc = Number(tasaCambio);
    if (isNaN(tc) || tc <= 0) e.tasaCambio = 'Ingresa una tasa de cambio válida (> 0)';
    return e;
  };

  const handleGuardar = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      await actualizarProyecto({
        ...proyecto,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        ubicacion: ubicacion.trim() || undefined,
        cliente: cliente.trim() || undefined,
        ingenieroResidente: ingenieroResidente.trim() || undefined,
        contacto: contacto.trim() || undefined,
        fechaInicio,
        fechaFin: fechaFin || undefined,
        monedaLocal: monedaLocal.toUpperCase(),
        tasaCambioDefault: Number(tasaCambio),
      });
      toast.success('Proyecto actualizado correctamente');
      onClose();
    } catch {
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base">Editar Proyecto</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />Nombre del Proyecto *
            </Label>
            <Input value={nombre} onChange={e => { setNombre(e.target.value); setErrors(ev => ({ ...ev, nombre: '' })); }}
              className="h-12" placeholder="Ej. Construcción Puente Km 45" />
            <FieldError msg={errors.nombre} />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descripción General</Label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Alcance general del proyecto..."
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />Dirección / Ubicación
            </Label>
            <Input value={ubicacion} onChange={e => setUbicacion(e.target.value)} className="h-12" placeholder="Ej. Km 45 Carretera Norte" />
          </div>

          {/* Cliente e Ingeniero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />Cliente / Propietario
              </Label>
              <Input value={cliente} onChange={e => setCliente(e.target.value)} className="h-12" placeholder="Nombre del cliente" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />Ingeniero Residente
              </Label>
              <Input value={ingenieroResidente} onChange={e => setIngRes(e.target.value)} className="h-12" placeholder="Nombre del ingeniero" />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />Contacto del Ingeniero
            </Label>
            <Input value={contacto} onChange={e => setContacto(e.target.value)} className="h-12" placeholder="Email o teléfono (opcional)" />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />Fecha de Inicio *
              </Label>
              <Input type="date" value={fechaInicio}
                onChange={e => { setFechaInicio(e.target.value); setErrors(ev => ({ ...ev, fechaFin: '' })); }}
                className="h-12" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />Fecha Fin Planeada
              </Label>
              <Input type="date" value={fechaFin}
                onChange={e => { setFechaFin(e.target.value); setErrors(ev => ({ ...ev, fechaFin: '' })); }}
                className="h-12" />
              <FieldError msg={errors.fechaFin} />
            </div>
          </div>

          {/* Moneda y Tasa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />Moneda Local
              </Label>
              <div className="flex gap-1.5 flex-wrap">
                {MONEDAS.map(m => (
                  <button key={m} onClick={() => setMonedaLocal(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors
                      ${monedaLocal === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tasa de Cambio (Local / USD)</Label>
              <Input type="number" value={tasaCambio} min="0.0001" step="0.01"
                onChange={e => { setTasaCambio(e.target.value); setErrors(ev => ({ ...ev, tasaCambio: '' })); }}
                className="h-12 font-mono" placeholder="Ej. 4200" />
              <FieldError msg={errors.tasaCambio} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button className="flex-1 h-12 font-bold" onClick={handleGuardar} disabled={saving}>
            {saving
              ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />Guardando...</>
              : <><Save className="w-4 h-4 mr-2" />Guardar</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
