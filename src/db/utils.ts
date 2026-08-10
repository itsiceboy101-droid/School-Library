export function getTodayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

import { db } from './db';
import { issued_books, books, students } from './schema';
import { eq, and, ne, lt } from 'drizzle-orm';

export async function getStudentRestrictionStatus(studentId: number): Promise<{
  isRestricted: boolean;
  reason: string | null;
  untilDate: string | null;
}> {
  const today = getTodayStr();
  
  // 1. Check if student has any active unreturned book that is overdue
  const activeOverdue = await db.query.issued_books.findFirst({
    where: and(
        eq(issued_books.student_id, studentId),
        ne(issued_books.status, 'returned'),
        lt(issued_books.due_date, today)
    )
  });

  if (activeOverdue) {
    const book = await db.query.books.findFirst({ where: eq(books.id, activeOverdue.book_id) });
    return {
      isRestricted: true,
      reason: `Overdue item: ${book ? book.title : 'Book'} is past its due date.`,
      untilDate: null, // Restricted until it is returned
    };
  }

  // 2. Check recent history for books returned late
  const returnedLate = await db.query.issued_books.findMany({
    where: and(
        eq(issued_books.student_id, studentId),
        eq(issued_books.status, 'returned')
    ),
    orderBy: (issued_books, { desc }) => [desc(issued_books.return_date)]
  });

  const lateReturns = returnedLate.filter((ib) => ib.return_date && ib.return_date > ib.due_date);

  if (lateReturns.length > 0) {
    const mostRecentLate = lateReturns[0];
    if (mostRecentLate.return_date) {
      const returnD = new Date(mostRecentLate.return_date);
      returnD.setDate(returnD.getDate() + 14);
      const banUntilStr = returnD.toISOString().split("T")[0];

      if (today < banUntilStr) {
        return {
          isRestricted: true,
          reason: `Returned a book late on ${mostRecentLate.return_date}. 2-week borrowing ban in effect.`,
          untilDate: banUntilStr,
        };
      }
    }
  }

  return { isRestricted: false, reason: null, untilDate: null };
}
