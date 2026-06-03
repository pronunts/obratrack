import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  type: text('type').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const proyectos = sqliteTable('proyectos', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  ubicacion: text('ubicacion'),
  fechaInicio: text('fecha_inicio').notNull(),
  fechaFin: text('fecha_fin'),
  monedaLocal: text('moneda_local').notNull().default('USD'),
  tasaCambioDefault: real('tasa_cambio_default').notNull().default(1),
  archivoOrigen: text('archivo_origen'),
  creadoEn: text('creado_en').notNull(),
  actualizadoEn: text('actualizado_en').notNull(),
});

export const partidas = sqliteTable('partidas', {
  id: text('id').primaryKey(),
  proyectoId: text('proyecto_id').notNull().references(() => proyectos.id),
  capitulo: text('capitulo').notNull(),
  codigo: text('codigo').notNull(),
  descripcion: text('descripcion').notNull(),
  unidad: text('unidad').notNull(),
  cantidadPlaneada: real('cantidad_planeada').notNull(),
  precioUnitarioUSD: real('precio_unitario_usd').notNull(),
  precioTotalUSD: real('precio_total_usd').notNull(),
  creadoEn: text('creado_en').notNull(),
});

export const ejecuciones = sqliteTable('ejecuciones', {
  id: text('id').primaryKey(),
  proyectoId: text('proyecto_id').notNull().references(() => proyectos.id),
  partidaId: text('partida_id').notNull(),
  fecha: text('fecha').notNull(),
  cantidadEjecutada: real('cantidad_ejecutada').notNull(),
  observaciones: text('observaciones'),
  creadoEn: text('creado_en').notNull(),
});

export const gastos = sqliteTable('gastos', {
  id: text('id').primaryKey(),
  proyectoId: text('proyecto_id').notNull().references(() => proyectos.id),
  partidaId: text('partida_id').notNull(),
  fecha: text('fecha').notNull(),
  descripcion: text('descripcion').notNull(),
  monto: real('monto').notNull(),
  moneda: text('moneda').notNull(),
  tasaCambio: real('tasa_cambio').notNull(),
  montoUSD: real('monto_usd').notNull(),
  categoria: text('categoria').notNull(),
  creadoEn: text('creado_en').notNull(),
});

// shares_v2: live data — el GET siempre computa desde la DB en vivo
export const shares = sqliteTable('shares_v2', {
  id:         text('id').primaryKey(),
  proyectoId: text('proyecto_id').notNull(),
  userId:     integer('user_id').notNull().references(() => users.id),
  active:     integer('active').notNull().default(1),
  creadoEn:   text('creado_en').notNull(),
});
