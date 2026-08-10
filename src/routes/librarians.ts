import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { librarians } from '../db/schema';
import { eq } from 'drizzle-orm';

export const librariansRouter = Router();

librariansRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allLibrarians = await db.query.librarians.findMany({
        orderBy: (librarians, { asc }) => [asc(librarians.id)]
    });
    res.json(allLibrarians);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

librariansRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await db.query.librarians.findFirst({
        where: eq(librarians.email, email)
    });
    if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const newLibrarian = await db.insert(librarians).values({
      name,
      email,
      password_hash: password,
      role: 'librarian',
    }).returning();

    res.status(201).json({
      message: 'Librarian account created',
      librarian: newLibrarian[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

librariansRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (id === 1) {
    return res.status(400).json({ error: 'Cannot delete master account' });
  }

  try {
    const deleted = await db.delete(librarians).where(eq(librarians.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Librarian not found' });
    }
    res.json({ message: `Librarian account deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
