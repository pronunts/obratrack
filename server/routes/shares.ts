import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { shares } from '../schema.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const sharesRouter = Router();

// POST /api/shares — admin crea un snapshot compartible (requiere auth)
sharesRouter.post('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { proyectoId, snapshot } = req.body;

    if (!proyectoId || !snapshot) {
      return res.status(400).json({ error: 'proyectoId y snapshot son requeridos' });
    }

    // Serializar snapshot a JSON si viene como objeto
    const snapshotStr = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

    const token = nanoid(12); // 12 chars — suficiente entropía, URL-friendly
    const now   = new Date().toISOString();

    await db.insert(shares).values({
      id: token,
      proyectoId,
      userId: req.userId!,
      snapshot: snapshotStr,
      creadoEn: now,
    });

    res.json({ token, url: `/share/${token}` });
  } catch (err) {
    console.error('[shares] Error creando share:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/shares/:token — lectura pública, sin auth
sharesRouter.get('/:token', async (req, res): Promise<any> => {
  try {
    const { token } = req.params;

    const rows = await db.select().from(shares).where(eq(shares.id, token)).limit(1);

    if (!rows.length) {
      return res.status(404).json({ error: 'Link no encontrado o expirado' });
    }

    const row = rows[0];
    const snapshot = JSON.parse(row.snapshot);

    res.json({ snapshot, creadoEn: row.creadoEn });
  } catch (err) {
    console.error('[shares] Error leyendo share:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/shares/:token — el admin puede revocar su propio share
sharesRouter.delete('/:token', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { token } = req.params;

    const rows = await db.select().from(shares).where(eq(shares.id, token)).limit(1);

    if (!rows.length) {
      return res.status(404).json({ error: 'Share no encontrado' });
    }

    if (rows[0].userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await db.delete(shares).where(eq(shares.id, token));
    res.json({ ok: true });
  } catch (err) {
    console.error('[shares] Error eliminando share:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
