import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { shares, proyectos, partidas, ejecuciones, gastos } from '../schema.js';
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

  const porMes = new Map<string, typeof allEjecuciones>();
  for (const ej of allEjecuciones) {
    const fecha = new Date(ej.fecha + 'T12:00:00');
    const clave = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    const lista = porMes.get(clave) ?? [];
    lista.push(ej);
    porMes.set(clave, lista);
  }

  const mesesOrdenados: string[] = [];
  for (let i = 0; i <= PUNTOS; i++) {
    const fecha = new Date(inicio.getTime() + duracionMs * (i / PUNTOS));
    const mes   = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    if (!mesesOrdenados.includes(mes)) mesesOrdenados.push(mes);
  }

  const avanceRealPorMes = new Map<string, number>();
  const ejAcum           = new Map<string, number>();

  for (const mes of mesesOrdenados) {
    for (const ej of (porMes.get(mes) ?? [])) {
      ejAcum.set(ej.partidaId, (ejAcum.get(ej.partidaId) ?? 0) + ej.cantidadEjecutada);
    }
    let ap = 0;
    for (const p of allPartidas) {
      const ej2    = ejAcum.get(p.id) ?? 0;
      const pPct   = p.cantidadPlaneada > 0 ? Math.min(ej2 / p.cantidadPlaneada, 1) : 0;
      ap += pPct * (totalPresupuesto > 0 ? p.precioTotalUSD / totalPresupuesto : 0);
    }
    avanceRealPorMes.set(mes, Math.round(ap * 1000) / 10);
  }

  const curvaData = curvaPlan.map(({ mes, planificado }, i) => {
    const fechaPunto = new Date(inicio.getTime() + duracionMs * (i / PUNTOS));
    const real = fechaPunto <= hoy && avanceRealPorMes.has(mes)
      ? avanceRealPorMes.get(mes)
      : undefined;
    return { mes, planificado, real };
  });

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
    imagenes: [],            // las imágenes viven en IndexedDB del cliente — no disponibles en el server
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

    const [proyectoRows, allPartidas, allEjecuciones, allGastos] = await Promise.all([
      db.select().from(proyectos).where(eq(proyectos.id, proyectoId)).limit(1),
      db.select().from(partidas).where(eq(partidas.proyectoId, proyectoId)),
      db.select().from(ejecuciones).where(eq(ejecuciones.proyectoId, proyectoId)),
      db.select().from(gastos).where(eq(gastos.proyectoId, proyectoId)),
    ]);

    if (!proyectoRows.length) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const snapshot = computeSnapshot(proyectoRows[0], allPartidas, allEjecuciones, allGastos);

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
