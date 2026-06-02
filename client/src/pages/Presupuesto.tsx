// ============================================================
// ObraTrack — Módulo 1: Línea Base (Presupuesto) v2
// Parser MaPreX: CSV + XLSX, detección dinámica de encabezados
// Design: Blueprint Engineering
// ============================================================

import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Download,
  Trash2, ChevronDown, ChevronUp, Building2, FileSpreadsheet,
  Info, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { parseFile, generateSampleCSVMapreX, generateSampleCSVGenerico } from '@/lib/csvParser';
import { useApp } from '@/contexts/AppContext';
import type { PartidaPresupuesto } from '@/lib/types';

const CHAPTER_COLORS = [
  'border-l-blue-600', 'border-l-orange-500', 'border-l-emerald-600',
  'border-l-violet-600', 'border-l-amber-500', 'border-l-rose-600',
  'border-l-cyan-600', 'border-l-lime-600',
];
const getChapterColor = (idx: number) => CHAPTER_COLORS[idx % CHAPTER_COLORS.length];

export default function Presupuesto() {
  const { state, proyectoActivo, importarPresupuesto, dispatch } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [proyectoNombre, setProyectoNombre] = useState(proyectoActivo?.nombre ?? '');
  const [monedaLocal, setMonedaLocal] = useState(proyectoActivo?.monedaLocal ?? 'COP');
  const [tasaCambio, setTasaCambio] = useState(proyectoActivo?.tasaCambioDefault ?? 4000);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['csv', 'xlsx', 'xls'];
    if (!allowed.includes(ext)) {
      toast.error('Solo se aceptan archivos .csv, .xlsx o .xls');
      return;
    }

    setIsParsing(true);
    setParseErrors([]);
    setParseWarnings([]);

    try {
      const result = await parseFile(file);
      setParseErrors(result.errores);
      setParseWarnings(result.advertencias);

      if (result.partidas.length === 0) {
        toast.error(
          result.errores[0] ?? 'No se encontraron partidas válidas',
          { description: 'Revisa el formato del archivo' }
        );
        return;
      }

      await importarPresupuesto(result, {
        nombre: proyectoNombre.trim() || file.name.replace(/\.(csv|xlsx|xls)$/i, ''),
        monedaLocal,
        tasaCambioDefault: tasaCambio,
        archivoOrigen: file.name,
      });

      toast.success(
        `✓ ${result.filasOk} partidas importadas`,
        {
          description: [
            result.meta.formatoDetectado === 'mapre x' ? 'Formato MaPreX detectado' : 'Formato genérico',
            result.errores.length > 0 ? `${result.errores.length} errores` : '',
            result.advertencias.length > 0 ? `${result.advertencias.length} avisos` : '',
          ].filter(Boolean).join(' · '),
        }
      );

      if (result.errores.length > 0) setShowErrors(true);
      if (result.advertencias.length > 0) setShowWarnings(true);
    } catch (err) {
      toast.error(`Error al procesar el archivo: ${String(err)}`);
    } finally {
      setIsParsing(false);
    }
  }, [proyectoNombre, monedaLocal, tasaCambio, importarPresupuesto]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const downloadSample = (formato: 'mapre x' | 'generico') => {
    const csv = formato === 'mapre x' ? generateSampleCSVMapreX() : generateSampleCSVGenerico();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formato === 'mapre x' ? 'presupuesto_mapre_x.csv' : 'presupuesto_generico.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearPresupuesto = () => {
    dispatch({ type: 'SET_PARTIDAS', payload: [] });
    setParseErrors([]);
    setParseWarnings([]);
    toast.info('Presupuesto eliminado');
  };

  const toggleChapter = (cap: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap); else next.add(cap);
      return next;
    });
  };

  const chapters = state.partidas.reduce<Record<string, PartidaPresupuesto[]>>((acc, p) => {
    if (!acc[p.capitulo]) acc[p.capitulo] = [];
    acc[p.capitulo].push(p);
    return acc;
  }, {});

  const totalPresupuesto = state.partidas.reduce((s, p) => s + p.precioTotalUSD, 0);
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Línea Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Importa el presupuesto desde CSV o Excel (MaPreX / Genérico)
          </p>
        </div>
        {state.partidas.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearPresupuesto}
            className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-1.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Datos del proyecto */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Datos del Proyecto</span>
          {proyectoActivo && (
            <Badge className="text-xs bg-primary/10 text-primary border-0 ml-auto">
              {proyectoActivo.nombre}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 space-y-1.5">
            <Label className="text-xs font-medium">Nombre del Proyecto</Label>
            <Input
              value={proyectoNombre}
              onChange={e => setProyectoNombre(e.target.value)}
              placeholder="Ej. Construcción Puente Km 45"
              className="h-11 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Moneda Local</Label>
            <Input
              value={monedaLocal}
              onChange={e => setMonedaLocal(e.target.value.toUpperCase())}
              placeholder="COP, PEN, BOB..."
              maxLength={5}
              className="h-11 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tasa de Cambio (Local / USD)</Label>
            <Input
              type="number"
              value={tasaCambio}
              onChange={e => setTasaCambio(Number(e.target.value))}
              className="h-11 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Zona de carga */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
          ${isParsing ? 'pointer-events-none opacity-70' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isParsing && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
            ${isParsing ? 'bg-primary text-primary-foreground' :
              isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {isParsing ? (
              <span className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {isParsing ? 'Procesando archivo...' :
               isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isParsing ? 'Detectando formato y extrayendo partidas' :
               'o toca para seleccionar desde tu dispositivo'}
            </p>
          </div>
          {!isParsing && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">.csv</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-mono text-muted-foreground">.xlsx</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-mono text-muted-foreground">.xls</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info del parser MaPreX */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5">
          <p className="font-semibold">Parser MaPreX Inteligente</p>
          <p>Detecta automáticamente el formato: omite metadatos iniciales, salta la columna fantasma y busca dinámicamente los encabezados <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">Part No. · Descripción · Unidad · Cantidad · Precio Unitario · Total $</code></p>
        </div>
      </div>

      {/* Botones de descarga de ejemplos */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 gap-2 text-sm" onClick={() => downloadSample('mapre x')}>
          <Download className="w-4 h-4" />
          Ejemplo MaPreX
        </Button>
        <Button variant="outline" className="h-11 gap-2 text-sm" onClick={() => downloadSample('generico')}>
          <Download className="w-4 h-4" />
          Ejemplo Genérico
        </Button>
      </div>

      {/* Errores del parser */}
      {parseErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-red-800 dark:text-red-300"
            onClick={() => setShowErrors(!showErrors)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">{parseErrors.length} error{parseErrors.length > 1 ? 'es' : ''} al importar</span>
            </div>
            {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showErrors && (
            <div className="px-4 pb-4 space-y-1">
              {parseErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-400 font-mono">• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advertencias del parser */}
      {parseWarnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-amber-800 dark:text-amber-300"
            onClick={() => setShowWarnings(!showWarnings)}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span className="font-medium text-sm">{parseWarnings.length} aviso{parseWarnings.length > 1 ? 's' : ''} del parser</span>
            </div>
            {showWarnings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showWarnings && (
            <div className="px-4 pb-4 space-y-1">
              {parseWarnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-400 font-mono">• {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resumen del presupuesto */}
      {state.partidas.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary tabular-nums">{Object.keys(chapters).length}</p>
              <p className="text-xs text-muted-foreground mt-1">Capítulos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold tabular-nums">{state.partidas.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Partidas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
                {fmt(totalPresupuesto)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total USD</p>
            </div>
          </div>

          {/* Tabla por capítulos */}
          <div className="space-y-3">
            {Object.entries(chapters).map(([cap, items], capIdx) => {
              const capTotal = items.reduce((s, p) => s + p.precioTotalUSD, 0);
              const isExpanded = expandedChapters.has(cap);
              return (
                <div key={cap} className={`bg-card border border-border rounded-xl overflow-hidden border-l-4 ${getChapterColor(capIdx)}`}>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => toggleChapter(cap)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{cap}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {items.length} partida{items.length !== 1 ? 's' : ''} · {fmt(capTotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs tabular-nums">
                        {((capTotal / totalPresupuesto) * 100).toFixed(1)}%
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border">
                      {items.map((p, pIdx) => (
                        <div key={p.id} className={`px-4 py-3 flex items-start gap-3 ${pIdx < items.length - 1 ? 'border-b border-border/50' : ''}`}>
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0 mt-0.5">
                            {p.codigo}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{p.descripcion}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                              <span>{p.cantidadPlaneada.toLocaleString()} {p.unidad}</span>
                              <span>PU: {fmt(p.precioUnitarioUSD)}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-foreground shrink-0">
                            {fmt(p.precioTotalUSD)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
