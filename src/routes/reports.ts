import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students, books, issued_books, teachers } from '../db/schema';
import { eq, ne, desc } from 'drizzle-orm';
import { getTodayStr } from '../db/utils';

export const reportsRouter = Router();

// GET /api/reports/summary (Live Operational + Inventory Summary)
reportsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const today = getTodayStr();
    const allBooks = await db.query.books.findMany();
    const total_books = allBooks.length;
    const total_copies = allBooks.reduce((acc: number, b: any) => acc + (Number(b.total_copies) || 0), 0);
    const available_copies = allBooks.reduce((acc: number, b: any) => acc + (Number(b.available_copies) || 0), 0);
    const checked_out_copies = Math.max(0, total_copies - available_copies);

    const allIssuedBooks = await db.query.issued_books.findMany();
    const activeIssues = allIssuedBooks.filter(ib => ib.status !== 'returned');
    const issued = activeIssues.length;
    const overdue = activeIssues.filter(ib => (ib.due_date && ib.due_date < today) || ib.status === 'overdue').length;
    const due_today = activeIssues.filter(ib => ib.due_date === today).length;

    const today_issued = allIssuedBooks.filter(ib => ib.issue_date === today).length;
    const today_returned = allIssuedBooks.filter(ib => ib.return_date === today).length;

    const allStudents = await db.query.students.findMany();
    const total_students = allStudents.length;

    const allTeachers = await db.query.teachers.findMany();
    const total_teachers = allTeachers.length;

    const issuedByStudent = new Map<number, any[]>();
    allIssuedBooks.forEach((ib: any) => {
      if (ib.student_id) {
        const sid = Number(ib.student_id);
        if (!issuedByStudent.has(sid)) issuedByStudent.set(sid, []);
        issuedByStudent.get(sid)!.push(ib);
      }
    });

    let restricted_students_count = 0;
    allStudents.forEach((s: any) => {
      const studentIssues = issuedByStudent.get(Number(s.id)) || [];
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
          const banUntilStr = returnD.toISOString().split('T')[0];

          if (today < banUntilStr) { if (s.manual_ban_lift_date && s.manual_ban_lift_date >= mostRecentLate.return_date) { } else {
            restricted_students_count++; }
          }
        }
      }
    });

    res.json({
      total_books,
      total_copies,
      available_copies,
      checked_out_copies,
      issued,
      overdue,
      due_today,
      today_issued,
      today_returned,
      total_students,
      total_teachers,
      restricted_students_count,
      total_all_time_issues: allIssuedBooks.length,
      total_all_time_returns: allIssuedBooks.filter(ib => ib.status === 'returned').length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/overdue (List of currently overdue books)
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
      let studentName = 'Unknown Borrower';
      let studentCard = '';
      let studentClass = '';
      let studentRoll = '';
      let isTeacher = false;

      let studentEmail: string | null = null;
      let teacherEmail: string | null = null;
      let studentPhone: string | null = null;
      let teacherPhone: string | null = null;

      if (ib.teacher_id) {
        isTeacher = true;
        const teacher = teachersMap.get(ib.teacher_id);
        if (teacher) {
          studentName = teacher.name + ' (Teacher)';
          studentCard = teacher.username;
          studentClass = teacher.assigned_class ? (teacher.assigned_division ? `${teacher.assigned_class}-${teacher.assigned_division}` : teacher.assigned_class) : 'Subject Teacher';
          teacherEmail = teacher.email || null;
          teacherPhone = teacher.phone || null;
        }
      } else if (ib.student_id) {
        const student = studentsMap.get(ib.student_id);
        if (student) {
          studentName = student.name;
          studentCard = student.library_card_no;
          studentClass = student.class ? `${student.class}${student.division ? `-${student.division}` : ''}` : '';
          studentRoll = student.roll_no || '';
          studentEmail = student.email || null;
          studentPhone = student.phone || null;
        }
      }

      const book = booksMap.get(ib.book_id);

      let days_overdue = 1;
      if (ib.due_date) {
        const due = new Date(ib.due_date);
        const now = new Date(today);
        const diffTime = now.getTime() - due.getTime();
        const calcDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (!isNaN(calcDays) && calcDays > 0) {
          days_overdue = calcDays;
        }
      }

      overdueRecords.push({
        id: ib.id,
        book_id: ib.book_id,
        student_id: ib.student_id,
        teacher_id: ib.teacher_id,
        is_teacher: isTeacher,
        student_name: studentName,
        student_card_no: studentCard,
        student_class: studentClass,
        student_roll: studentRoll,
        email: teacherEmail || studentEmail || null,
        student_email: studentEmail,
        teacher_email: teacherEmail,
        student_phone: studentPhone,
        teacher_phone: teacherPhone,
        book_title: book ? book.title : 'Unknown Title',
        book_author: book ? book.author : '',
        book_category: book?.category || 'General',
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        days_overdue,
        fine_amount: 0,
        restriction_status: isTeacher ? 'Staff (No Ban)' : '2-Week Borrowing Ban Pending Return',
        issue_code: ib.issue_code,
      });
    }

    overdueRecords.sort((a, b) => b.days_overdue - a.days_overdue);
    res.json(overdueRecords);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/all-time (Deep All-Time Lifetime Analytics)
reportsRouter.get('/all-time', async (req: Request, res: Response) => {
  try {
    const today = getTodayStr();
    const [allBooks, allStudents, allTeachers, allIssuedBooks] = await Promise.all([
      db.query.books.findMany(),
      db.query.students.findMany(),
      db.query.teachers.findMany(),
      db.query.issued_books.findMany(),
    ]);

    const total_books = allBooks.length;
    const total_copies = allBooks.reduce((acc, b) => acc + (Number(b.total_copies) || 0), 0);
    const available_copies = allBooks.reduce((acc, b) => acc + (Number(b.available_copies) || 0), 0);
    const issued_copies = Math.max(0, total_copies - available_copies);

    const total_students = allStudents.length;
    const total_teachers = allTeachers.length;

    const total_all_time_issues = allIssuedBooks.length;
    const returnedIssues = allIssuedBooks.filter(ib => ib.status === 'returned');
    const total_all_time_returns = returnedIssues.length;
    const return_rate = total_all_time_issues > 0
      ? Math.round((total_all_time_returns / total_all_time_issues) * 100)
      : 100;

    const student_issues_count = allIssuedBooks.filter(ib => !!ib.student_id).length;
    const teacher_issues_count = allIssuedBooks.filter(ib => !!ib.teacher_id).length;

    // Top Borrowed Books
    const bookBorrowCountMap = new Map<number, number>();
    allIssuedBooks.forEach((ib: any) => {
      const bid = Number(ib.book_id);
      bookBorrowCountMap.set(bid, (bookBorrowCountMap.get(bid) || 0) + 1);
    });

    const top_borrowed_books = allBooks
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category || 'General',
        total_copies: b.total_copies,
        available_copies: b.available_copies,
        borrow_count: bookBorrowCountMap.get(Number(b.id)) || 0,
      }))
      .sort((a, b) => b.borrow_count - a.borrow_count)
      .slice(0, 10);

    // Top Student Readers
    const studentBorrowCountMap = new Map<number, number>();
    allIssuedBooks.forEach((ib: any) => {
      if (ib.student_id) {
        const sid = Number(ib.student_id);
        studentBorrowCountMap.set(sid, (studentBorrowCountMap.get(sid) || 0) + 1);
      }
    });

    const top_student_readers = allStudents
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        division: s.division,
        roll_no: s.roll_no,
        library_card_no: s.library_card_no,
        email: s.email,
        borrow_count: studentBorrowCountMap.get(Number(s.id)) || 0,
      }))
      .sort((a, b) => b.borrow_count - a.borrow_count)
      .slice(0, 10);

    // Top Teacher Readers
    const teacherBorrowCountMap = new Map<number, number>();
    allIssuedBooks.forEach((ib: any) => {
      if (ib.teacher_id) {
        const tid = Number(ib.teacher_id);
        teacherBorrowCountMap.set(tid, (teacherBorrowCountMap.get(tid) || 0) + 1);
      }
    });

    const top_teacher_readers = allTeachers
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        assigned_class: t.assigned_class ? (t.assigned_division ? `${t.assigned_class}-${t.assigned_division}` : t.assigned_class) : 'Subject Teacher',
        username: t.username,
        email: t.email,
        borrow_count: teacherBorrowCountMap.get(Number(t.id)) || 0,
      }))
      .sort((a, b) => b.borrow_count - a.borrow_count)
      .slice(0, 10);

    // Class-wise Distribution
    const classCountMap = new Map<string, number>();
    const studentsMap = new Map<number, any>();
    allStudents.forEach((s: any) => studentsMap.set(Number(s.id), s));

    allIssuedBooks.forEach((ib: any) => {
      if (ib.student_id) {
        const student = studentsMap.get(Number(ib.student_id));
        if (student && student.class) {
          const className = `Class ${student.class}`;
          classCountMap.set(className, (classCountMap.get(className) || 0) + 1);
        }
      }
    });

    const class_wise_distribution = Array.from(classCountMap.entries())
      .map(([class_name, count]) => ({ class_name, count }))
      .sort((a, b) => b.count - a.count);

    // Category-wise Distribution
    const booksMap = new Map<number, any>();
    allBooks.forEach((b: any) => booksMap.set(Number(b.id), b));

    const categoryCountMap = new Map<string, number>();
    allIssuedBooks.forEach((ib: any) => {
      const book = booksMap.get(Number(ib.book_id));
      const cat = (book && book.category) ? book.category : 'General / Fiction';
      categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);
    });

    const category_wise_distribution = Array.from(categoryCountMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly Trends (Past months)
    const monthMap = new Map<string, { issues: number; returns: number }>();
    allIssuedBooks.forEach((ib: any) => {
      if (ib.issue_date && typeof ib.issue_date === 'string') {
        const monthKey = ib.issue_date.substring(0, 7); // YYYY-MM
        if (!monthMap.has(monthKey)) monthMap.set(monthKey, { issues: 0, returns: 0 });
        monthMap.get(monthKey)!.issues += 1;
      }
      if (ib.return_date && typeof ib.return_date === 'string') {
        const retMonthKey = ib.return_date.substring(0, 7);
        if (!monthMap.has(retMonthKey)) monthMap.set(retMonthKey, { issues: 0, returns: 0 });
        monthMap.get(retMonthKey)!.returns += 1;
      }
    });

    const monthly_trends = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, issues: data.issues, returns: data.returns }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      total_all_time_issues,
      total_all_time_returns,
      return_rate,
      total_students,
      total_teachers,
      total_books,
      total_copies,
      available_copies,
      issued_copies,
      student_issues_count,
      teacher_issues_count,
      top_borrowed_books,
      top_student_readers,
      top_teacher_readers,
      class_wise_distribution,
      category_wise_distribution,
      monthly_trends,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/history (All-Time Loan Ledger Logs)
reportsRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const today = getTodayStr();
    const [allIssuedBooks, allStudents, allTeachers, allBooks] = await Promise.all([
      db.query.issued_books.findMany({ orderBy: [desc(issued_books.id)] }),
      db.query.students.findMany(),
      db.query.teachers.findMany(),
      db.query.books.findMany(),
    ]);

    const studentsMap = new Map();
    allStudents.forEach(s => studentsMap.set(s.id, s));

    const teachersMap = new Map();
    allTeachers.forEach(t => teachersMap.set(t.id, t));

    const booksMap = new Map();
    allBooks.forEach(b => booksMap.set(b.id, b));

    const historyLogs = allIssuedBooks.map(ib => {
      let borrowerName = 'Unknown';
      let borrowerType: 'student' | 'teacher' = 'student';
      let borrowerInfo = '';
      let email: string | null = null;
      let phone: string | null = null;

      if (ib.teacher_id) {
        borrowerType = 'teacher';
        const teacher = teachersMap.get(ib.teacher_id);
        if (teacher) {
          borrowerName = teacher.name;
          borrowerInfo = `Teacher • ${teacher.assigned_class ? `Class ${teacher.assigned_class}` : 'Staff'}`;
          email = teacher.email || null;
          phone = teacher.phone || null;
        }
      } else if (ib.student_id) {
        borrowerType = 'student';
        const student = studentsMap.get(ib.student_id);
        if (student) {
          borrowerName = student.name;
          borrowerInfo = `Card: ${student.library_card_no} • Class ${student.class}-${student.division} (#${student.roll_no})`;
          email = student.email || null;
          phone = student.phone || null;
        }
      }

      const book = booksMap.get(ib.book_id);
      const isReturned = ib.status === 'returned';
      const isOverdue = !isReturned && ((ib.due_date && ib.due_date < today) || ib.status === 'overdue');
      const status = isReturned ? 'returned' : isOverdue ? 'overdue' : 'issued';

      // calculate duration
      let days_held = 0;
      const issueD = new Date(ib.issue_date);
      const endD = isReturned && ib.return_date ? new Date(ib.return_date) : new Date(today);
      if (!isNaN(issueD.getTime()) && !isNaN(endD.getTime())) {
        days_held = Math.max(0, Math.ceil((endD.getTime() - issueD.getTime()) / (1000 * 60 * 60 * 24)));
      }

      const isLate = isReturned
        ? (Boolean(ib.return_date && ib.due_date && ib.return_date > ib.due_date))
        : isOverdue;

      return {
        id: ib.id,
        borrower_name: borrowerName,
        borrower_type: borrowerType,
        borrower_info: borrowerInfo,
        email,
        phone,
        book_id: ib.book_id,
        book_title: book ? book.title : 'Unknown Title',
        book_author: book ? book.author : '',
        book_category: book?.category || 'General',
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        return_date: ib.return_date,
        status,
        days_held,
        is_late: isLate,
        issue_code: ib.issue_code,
      };
    });

    res.json(historyLogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

