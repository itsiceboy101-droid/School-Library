import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { books, issued_books, students, teachers, issue_codes } from '../db/schema';
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
      let studentName = "Unknown";
      let studentCard = "";
      let studentClass = "";
      let studentDiv = "";
      let studentRoll = "";
      
      if (ib.teacher_id) {
        const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, ib.teacher_id) });
        if (teacher) {
            studentName = teacher.name + " (Teacher)";
            studentCard = teacher.username;
            studentClass = teacher.assigned_class ? teacher.assigned_class : "Subject Teacher";
        }
      } else if (ib.student_id) {
        const student = await db.query.students.findFirst({ where: eq(students.id, ib.student_id) });
        if (student) {
            studentName = student.name;
            studentCard = student.library_card_no;
            studentClass = student.class;
            studentDiv = student.division;
            studentRoll = student.roll_no;
        }
      }

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
        teacher_id: ib.teacher_id,
        student_name: studentName,
        student_card_no: studentCard,
        student_class: studentClass,
        student_division: studentDiv,
        student_roll_no: studentRoll,
        book_title: book ? book.title : "Unknown",
        book_author: book ? book.author : "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        status: isOverdue ? "overdue" : "issued",
        days_overdue: daysOverdue,
        issue_code: ib.issue_code,
      });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

issuesRouter.post('/', async (req: Request, res: Response) => {
  const { student_id, teacher_id, book_id, return_days, copies } = req.body;
  if ((!student_id && !teacher_id) || !book_id) {
    return res.status(400).json({ error: 'Borrower and book are required' });
  }

  const sId = student_id ? parseInt(student_id, 10) : undefined;
  const tId = teacher_id ? parseInt(teacher_id, 10) : undefined;
  const bId = parseInt(book_id, 10);
  const days = parseInt(return_days || '14', 10);
  const numCopies = (tId && copies) ? parseInt(String(copies), 10) : 1;

  try {
    let borrowerName = "";

    if (sId) {
      const student = await db.query.students.findFirst({ where: eq(students.id, sId) });
      if (!student) return res.status(400).json({ error: 'Selected student does not exist' });
      borrowerName = student.name;

      const restriction = await getStudentRestrictionStatus(sId);
      if (restriction.isRestricted) {
        return res.status(400).json({
          error: `Issue Blocked: ${student.name} is under a 2-week borrowing ban! (${restriction.reason})`,
          restriction,
        });
      }
    } else if (tId) {
      const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, tId) });
      if (!teacher) return res.status(400).json({ error: 'Selected teacher does not exist' });
      borrowerName = teacher.name;
    }

    const book = await db.query.books.findFirst({ where: eq(books.id, bId) });
    if (!book) return res.status(400).json({ error: 'Selected book does not exist' });
    if (book.available_copies < numCopies) {
      return res.status(400).json({ error: `Not enough available copies for "${book.title}" (requested ${numCopies}, available ${book.available_copies})` });
    }

    if (sId) {
      const existing = await db.query.issued_books.findFirst({
        where: and(
          eq(issued_books.book_id, bId),
          eq(issued_books.student_id, sId),
          ne(issued_books.status, 'returned')
        )
      });

      if (existing) {
        return res.status(400).json({ error: `Student already has "${book.title}" currently issued` });
      }
    }

    // Auto-assign issue codes in the backend
    const allCodesForBook = await db.query.issue_codes.findMany({
      where: eq(issue_codes.book_id, bId),
      orderBy: (issue_codes, { asc }) => [asc(issue_codes.id)]
    });
    
    const currentlyActiveIssues = await db.query.issued_books.findMany({
      where: and(
        eq(issued_books.book_id, bId),
        ne(issued_books.status, 'returned')
      )
    });
    const activeCodeSet = new Set(currentlyActiveIssues.map(i => i.issue_code).filter(Boolean));
    
    const availableCodes = allCodesForBook
      .map(c => c.full_code)
      .filter(code => !activeCodeSet.has(code));
      
    const assignedCodes = [];
    for (let i = 0; i < numCopies; i++) {
       if (i < availableCodes.length) {
         assignedCodes.push(availableCodes[i]);
       } else {
         assignedCodes.push(null);
       }
    }

    const issueDate = getTodayStr();
    const dueDate = getTodayStr(days);

    const newIssues = await (async () => {
        const insertions = [];
        for (let i = 0; i < numCopies; i++) {
          insertions.push({
            book_id: bId,
            student_id: sId || null,
            teacher_id: tId || null,
            issue_date: issueDate,
            due_date: dueDate,
            status: 'issued' as const,
            fine_amount: 0,
            issue_code: assignedCodes[i]
          });
        }
        
        const insertRes = await db.insert(issued_books).values(insertions).returning();

        await db.update(books)
            .set({ available_copies: book.available_copies - numCopies })
            .where(eq(books.id, bId));
        
        return insertRes;
    })();

    res.status(201).json({
      id: newIssues[0].id,
      due_date: dueDate,
      book_title: book.title,
      student_name: borrowerName,
      message: numCopies > 1 
        ? `${numCopies} copies of "${book.title}" issued successfully to ${borrowerName}`
        : `Book "${book.title}" issued successfully to ${borrowerName}`,
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
      let borrowerName = "Unknown";
      let isTeacher = !!record.teacher_id;
      if (isTeacher) {
        const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, record.teacher_id) });
        if (teacher) borrowerName = teacher.name;
      } else {
        const student = await db.query.students.findFirst({ where: eq(students.id, record.student_id) });
        if (student) borrowerName = student.name;
      }

      const book = await db.query.books.findFirst({ where: eq(books.id, record.book_id) });
      
      const isLate = today > record.due_date;
      let banUntilDate: string | null = null;
      if (isLate && !isTeacher) {
        const retDate = new Date(today);
        retDate.setDate(retDate.getDate() + 14);
        banUntilDate = retDate.toISOString().split("T")[0];
      }

      await (async () => {
          await db.update(issued_books)
            .set({ status: 'returned', return_date: today, fine_amount: 0 })
            .where(eq(issued_books.id, issueId));
          
          if (book) {
              await db.update(books)
                .set({ available_copies: Math.min(book.total_copies, book.available_copies + 1) })
                .where(eq(books.id, book.id));
          }
      })();

      if (isLate) {
        res.json({
          message: isTeacher ? 
            `Book "${book?.title}" returned late by Teacher ${borrowerName}. (No ban applied to teachers).` :
            `Book "${book?.title}" returned late. ${borrowerName} is now under a 2-week borrowing ban until ${banUntilDate}.`,
          is_late: true,
          ban_until: banUntilDate,
          book_title: book ? book.title : "",
        });
      } else {
        res.json({
          message: `Book "${book?.title}" returned successfully by ${borrowerName}!`,
          is_late: false,
          ban_until: null,
          book_title: book ? book.title : "",
        });
      }
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});

issuesRouter.put('/:id', async (req: Request, res: Response) => {
  const issueId = parseInt(req.params.id, 10);
  const { due_date } = req.body;
  if (!due_date) return res.status(400).json({ error: 'Due date is required' });

  try {
    const updated = await db.update(issued_books)
      .set({ due_date })
      .where(eq(issued_books.id, issueId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Issue record not found' });
    }

    res.json({ message: 'Due date updated successfully', issue: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
