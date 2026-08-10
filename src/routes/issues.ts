import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { books, issued_books, students } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getTodayStr, getStudentRestrictionStatus } from '../db/utils';

export const issuesRouter = Router();

issuesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const today = getTodayStr();
    const activeIssues = await db.query.issued_books.findMany({
      where: ne(issued_books.status, 'returned')
    });
    
    const result = [];
    for (const ib of activeIssues) {
      const student = await db.query.students.findFirst({ where: eq(students.id, ib.student_id) });
      const book = await db.query.books.findFirst({ where: eq(books.id, ib.book_id) });
      
      const isOverdue = ib.due_date < today;
      let daysOverdue = 0;
      if (isOverdue) {
        const due = new Date(ib.due_date);
        const now = new Date(today);
        const diffTime = Math.abs(now.getTime() - due.getTime());
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      result.push({
        id: ib.id,
        book_id: ib.book_id,
        student_id: ib.student_id,
        student_name: student ? student.name : "Unknown",
        student_card_no: student ? student.library_card_no : "",
        student_class: student ? student.class : "",
        student_division: student ? student.division : "",
        student_roll_no: student ? student.roll_no : "",
        book_title: book ? book.title : "Unknown",
        book_author: book ? book.author : "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        status: isOverdue ? "overdue" : "issued",
        days_overdue: daysOverdue,
      });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

issuesRouter.post('/', async (req: Request, res: Response) => {
  const { student_id, book_id, return_days } = req.body;
  if (!student_id || !book_id) {
    return res.status(400).json({ error: 'Student and book are required' });
  }

  const sId = parseInt(student_id, 10);
  const bId = parseInt(book_id, 10);
  const days = parseInt(return_days || '14', 10);

  try {
    const student = await db.query.students.findFirst({ where: eq(students.id, sId) });
    if (!student) return res.status(400).json({ error: 'Selected student does not exist' });

    const restriction = await getStudentRestrictionStatus(sId);
    if (restriction.isRestricted) {
      return res.status(400).json({
        error: `Issue Blocked: ${student.name} is under a 2-week borrowing ban! (${restriction.reason})`,
        restriction,
      });
    }

    const book = await db.query.books.findFirst({ where: eq(books.id, bId) });
    if (!book) return res.status(400).json({ error: 'Selected book does not exist' });
    if (book.available_copies < 1) {
      return res.status(400).json({ error: `No available copies for "${book.title}"` });
    }

    const existing = await db.query.issued_books.findFirst({
      where: and(
        eq(issued_books.student_id, sId),
        eq(issued_books.book_id, bId),
        ne(issued_books.status, 'returned')
      )
    });

    if (existing) {
      return res.status(400).json({ error: `Student already has "${book.title}" currently issued` });
    }

    const issueDate = getTodayStr();
    const dueDate = getTodayStr(days);

    const newIssue = await db.transaction(async (tx) => {
        const insertRes = await tx.insert(issued_books).values({
            book_id: bId,
            student_id: sId,
            issue_date: issueDate,
            due_date: dueDate,
            status: 'issued',
            fine_amount: 0
        }).returning();

        await tx.update(books)
            .set({ available_copies: book.available_copies - 1 })
            .where(eq(books.id, bId));
        
        return insertRes[0];
    });

    res.status(201).json({
      id: newIssue.id,
      due_date: dueDate,
      book_title: book.title,
      student_name: student.name,
      message: `Book "${book.title}" issued successfully to ${student.name}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

issuesRouter.post('/:issueId', async (req: Request, res: Response) => {
  const issueId = parseInt(req.params.issueId, 10);
  
  try {
      const record = await db.query.issued_books.findFirst({ where: eq(issued_books.id, issueId) });
      if (!record || record.status === 'returned') {
        return res.status(400).json({ error: 'Invalid or already returned record' });
      }

      const today = getTodayStr();
      const student = await db.query.students.findFirst({ where: eq(students.id, record.student_id) });
      const book = await db.query.books.findFirst({ where: eq(books.id, record.book_id) });

      const isLate = today > record.due_date;
      let banUntilDate: string | null = null;
      if (isLate) {
        const retDate = new Date(today);
        retDate.setDate(retDate.getDate() + 14);
        banUntilDate = retDate.toISOString().split("T")[0];
      }

      await db.transaction(async (tx) => {
          await tx.update(issued_books)
            .set({ status: 'returned', return_date: today, fine_amount: 0 })
            .where(eq(issued_books.id, issueId));
          
          if (book) {
              await tx.update(books)
                .set({ available_copies: Math.min(book.total_copies, book.available_copies + 1) })
                .where(eq(books.id, book.id));
          }
      });

      if (isLate) {
        res.json({
          message: `Book "${book ? book.title : ''}" returned late. ${student ? student.name : 'Student'} is now under a 2-week borrowing ban until ${banUntilDate}.`,
          is_late: true,
          ban_until: banUntilDate,
          book_title: book ? book.title : "",
        });
      } else {
        res.json({
          message: `Book "${book ? book.title : ''}" returned on time successfully! ${student ? student.name : 'Student'} remains eligible to borrow.`,
          is_late: false,
          ban_until: null,
          book_title: book ? book.title : "",
        });
      }
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});
