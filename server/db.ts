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

export const db = drizzle(client, { schema });
