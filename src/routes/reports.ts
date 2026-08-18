import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students, books, issued_books } from '../db/schema';
import { eq, ne, lt, and } from 'drizzle-orm';
import { getTodayStr, getStudentRestrictionStatus } from '../db/utils';

export const reportsRouter = Router();

reportsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
      const today = getTodayStr();
      const allBooks = await db.query.books.findMany();
      const total_books = allBooks.length;
      const total_copies = allBooks.reduce((acc: number, b: any) => acc + (Number(b.total_copies) || 0), 0);
      const available_copies = allBooks.reduce((acc: number, b: any) => acc + (Number(b.available_copies) || 0), 0);
      
      const activeIssues = await db.query.issued_books.findMany({ where: ne(issued_books.status, 'returned') });
      const issued = activeIssues.length;
      const overdue = activeIssues.filter(ib => ib.due_date < today).length;
      
      const allStudents = await db.query.students.findMany();
      const total_students = allStudents.length;
      
      const allIssuedBooks = await db.query.issued_books.findMany();
      
      const issuedByStudent = new Map();
      allIssuedBooks.forEach(ib => {
          if (!issuedByStudent.has(ib.student_id)) issuedByStudent.set(ib.student_id, []);
          issuedByStudent.get(ib.student_id).push(ib);
      });

      let restricted_students_count = 0;
      allStudents.forEach(s => {
          const studentIssues = issuedByStudent.get(s.id) || [];
          const s_activeIssues = studentIssues.filter((ib: any) => ib.status !== 'returned');
          const activeOverdue = s_activeIssues.find((ib: any) => ib.due_date && ib.due_date < today);
          
          if (activeOverdue) {
              restricted_students_count++;
          } else {
              const returnedLate = studentIssues.filter((ib: any) => ib.status === 'returned' && ib.return_date && ib.due_date && ib.return_date > ib.due_date);
              if (returnedLate.length > 0) {
                  returnedLate.sort((a: any, b: any) => new Date(b.return_date).getTime() - new Date(a.return_date).getTime());
                  const mostRecentLate = returnedLate[0];
                  const returnD = new Date(mostRecentLate.return_date);
                  returnD.setDate(returnD.getDate() + 14);
                  const banUntilStr = returnD.toISOString().split("T")[0];
                  
                  if (today < banUntilStr) {
                      restricted_students_count++;
                  }
              }
          }
      });
      
      res.json({
        total_books,
        total_copies,
        available_copies,
        issued,
        overdue,
        total_students,
        restricted_students_count,
        total_fines_collected: 0,
      });
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});

reportsRouter.get('/overdue', async (req: Request, res: Response) => {
    try {
        const today = getTodayStr();
        const activeOverdue = await db.query.issued_books.findMany({
            where: and(
                ne(issued_books.status, 'returned'),
                lt(issued_books.due_date, today)
            )
        });

        const allStudents = await db.query.students.findMany();
        const allBooks = await db.query.books.findMany();
        
        const studentsMap = new Map();
        allStudents.forEach(s => studentsMap.set(s.id, s));
        
        const booksMap = new Map();
        allBooks.forEach(b => booksMap.set(b.id, b));

        const overdueRecords = [];
        for (const ib of activeOverdue) {
            const student = studentsMap.get(ib.student_id);
            const book = booksMap.get(ib.book_id);
            
            const due = new Date(ib.due_date);
            const now = new Date(today);
            const diffTime = Math.abs(now.getTime() - due.getTime());
            const days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            overdueRecords.push({
                id: ib.id,
                student_id: ib.student_id,
                student_name: student ? student.name : "Unknown",
                student_card_no: student ? student.library_card_no : "",
                student_class: student ? `${student.class}-${student.division}` : "",
                student_roll: student ? student.roll_no : "",
                book_title: book ? book.title : "Unknown",
                book_author: book ? book.author : "",
                issue_date: ib.issue_date,
                due_date: ib.due_date,
                days_overdue,
                fine_amount: 0,
                restriction_status: "2-Week Borrowing Ban Pending Return",
            });
        }
        
        overdueRecords.sort((a, b) => b.days_overdue - a.days_overdue);
        res.json(overdueRecords);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
