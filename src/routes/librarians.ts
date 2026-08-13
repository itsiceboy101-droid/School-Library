import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { librarians } from '../db/schema';
import { eq } from 'drizzle-orm';

export const librariansRouter = Router();

librariansRouter.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, password } = req.body;
  try {
    const updated = await db.update(librarians)
      .set({
        name: name || undefined,
        email: email || undefined,
        password_hash: password || undefined,
      })
      .where(eq(librarians.id, id))
      .returning();
      
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Librarian not found' });
    }
    res.json({ message: 'Librarian updated successfully', librarian: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


librariansRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allLibrarians = await db.query.librarians.findMany({
        orderBy: (librarians, { asc }) => [asc(librarians.id)]
    });
    const mapped = allLibrarians.map(lib => ({ ...lib, password: lib.password_hash }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

librariansRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!email.toLowerCase().endsWith('@podar.org')) {
    return res.status(400).json({ error: 'Only @podar.org email addresses are allowed for librarians.' });
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

  try {
    const librarian = await db.query.librarians.findFirst({ where: eq(librarians.id, id) });
    if (!librarian) {
      return res.status(404).json({ error: 'Librarian not found' });
    }
    if (librarian.email === 'teacher@school.com' || librarian.role === 'head_librarian') {
      return res.status(400).json({ error: 'Cannot delete master account' });
    }

    const deleted = await db.delete(librarians).where(eq(librarians.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Librarian not found' });
    }
    res.json({ message: `Librarian account deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
