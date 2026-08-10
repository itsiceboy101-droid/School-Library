import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { books, issued_books, students } from '../db/schema';
import { eq, ne } from 'drizzle-orm';
import { getTodayStr, getStudentRestrictionStatus } from '../db/utils';

export const studentPortalRouter = Router();

studentPortalRouter.get('/:id/issued', async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  try {
      const today = getTodayStr();
      const active = await db.query.issued_books.findMany({
          where: (issued_books, { and }) => and(
              eq(issued_books.student_id, studentId),
              ne(issued_books.status, 'returned')
          )
      });
      
      const result = [];
      for (const ib of active) {
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
            book_title: book ? book.title : "Unknown",
            book_author: book ? book.author : "",
            category: book ? book.category : "",
            issue_date: ib.issue_date,
            due_date: ib.due_date,
            status: isOverdue ? "overdue" : "issued",
            days_overdue: daysOverdue,
            fine_amount: 0,
            restriction_note: isOverdue ? "Overdue item: Triggers 2-week borrowing ban" : "On time",
          });
      }
      res.json(result);
  } catch(error: any) {
      res.status(500).json({ error: error.message });
  }
});

studentPortalRouter.get('/:id/history', async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  try {
      const historyItems = await db.query.issued_books.findMany({
          where: (issued_books, { and }) => and(
              eq(issued_books.student_id, studentId),
              eq(issued_books.status, 'returned')
          )
      });
      
      const result = [];
      for (const ib of historyItems) {
          const book = await db.query.books.findFirst({ where: eq(books.id, ib.book_id) });
          result.push({
            id: ib.id,
            book_id: ib.book_id,
            book_title: book ? book.title : "Unknown",
            book_author: book ? book.author : "",
            issue_date: ib.issue_date,
            due_date: ib.due_date,
            return_date: ib.return_date,
            fine_amount: 0,
          });
      }
      result.sort((a, b) => (b.return_date || "").localeCompare(a.return_date || ""));
      res.json(result);
  } catch(error: any) {
      res.status(500).json({ error: error.message });
  }
});

studentPortalRouter.get('/:id/fines', async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  try {
      const restriction = await getStudentRestrictionStatus(studentId);
      res.json({
        total_fine: 0,
        is_restricted: restriction.isRestricted,
        reason: restriction.reason,
        until_date: restriction.untilDate,
        policy_note: "No monetary fines are charged. Returning books late results in a 2-week (14-day) borrowing ban.",
      });
  } catch(error: any) {
      res.status(500).json({ error: error.message });
  }
});
