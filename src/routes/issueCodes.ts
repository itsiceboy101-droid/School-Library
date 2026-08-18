import { Router } from 'express';
import { db } from '../db/db';
import { issue_codes, books, issued_books } from '../db/schema';
import { eq, desc, and, ne } from 'drizzle-orm';

export const issueCodesRouter = Router();

// GET all issue codes with book details
issueCodesRouter.get('/', async (req, res) => {
  try {
    const list = await db.select({
      id: issue_codes.id,
      book_id: issue_codes.book_id,
      book_title: books.title,
      book_author: books.author,
      first_two: issue_codes.first_two,
      last_two: issue_codes.last_two,
      full_code: issue_codes.full_code,
      created_at: issue_codes.created_at,
    })
    .from(issue_codes)
    .leftJoin(books, eq(issue_codes.book_id, books.id))
    .orderBy(desc(issue_codes.created_at));

    res.json(list);
  } catch (err: any) {
    console.error('Error fetching issue codes:', err);
    res.status(500).json({ error: 'Failed to fetch issue codes' });
  }
});

// POST create a new 4-digit issue code
issueCodesRouter.post('/', async (req, res) => {
  try {
    const { book_id, first_two } = req.body;

    if (!book_id) {
      return res.status(400).json({ error: 'Book selection is required' });
    }

    if (!first_two || !/^\d{1,2}$/.test(String(first_two).trim())) {
      return res.status(400).json({ error: 'First 2 digits must be numbers (e.g. 12 or 05)' });
    }

    const book = await db.query.books.findFirst({
      where: eq(books.id, Number(book_id))
    });

    if (!book) {
      return res.status(400).json({ error: 'Book not found' });
    }

    const formattedFirstTwo = String(first_two).trim().padStart(2, '0').slice(0, 2);
    
    const insertions = [];
    for (let i = 1; i <= book.total_copies; i++) {
      const formattedLastTwo = String(i).padStart(2, '0');
      const fullCode = `${formattedFirstTwo}${formattedLastTwo}`;
      insertions.push({
        book_id: Number(book_id),
        first_two: formattedFirstTwo,
        last_two: formattedLastTwo,
        full_code: fullCode,
      });
    }

    // Delete existing issue codes for this book to replace them, or just insert new ones?
    // Let's delete existing first to prevent duplicates if they regenerate.
    await db.delete(issue_codes).where(eq(issue_codes.book_id, Number(book_id)));
    
    // Nullify existing issue codes for active issues of this book
    await db.update(issued_books)
        .set({ issue_code: null })
        .where(
            and(
                eq(issued_books.book_id, Number(book_id)),
                ne(issued_books.status, 'returned')
            )
        );

    const insertedList = await db.insert(issue_codes).values(insertions).returning();

    // Map new codes to any active issued books
    const activeIssues = await db.query.issued_books.findMany({
      where: and(
        eq(issued_books.book_id, Number(book_id)),
        ne(issued_books.status, 'returned')
      ),
      orderBy: (issued_books, { asc }) => [asc(issued_books.id)]
    });

    for (let i = 0; i < activeIssues.length; i++) {
      if (i < insertedList.length) {
        await db.update(issued_books)
          .set({ issue_code: insertedList[i].full_code })
          .where(eq(issued_books.id, activeIssues[i].id));
      }
    }

    // Fetch joined book info for all inserted
    const results = await db.select({
      id: issue_codes.id,
      book_id: issue_codes.book_id,
      book_title: books.title,
      book_author: books.author,
      first_two: issue_codes.first_two,
      last_two: issue_codes.last_two,
      full_code: issue_codes.full_code,
      created_at: issue_codes.created_at,
    })
    .from(issue_codes)
    .leftJoin(books, eq(issue_codes.book_id, books.id))
    .where(eq(issue_codes.book_id, Number(book_id)))
    .orderBy(desc(issue_codes.created_at));

    // Return the array of newly created codes, but the frontend might just expect a single object if it appends.
    // However, if we return the list, the frontend's `IssueCodeManager` might break if it expects one object.
    // Let's check `IssueCodeManager.tsx`.
    res.json(results);
  } catch (err: any) {
    console.error('Error creating issue code:', err);
    res.status(500).json({ error: 'Failed to generate issue code' });
  }
});

// PUT update first 2 digits of an issue code
issueCodesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_two } = req.body;

    if (!first_two || !/^\d{1,2}$/.test(String(first_two).trim())) {
      return res.status(400).json({ error: 'First 2 digits must be numbers (e.g. 12 or 05)' });
    }

    const formattedFirstTwo = String(first_two).trim().padStart(2, '0').slice(0, 2);

    const existing = await db.query.issue_codes.findFirst({
      where: eq(issue_codes.id, Number(id)),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Issue code record not found' });
    }

    const fullCode = `${formattedFirstTwo}${existing.last_two}`;

    await db.update(issue_codes)
      .set({
        first_two: formattedFirstTwo,
        full_code: fullCode,
      })
      .where(eq(issue_codes.id, Number(id)));

    // Cascade update to issued_books
    await db.update(issued_books)
      .set({ issue_code: fullCode })
      .where(
        and(
          eq(issued_books.book_id, existing.book_id),
          eq(issued_books.issue_code, existing.full_code)
        )
      );

    const [updated] = await db.select({
      id: issue_codes.id,
      book_id: issue_codes.book_id,
      book_title: books.title,
      book_author: books.author,
      first_two: issue_codes.first_two,
      last_two: issue_codes.last_two,
      full_code: issue_codes.full_code,
      created_at: issue_codes.created_at,
    })
    .from(issue_codes)
    .leftJoin(books, eq(issue_codes.book_id, books.id))
    .where(eq(issue_codes.id, Number(id)));

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating issue code:', err);
    res.status(500).json({ error: 'Failed to update issue code' });
  }
});

// DELETE issue code
issueCodesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the code was being used in an active issue, and nullify it
    const codeToDelete = await db.query.issue_codes.findFirst({
        where: eq(issue_codes.id, Number(id))
    });
    
    if (codeToDelete) {
        await db.update(issued_books)
            .set({ issue_code: null })
            .where(
                and(
                    eq(issued_books.book_id, codeToDelete.book_id),
                    eq(issued_books.issue_code, codeToDelete.full_code)
                )
            );
    }

    await db.delete(issue_codes).where(eq(issue_codes.id, Number(id)));
    res.json({ message: 'Issue code deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting issue code:', err);
    res.status(500).json({ error: 'Failed to delete issue code' });
  }
});
