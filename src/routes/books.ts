import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { books, issued_books, issue_codes } from '../db/schema';
import { eq, ilike, or, and, ne } from 'drizzle-orm';

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

    // Auto-generate issue codes for the new book so auto-assign works immediately
    const firstTwo = String(newBook[0].id % 100).padStart(2, '0');
    const insertions = [];
    for (let i = 1; i <= parseInt(total_copies, 10); i++) {
      const formattedLastTwo = String(i).padStart(2, '0');
      insertions.push({
        book_id: newBook[0].id,
        first_two: firstTwo,
        last_two: formattedLastTwo,
        full_code: `${firstTwo}${formattedLastTwo}`,
      });
    }
    if (insertions.length > 0) {
      await db.insert(issue_codes).values(insertions);
    }

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
    if (isNaN(newTotal) || newTotal < 1) {
      return res.status(400).json({ error: 'Total copies must be at least 1' });
    }

    const currentlyIssued = currentBook.total_copies - currentBook.available_copies;
    if (newTotal < currentlyIssued) {
      return res.status(400).json({
        error: `Cannot set total copies to ${newTotal}. At least ${currentlyIssued} ${currentlyIssued === 1 ? 'copy is' : 'copies are'} currently issued.`
      });
    }

    const newAvailable = newTotal - currentlyIssued;

    const updatedBook = await db.update(books).set({
      title,
      author,
      category,
      isbn,
      publisher,
      total_copies: newTotal,
      available_copies: newAvailable
    }).where(eq(books.id, id)).returning();

    // Auto-generate additional issue codes if they exist for this book, or if there are none
    const existingCodes = await db.query.issue_codes.findMany({
      where: eq(issue_codes.book_id, id),
      orderBy: (issue_codes, { asc }) => [asc(issue_codes.id)]
    });

    if (existingCodes.length === 0) {
      const firstTwo = String(id % 100).padStart(2, '0');
      const insertions = [];
      for (let i = 1; i <= newTotal; i++) {
        const formattedLastTwo = String(i).padStart(2, '0');
        insertions.push({
          book_id: id,
          first_two: firstTwo,
          last_two: formattedLastTwo,
          full_code: `${firstTwo}${formattedLastTwo}`,
        });
      }
      if (insertions.length > 0) {
        await db.insert(issue_codes).values(insertions);
      }
    } else if (newTotal > existingCodes.length) {
      const firstTwo = existingCodes[0].first_two;
      const insertions = [];
      for (let i = existingCodes.length + 1; i <= newTotal; i++) {
        const formattedLastTwo = String(i).padStart(2, '0');
        insertions.push({
          book_id: id,
          first_two: firstTwo,
          last_two: formattedLastTwo,
          full_code: `${firstTwo}${formattedLastTwo}`,
        });
      }
      if (insertions.length > 0) {
        await db.insert(issue_codes).values(insertions);
      }
    }

    res.json({ message: 'Book updated successfully', book: updatedBook[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

booksRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    const currentBook = await db.query.books.findFirst({ where: eq(books.id, id) });
    if (!currentBook) return res.status(404).json({ error: 'Book not found' });

    const activeIssues = await db.query.issued_books.findMany({
      where: and(
        eq(issued_books.book_id, id),
        ne(issued_books.status, 'returned')
      )
    });

    if (activeIssues.length > 0) {
      return res.status(400).json({
        error: `Cannot delete book while ${activeIssues.length} ${activeIssues.length === 1 ? 'copy is' : 'copies are'} currently issued.`
      });
    }

    const deleted = await db.delete(books).where(eq(books.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
