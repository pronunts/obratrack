import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { ImagenObra } from '@/lib/types';
import { loadImagenes, addImagen as dbAdd, deleteImagen as dbDelete } from '@/lib/db';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('obratrack_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function syncImagenToServer(imagen: ImagenObra): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(imagen),
    });
  } catch {
    // Falla silenciosamente — la imagen sigue disponible localmente
  }
}

async function deleteImagenFromServer(id: string): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await fetch(`/api/images/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
  } catch {
    // Falla silenciosamente
  }
}

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

    // Guardar local + subir al servidor en paralelo
    await dbAdd(nueva);
    setImagenes(prev => [...prev, nueva]);
    syncImagenToServer(nueva); // fire-and-forget
  }, [proyectoId]);

  const eliminarImagen = useCallback(async (id: string) => {
    await dbDelete(id);
    setImagenes(prev => prev.filter(img => img.id !== id));
    deleteImagenFromServer(id); // fire-and-forget
  }, []);

  return { imagenes, cargando, subirImagen, eliminarImagen };
}
