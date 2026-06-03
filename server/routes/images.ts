import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db.js';
import { imagenesObra, proyectos } from '../schema.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const imagesRouter = Router();

// POST /api/images — upserta una imagen (crea o actualiza por id)
imagesRouter.post('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id, proyectoId, nombre, descripcion, fecha, ubicacion, dataUrl, creadoEn } = req.body;
    if (!id || !proyectoId || !dataUrl) return res.status(400).json({ error: 'Faltan campos' });

    // Verificar que el proyecto pertenece al usuario
    const [proy] = await db.select({ id: proyectos.id })
      .from(proyectos)
      .where(and(eq(proyectos.id, proyectoId), eq(proyectos.userId, req.userId!)))
      .limit(1);
    if (!proy) return res.status(403).json({ error: 'Proyecto no autorizado' });

    await db.insert(imagenesObra).values({
      id, proyectoId, userId: req.userId!,
      nombre: nombre ?? 'Sin nombre',
      descripcion: descripcion ?? null,
      fecha: fecha ?? new Date().toISOString().slice(0, 10),
      ubicacion: ubicacion ?? null,
      dataUrl,
      creadoEn: creadoEn ?? new Date().toISOString(),
    }).onConflictDoUpdate({
      target: imagenesObra.id,
      set: { nombre, descripcion, fecha, ubicacion, dataUrl },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[images] POST error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/images/:id — elimina una imagen del servidor
imagesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const [img] = await db.select().from(imagenesObra).where(eq(imagenesObra.id, req.params.id)).limit(1);
    if (!img) return res.status(404).json({ error: 'No encontrada' });
    if (img.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

    await db.delete(imagenesObra).where(eq(imagenesObra.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});
