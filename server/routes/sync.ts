import { Router } from 'express';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db.js';
import { proyectos, partidas, ejecuciones, gastos } from '../schema.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const syncRouter = Router();

// ── GET /api/sync — devuelve todos los datos del usuario autenticado ─────────
syncRouter.get('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.userId!;

    const userProyectos = await db
      .select()
      .from(proyectos)
      .where(eq(proyectos.userId, userId));

    if (userProyectos.length === 0) {
      return res.json({ proyectos: [], partidas: [], ejecuciones: [], gastos: [] });
    }

    const proyectoIds = userProyectos.map(p => p.id);

    const [allPartidas, allEjecuciones, allGastos] = await Promise.all([
      db.select().from(partidas).where(inArray(partidas.proyectoId, proyectoIds)),
      db.select().from(ejecuciones).where(inArray(ejecuciones.proyectoId, proyectoIds)),
      db.select().from(gastos).where(inArray(gastos.proyectoId, proyectoIds)),
    ]);

    // Mapear al formato que espera el cliente (camelCase + sincronizado: true)
    res.json({
      proyectos: userProyectos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion ?? undefined,
        ubicacion: p.ubicacion ?? undefined,
        fechaInicio: p.fechaInicio,
        fechaFin: p.fechaFin ?? undefined,
        monedaLocal: p.monedaLocal,
        tasaCambioDefault: p.tasaCambioDefault,
        archivoOrigen: p.archivoOrigen ?? undefined,
        cliente: p.cliente ?? undefined,
        ingenieroResidente: p.ingenieroResidente ?? undefined,
        contacto: p.contacto ?? undefined,
        creadoEn: p.creadoEn,
        actualizadoEn: p.actualizadoEn,
        sincronizado: true,
      })),
      partidas: allPartidas.map(p => ({
        id: p.id,
        proyectoId: p.proyectoId,
        capitulo: p.capitulo,
        codigo: p.codigo,
        descripcion: p.descripcion,
        unidad: p.unidad,
        cantidadPlaneada: p.cantidadPlaneada,
        precioUnitarioUSD: p.precioUnitarioUSD,
        precioTotalUSD: p.precioTotalUSD,
        creadoEn: p.creadoEn,
        sincronizado: true,
      })),
      ejecuciones: allEjecuciones.map(e => ({
        id: e.id,
        proyectoId: e.proyectoId,
        partidaId: e.partidaId,
        fecha: e.fecha,
        cantidadEjecutada: e.cantidadEjecutada,
        observaciones: e.observaciones ?? undefined,
        creadoEn: e.creadoEn,
        sincronizado: true,
      })),
      gastos: allGastos.map(g => ({
        id: g.id,
        proyectoId: g.proyectoId,
        partidaId: g.partidaId,
        fecha: g.fecha,
        descripcion: g.descripcion,
        monto: g.monto,
        moneda: g.moneda,
        tasaCambio: g.tasaCambio,
        montoUSD: g.montoUSD,
        categoria: g.categoria,
        creadoEn: g.creadoEn,
        sincronizado: true,
      })),
    });
  } catch (error) {
    console.error('Error en GET /api/sync:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/sync — upsert masivo de datos del cliente ───────────────────────
syncRouter.post('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.userId!;
    const {
      proyectos: clientProyectos = [],
      partidas: clientPartidas = [],
      ejecuciones: clientEjecuciones = [],
      gastos: clientGastos = [],
    } = req.body;

    // Obtener los IDs de proyectos válidos del usuario (seguridad)
    const existingProyectos = await db
      .select({ id: proyectos.id })
      .from(proyectos)
      .where(eq(proyectos.userId, userId));
    const ownedIds = new Set(existingProyectos.map(p => p.id));

    // Upsert proyectos
    for (const p of clientProyectos) {
      await db.insert(proyectos).values({
        id: p.id,
        userId,
        nombre: p.nombre,
        descripcion: p.descripcion ?? null,
        ubicacion: p.ubicacion ?? null,
        fechaInicio: p.fechaInicio,
        fechaFin: p.fechaFin ?? null,
        monedaLocal: p.monedaLocal,
        tasaCambioDefault: p.tasaCambioDefault,
        archivoOrigen: p.archivoOrigen ?? null,
        cliente: p.cliente ?? null,
        ingenieroResidente: p.ingenieroResidente ?? null,
        contacto: p.contacto ?? null,
        creadoEn: p.creadoEn,
        actualizadoEn: p.actualizadoEn,
      }).onConflictDoUpdate({
        target: proyectos.id,
        set: {
          nombre: p.nombre,
          descripcion: p.descripcion ?? null,
          ubicacion: p.ubicacion ?? null,
          fechaInicio: p.fechaInicio,
          fechaFin: p.fechaFin ?? null,
          monedaLocal: p.monedaLocal,
          tasaCambioDefault: p.tasaCambioDefault,
          archivoOrigen: p.archivoOrigen ?? null,
          cliente: p.cliente ?? null,
          ingenieroResidente: p.ingenieroResidente ?? null,
          contacto: p.contacto ?? null,
          actualizadoEn: p.actualizadoEn,
        },
      });
      ownedIds.add(p.id);
    }

    // Upsert partidas (solo de proyectos del usuario)
    const validPartidas = clientPartidas.filter((p: any) => ownedIds.has(p.proyectoId));
    for (const p of validPartidas) {
      await db.insert(partidas).values({
        id: p.id,
        proyectoId: p.proyectoId,
        capitulo: p.capitulo,
        codigo: p.codigo,
        descripcion: p.descripcion,
        unidad: p.unidad,
        cantidadPlaneada: p.cantidadPlaneada,
        precioUnitarioUSD: p.precioUnitarioUSD,
        precioTotalUSD: p.precioTotalUSD,
        creadoEn: p.creadoEn ?? new Date().toISOString(),
      }).onConflictDoUpdate({
        target: partidas.id,
        set: {
          capitulo: p.capitulo,
          codigo: p.codigo,
          descripcion: p.descripcion,
          unidad: p.unidad,
          cantidadPlaneada: p.cantidadPlaneada,
          precioUnitarioUSD: p.precioUnitarioUSD,
          precioTotalUSD: p.precioTotalUSD,
        },
      });
    }

    // Upsert ejecuciones
    const validEjecuciones = clientEjecuciones.filter((e: any) => ownedIds.has(e.proyectoId));
    for (const e of validEjecuciones) {
      await db.insert(ejecuciones).values({
        id: e.id,
        proyectoId: e.proyectoId,
        partidaId: e.partidaId,
        fecha: e.fecha,
        cantidadEjecutada: e.cantidadEjecutada,
        observaciones: e.observaciones ?? null,
        creadoEn: e.creadoEn ?? new Date().toISOString(),
      }).onConflictDoUpdate({
        target: ejecuciones.id,
        set: {
          cantidadEjecutada: e.cantidadEjecutada,
          observaciones: e.observaciones ?? null,
        },
      });
    }

    // Upsert gastos
    const validGastos = clientGastos.filter((g: any) => ownedIds.has(g.proyectoId));
    for (const g of validGastos) {
      await db.insert(gastos).values({
        id: g.id,
        proyectoId: g.proyectoId,
        partidaId: g.partidaId,
        fecha: g.fecha,
        descripcion: g.descripcion,
        monto: g.monto,
        moneda: g.moneda,
        tasaCambio: g.tasaCambio,
        montoUSD: g.montoUSD,
        categoria: g.categoria,
        creadoEn: g.creadoEn ?? new Date().toISOString(),
      }).onConflictDoUpdate({
        target: gastos.id,
        set: {
          descripcion: g.descripcion,
          monto: g.monto,
          moneda: g.moneda,
          tasaCambio: g.tasaCambio,
          montoUSD: g.montoUSD,
          categoria: g.categoria,
        },
      });
    }

    res.json({
      success: true,
      counts: {
        proyectos: clientProyectos.length,
        partidas: validPartidas.length,
        ejecuciones: validEjecuciones.length,
        gastos: validGastos.length,
      },
    });
  } catch (error) {
    console.error('Error en POST /api/sync:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /api/sync/proyecto/:id — elimina un proyecto y todos sus datos ─────
syncRouter.delete('/proyecto/:id', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.userId!;
    const proyectoId = req.params.id;

    const [owned] = await db
      .select({ id: proyectos.id, userId: proyectos.userId })
      .from(proyectos)
      .where(eq(proyectos.id, proyectoId));

    if (!owned || owned.userId !== userId) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Borrar en cascada manual (SQLite sin CASCADE DELETE configurado)
    await db.delete(gastos).where(eq(gastos.proyectoId, proyectoId));
    await db.delete(ejecuciones).where(eq(ejecuciones.proyectoId, proyectoId));
    await db.delete(partidas).where(eq(partidas.proyectoId, proyectoId));
    await db.delete(proyectos).where(eq(proyectos.id, proyectoId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/sync/proyecto/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
