import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { books } from '../db/schema';
import { eq, ilike, or } from 'drizzle-orm';

export const booksRouter = Router();

booksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allBooks = await db.query.books.findMany({
        orderBy: (books, { asc }) => [asc(books.id)]
    });
    res.json(allBooks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

booksRouter.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json([]);
  }
  
  try {
    const searchResults = await db.query.books.findMany({
      where: or(
        ilike(books.title, `%${query}%`),
        ilike(books.author, `%${query}%`)
      ),
      limit: 10
    });
    res.json(searchResults);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

booksRouter.post('/', async (req: Request, res: Response) => {
  const { title, author, category, isbn, publisher, total_copies } = req.body;
  if (!title || !author || !total_copies) {
    return res.status(400).json({ error: 'Title, author, and total copies are required' });
  }

  try {
    const newBook = await db.insert(books).values({
      title,
      author,
      category: category || '',
      isbn: isbn || '',
      publisher: publisher || '',
      total_copies: parseInt(total_copies, 10),
      available_copies: parseInt(total_copies, 10),
    }).returning();

    res.status(201).json({
      message: 'Book added successfully',
      book: newBook[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

booksRouter.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { title, author, category, isbn, publisher, total_copies } = req.body;
  
  try {
    const currentBook = await db.query.books.findFirst({ where: eq(books.id, id) });
    if (!currentBook) return res.status(404).json({ error: 'Book not found' });
    
    const newTotal = parseInt(total_copies, 10);
    const diff = newTotal - currentBook.total_copies;
    const newAvailable = Math.max(0, currentBook.available_copies + diff);

    const updatedBook = await db.update(books).set({
      title,
      author,
      category,
      isbn,
      publisher,
      total_copies: newTotal,
      available_copies: newAvailable
    }).where(eq(books.id, id)).returning();

    res.json({ message: 'Book updated successfully', book: updatedBook[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

booksRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    const deleted = await db.delete(books).where(eq(books.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
