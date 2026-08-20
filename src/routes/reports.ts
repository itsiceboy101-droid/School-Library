import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students, books, issued_books, teachers } from '../db/schema';
import { eq, ne } from 'drizzle-orm';
import { getTodayStr } from '../db/utils';

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
      const overdue = activeIssues.filter(ib => (ib.due_date && ib.due_date < today) || ib.status === 'overdue').length;
      
      const allStudents = await db.query.students.findMany();
      const total_students = allStudents.length;
      
      const allIssuedBooks = await db.query.issued_books.findMany();
      
      const issuedByStudent = new Map();
      allIssuedBooks.forEach(ib => {
          if (ib.student_id) {
            if (!issuedByStudent.has(ib.student_id)) issuedByStudent.set(ib.student_id, []);
            issuedByStudent.get(ib.student_id).push(ib);
          }
      });

      let restricted_students_count = 0;
      allStudents.forEach(s => {
          const studentIssues = issuedByStudent.get(s.id) || [];
          const s_activeIssues = studentIssues.filter((ib: any) => ib.status !== 'returned');
          const activeOverdue = s_activeIssues.find((ib: any) => (ib.due_date && ib.due_date < today) || ib.status === 'overdue');
          
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
        const activeIssues = await db.query.issued_books.findMany({
            where: ne(issued_books.status, 'returned')
        });

        const activeOverdue = activeIssues.filter(ib => (ib.due_date && ib.due_date < today) || ib.status === 'overdue');

        const allStudents = await db.query.students.findMany();
        const allTeachers = await db.query.teachers.findMany();
        const allBooks = await db.query.books.findMany();
        
        const studentsMap = new Map();
        allStudents.forEach(s => studentsMap.set(s.id, s));

        const teachersMap = new Map();
        allTeachers.forEach(t => teachersMap.set(t.id, t));
        
        const booksMap = new Map();
        allBooks.forEach(b => booksMap.set(b.id, b));

        const overdueRecords = [];
        for (const ib of activeOverdue) {
            let studentName = "Unknown";
            let studentCard = "";
            let studentClass = "";
            let studentRoll = "";

            let studentEmail: string | null = null;
            let teacherEmail: string | null = null;
            let studentPhone: string | null = null;
            let teacherPhone: string | null = null;

            if (ib.teacher_id) {
                const teacher = teachersMap.get(ib.teacher_id);
                if (teacher) {
                    studentName = teacher.name + " (Teacher)";
                    studentCard = teacher.username;
                    studentClass = teacher.assigned_class ? teacher.assigned_class : "Subject Teacher";
                    teacherEmail = teacher.email || null;
                    teacherPhone = teacher.phone || null;
                }
            } else if (ib.student_id) {
                const student = studentsMap.get(ib.student_id);
                if (student) {
                    studentName = student.name;
                    studentCard = student.library_card_no;
                    studentClass = student.class ? `${student.class}${student.division ? `-${student.division}` : ''}` : "";
                    studentRoll = student.roll_no || "";
                    studentEmail = student.email || null;
                    studentPhone = student.phone || null;
                }
            }

            const book = booksMap.get(ib.book_id);
            
            const due = new Date(ib.due_date);
            const now = new Date(today);
            const diffTime = now.getTime() - due.getTime();
            const days_overdue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            
            overdueRecords.push({
                id: ib.id,
                book_id: ib.book_id,
                student_id: ib.student_id,
                teacher_id: ib.teacher_id,
                student_name: studentName,
                student_card_no: studentCard,
                student_class: studentClass,
                student_roll: studentRoll,
                email: teacherEmail || studentEmail || null,
                student_email: studentEmail,
                teacher_email: teacherEmail,
                student_phone: studentPhone,
                teacher_phone: teacherPhone,
                book_title: book ? book.title : "Unknown",
                book_author: book ? book.author : "",
                issue_date: ib.issue_date,
                due_date: ib.due_date,
                days_overdue,
                fine_amount: 0,
                restriction_status: "2-Week Borrowing Ban Pending Return",
                issue_code: ib.issue_code,
            });
        }
        
        overdueRecords.sort((a, b) => b.days_overdue - a.days_overdue);
        res.json(overdueRecords);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
