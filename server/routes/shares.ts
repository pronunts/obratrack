import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { shares, proyectos, partidas, ejecuciones, gastos, imagenesObra } from '../schema.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const sharesRouter = Router();

// ── Cálculos en vivo (replicados del cliente) ─────────────

const PUNTOS = 24;

function sigmoidCurva(inicio: Date, fin: Date) {
  const duracionMs = fin.getTime() - inicio.getTime();
  const k = 10;
  const sigMin = 1 / (1 + Math.exp(-k * (0 - 0.5)));
  const sigMax = 1 / (1 + Math.exp(-k * (1 - 0.5)));
  const resultado: { mes: string; planificado: number }[] = [];

  for (let i = 0; i <= PUNTOS; i++) {
    const t = i / PUNTOS;
    const s = 1 / (1 + Math.exp(-k * (t - 0.5)));
    const pct = ((s - sigMin) / (sigMax - sigMin)) * 100;
    const fecha = new Date(inicio.getTime() + duracionMs * t);
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    resultado.push({ mes, planificado: Math.round(pct * 10) / 10 });
  }
  return resultado;
}

function computeSnapshot(
  proyecto: any,
  allPartidas: any[],
  allEjecuciones: any[],
  allGastos: any[],
  allImagenes: any[] = [],
) {
  const totalPresupuesto = allPartidas.reduce((s: number, p: any) => s + p.precioTotalUSD, 0);
  const totalGastado     = allGastos.reduce((s: number, g: any) => s + g.montoUSD, 0);

  // Avance por partida
  const ejPorPartida = new Map<string, number>();
  for (const ej of allEjecuciones) {
    ejPorPartida.set(ej.partidaId, (ejPorPartida.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada);
  }

  let avancePonderadoTotal = 0;
  const capituloMap = new Map<string, { total: number; count: number }>();

  for (const p of allPartidas) {
    const ejecutado  = ejPorPartida.get(p.id) ?? 0;
    const pctPartida = p.cantidadPlaneada > 0 ? Math.min(ejecutado / p.cantidadPlaneada, 1) : 0;
    const peso       = totalPresupuesto > 0 ? p.precioTotalUSD / totalPresupuesto : 0;
    avancePonderadoTotal += pctPartida * peso;

    // Hitos por capítulo
    const cap = capituloMap.get(p.capitulo) ?? { total: 0, count: 0 };
    cap.total += pctPartida * 100;
    cap.count += 1;
    capituloMap.set(p.capitulo, cap);
  }

  const avanceFisico      = Math.round(avancePonderadoTotal * 1000) / 10;
  const avanceFinanciero  = totalPresupuesto > 0
    ? Math.min((totalGastado / totalPresupuesto) * 100, 100)
    : 0;
  const desviacionPct     = totalPresupuesto > 0
    ? ((totalGastado - totalPresupuesto) / totalPresupuesto) * 100
    : 0;

  // Hitos
  const hitos = Array.from(capituloMap.entries()).map(([label, { total, count }]) => {
    const pct    = Math.round(total / count);
    const estado = pct >= 90 ? 'logrado' : pct >= 5 ? 'en_curso' : 'proximo';
    return { label, pct, estado };
  }).sort((a, b) => {
    const ord: Record<string, number> = { logrado: 0, en_curso: 1, proximo: 2 };
    return ord[a.estado] - ord[b.estado];
  });

  // Días
  const inicio  = new Date(proyecto.fechaInicio + 'T12:00:00');
  const fin     = proyecto.fechaFin
    ? new Date(proyecto.fechaFin + 'T12:00:00')
    : new Date(inicio.getTime() + 365 * 86400000);
  const hoy     = new Date();
  const diasTranscurridos = Math.max(0, Math.floor((hoy.getTime() - inicio.getTime()) / 86400000));
  const diasRestantes     = proyecto.fechaFin
    ? Math.max(0, Math.floor((fin.getTime() - hoy.getTime()) / 86400000))
    : null;

  // Curva S
  const curvaPlan = sigmoidCurva(inicio, fin);
  const duracionMs = fin.getTime() - inicio.getTime();

  const mesLabel = (d: Date) =>
    d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

  const progressAt = (d: Date): number => {
    if (totalPresupuesto === 0) return 0;
    const cutoff = d.toISOString().slice(0, 10);
    const ejHasta = allEjecuciones.filter((ej: any) => ej.fecha <= cutoff);
    const ejPP = new Map<string, number>();
    for (const ej of ejHasta) {
      ejPP.set(ej.partidaId, (ejPP.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada);
    }
    let acc = 0;
    for (const p of allPartidas) {
      const ej  = ejPP.get(p.id) ?? 0;
      const pct = p.cantidadPlaneada > 0 ? Math.min(ej / p.cantidadPlaneada, 1) : 0;
      acc += pct * (p.precioTotalUSD / totalPresupuesto);
    }
    return Math.round(acc * 1000) / 10;
  };

  // Mapa de puntos (deduplicado por mes)
  const curvaMap = new Map<string, { date: Date; planificado: number; real?: number }>();

  // Puntos del plan
  for (let i = 0; i <= PUNTOS; i++) {
    const d   = new Date(inicio.getTime() + duracionMs * (i / PUNTOS));
    const mes = mesLabel(d);
    if (!curvaMap.has(mes)) curvaMap.set(mes, { date: d, planificado: curvaPlan[i]?.planificado ?? 0 });
  }

  // Anclajes mensuales pasados
  if (allEjecuciones.length > 0 && hoy >= inicio) {
    const anchors: Date[] = [new Date(inicio)];
    const cursor = new Date(inicio);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= hoy) { anchors.push(new Date(cursor)); cursor.setMonth(cursor.getMonth() + 1); }
    anchors.push(new Date(hoy));

    for (const d of anchors) {
      if (d > hoy) continue;
      const mes  = mesLabel(d);
      const real = progressAt(d);
      if (curvaMap.has(mes)) curvaMap.set(mes, { ...curvaMap.get(mes)!, real });
      else {
        const t = Math.max(0, Math.min(1, (d.getTime() - inicio.getTime()) / duracionMs));
        const s = 1 / (1 + Math.exp(-10 * (t - 0.5)));
        const plan = Math.round(((s - sigMin) / (sigMax - sigMin)) * 1000) / 10;
        curvaMap.set(mes, { date: d, planificado: plan, real });
      }
    }
  }

  let curvaData = Array.from(curvaMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date, planificado, real }) => ({
      mes: mesLabel(date),
      planificado: Math.round(planificado * 10) / 10,
      real: date > hoy ? undefined : real,
    }));

  // Garantizar mínimo 2 puntos reales para que Recharts dibuje una línea
  if (allEjecuciones.length > 0 && curvaData.filter(d => d.real !== undefined).length === 1) {
    curvaData = [{ mes: 'Inicio', planificado: 0, real: 0 }, ...curvaData];
  }

  return {
    proyecto: {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion ?? undefined,
      ubicacion: proyecto.ubicacion ?? undefined,
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin ?? undefined,
      monedaLocal: proyecto.monedaLocal,
      tasaCambioDefault: proyecto.tasaCambioDefault,
    },
    kpis: {
      avanceFisico,
      avanceFinanciero: Math.round(avanceFinanciero * 10) / 10,
      totalPresupuestadoUSD: totalPresupuesto,
      totalGastadoUSD: totalGastado,
      desviacionPct: Math.round(desviacionPct * 10) / 10,
      totalPartidas: allPartidas.length,
      partidasCompletas: Array.from(ejPorPartida.entries())
        .filter(([id, ej]) => {
          const p = allPartidas.find((pp: any) => pp.id === id);
          return p && ej >= p.cantidadPlaneada;
        }).length,
      diasTranscurridos,
      diasRestantes,
    },
    curvaData,
    hitos,
    imagenes: allImagenes.map((img: any) => ({
      id: img.id,
      nombre: img.nombre,
      descripcion: img.descripcion ?? undefined,
      fecha: img.fecha,
      ubicacion: img.ubicacion ?? undefined,
      dataUrl: img.dataUrl,
    })),
    generadoEn: new Date().toISOString(),
  };
}

// ── GET /api/shares/project/:proyectoId — estado del share (requiere auth) ──
sharesRouter.get('/project/:proyectoId', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const rows = await db.select().from(shares).where(
      and(eq(shares.proyectoId, req.params.proyectoId), eq(shares.userId, req.userId!))
    ).limit(1);

    if (!rows.length) return res.json({ share: null });

    const s = rows[0];
    res.json({
      share: { token: s.id, active: !!s.active, creadoEn: s.creadoEn },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── POST /api/shares — crea o reactiva share (requiere auth) ─────────────────
sharesRouter.post('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { proyectoId } = req.body;
    if (!proyectoId) return res.status(400).json({ error: 'proyectoId requerido' });

    // ¿Ya existe un share para este proyecto y usuario?
    const existing = await db.select().from(shares).where(
      and(eq(shares.proyectoId, proyectoId), eq(shares.userId, req.userId!))
    ).limit(1);

    if (existing.length) {
      // Reactivar si estaba revocado
      if (!existing[0].active) {
        await db.update(shares).set({ active: 1 }).where(eq(shares.id, existing[0].id));
      }
      return res.json({ token: existing[0].id, url: `/share/${existing[0].id}` });
    }

    // Crear nuevo
    const token = nanoid(12);
    await db.insert(shares).values({
      id: token,
      proyectoId,
      userId: req.userId!,
      active: 1,
      creadoEn: new Date().toISOString(),
    });

    res.json({ token, url: `/share/${token}` });
  } catch (err) {
    console.error('[shares] POST error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/shares/:token — datos en vivo, público ──────────────────────────
sharesRouter.get('/:token', async (req, res): Promise<any> => {
  try {
    const rows = await db.select().from(shares).where(eq(shares.id, req.params.token)).limit(1);

    if (!rows.length || !rows[0].active) {
      return res.status(404).json({ error: 'Link no encontrado o revocado' });
    }

    const { proyectoId } = rows[0];

    const [proyectoRows, allPartidas, allEjecuciones, allGastos, allImagenes] = await Promise.all([
      db.select().from(proyectos).where(eq(proyectos.id, proyectoId)).limit(1),
      db.select().from(partidas).where(eq(partidas.proyectoId, proyectoId)),
      db.select().from(ejecuciones).where(eq(ejecuciones.proyectoId, proyectoId)),
      db.select().from(gastos).where(eq(gastos.proyectoId, proyectoId)),
      db.select().from(imagenesObra).where(eq(imagenesObra.proyectoId, proyectoId)),
    ]);

    if (!proyectoRows.length) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const snapshot = computeSnapshot(proyectoRows[0], allPartidas, allEjecuciones, allGastos, allImagenes);

    res.json({ snapshot, creadoEn: rows[0].creadoEn });
  } catch (err) {
    console.error('[shares] GET error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /api/shares/:token — revocar (requiere auth) ─────────────────────
sharesRouter.delete('/:token', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const rows = await db.select().from(shares).where(eq(shares.id, req.params.token)).limit(1);

    if (!rows.length)             return res.status(404).json({ error: 'Share no encontrado' });
    if (rows[0].userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

    await db.update(shares).set({ active: 0 }).where(eq(shares.id, req.params.token));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});
