import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'sqlite.db');

const client = createClient({ url: `file:${dbPath}` });

async function seed() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        nombre TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    const hash = await bcrypt.hash('admin123', 10);
    const now = Date.now();
    await client.execute({
      sql: `
        INSERT INTO users (email, password_hash, nombre, created_at)
        SELECT 'admin@obratrack.com', ?, 'Administrador', ?
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@obratrack.com');
      `,
      args: [hash, now]
    });
    console.log("✅ Usuario administrador creado exitosamente.");
  } catch (err) {
    console.error("Error seeding DB:", err);
  }
}

seed();
