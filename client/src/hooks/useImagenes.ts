// ============================================================
// ObraTrack — Hook: Imágenes de Obra por Proyecto
// Carga, agrega y elimina imágenes almacenadas en IndexedDB
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { ImagenObra } from '@/lib/types';
import { loadImagenes, addImagen as dbAdd, deleteImagen as dbDelete } from '@/lib/db';

export function useImagenes(proyectoId: string | null) {
  const [imagenes, setImagenes] = useState<ImagenObra[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!proyectoId) { setImagenes([]); return; }
    setCargando(true);
    loadImagenes(proyectoId)
      .then(setImagenes)
      .finally(() => setCargando(false));
  }, [proyectoId]);

  const subirImagen = useCallback(async (
    file: File,
    opts?: { descripcion?: string; ubicacion?: string }
  ) => {
    if (!proyectoId) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const nueva: ImagenObra = {
      id: nanoid(),
      proyectoId,
      nombre: file.name,
      descripcion: opts?.descripcion,
      ubicacion: opts?.ubicacion,
      fecha: new Date().toISOString().split('T')[0],
      dataUrl,
      creadoEn: new Date().toISOString(),
    };

    await dbAdd(nueva);
    setImagenes(prev => [...prev, nueva]);
  }, [proyectoId]);

  const eliminarImagen = useCallback(async (id: string) => {
    await dbDelete(id);
    setImagenes(prev => prev.filter(img => img.id !== id));
  }, []);

  return { imagenes, cargando, subirImagen, eliminarImagen };
}
