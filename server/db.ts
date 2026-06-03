import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the db file is created
const dbPath = path.join(__dirname, 'sqlite.db');
const client = createClient({ 
  url: process.env.TURSO_DATABASE_URL || `file:${dbPath}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize DB schema manually for simplicity
client.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

client.execute(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

client.execute(`
  CREATE TABLE IF NOT EXISTS proyectos (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    ubicacion TEXT,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT,
    moneda_local TEXT NOT NULL DEFAULT 'USD',
    tasa_cambio_default REAL NOT NULL DEFAULT 1,
    archivo_origen TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

client.execute(`
  CREATE TABLE IF NOT EXISTS partidas (
    id TEXT PRIMARY KEY,
    proyecto_id TEXT NOT NULL,
    capitulo TEXT NOT NULL,
    codigo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    unidad TEXT NOT NULL,
    cantidad_planeada REAL NOT NULL,
    precio_unitario_usd REAL NOT NULL,
    precio_total_usd REAL NOT NULL,
    creado_en TEXT NOT NULL,
    FOREIGN KEY(proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
  );
`);

client.execute(`
  CREATE TABLE IF NOT EXISTS ejecuciones (
    id TEXT PRIMARY KEY,
    proyecto_id TEXT NOT NULL,
    partida_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    cantidad_ejecutada REAL NOT NULL,
    observaciones TEXT,
    creado_en TEXT NOT NULL,
    FOREIGN KEY(proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
  );
`);

client.execute(`
  CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY,
    proyecto_id TEXT NOT NULL,
    partida_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    moneda TEXT NOT NULL,
    tasa_cambio REAL NOT NULL,
    monto_usd REAL NOT NULL,
    categoria TEXT NOT NULL,
    creado_en TEXT NOT NULL,
    FOREIGN KEY(proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
  );
`);

// shares v2: live data (sin snapshot estático)
client.execute(`
  CREATE TABLE IF NOT EXISTS shares_v2 (
    id TEXT PRIMARY KEY,
    proyecto_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`).catch(() => {
  // La tabla ya existe o error no crítico — la unicidad se maneja en el route handler
});

export const db = drizzle(client, { schema });
