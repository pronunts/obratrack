import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-obratrack';

authRouter.post('/register', async (req, res): Promise<any> => {
  try {
    const { email, password, nombre } = req.body;
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.insert(users).values({
      email,
      passwordHash,
      nombre,
      createdAt: new Date(),
    }).returning().get();

    const token = jwt.sign({ userId: result.id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({ user: { id: result.id, email: result.email, nombre: result.nombre }, token });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

authRouter.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: { id: user.id, email: user.email, nombre: user.nombre }, token });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

authRouter.get('/me', async (req, res): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).get();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: { id: user.id, email: user.email, nombre: user.nombre } });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});
