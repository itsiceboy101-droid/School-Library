const fs = require('fs');
let code = fs.readFileSync('src/routes/issues.ts', 'utf8');

// Replace imports to include teachers
code = code.replace(
  "import { books, issued_books, students } from '../db/schema';",
  "import { books, issued_books, students, teachers } from '../db/schema';"
);

const oldPost = `issuesRouter.post('/', async (req: Request, res: Response) => {
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
        error: \`Issue Blocked: \${student.name} is under a 2-week borrowing ban! (\${restriction.reason})\`,
        restriction,
      });
    }

    const book = await db.query.books.findFirst({ where: eq(books.id, bId) });
    if (!book) return res.status(400).json({ error: 'Selected book does not exist' });

    if (book.available_copies < 1) {
      return res.status(400).json({ error: \`No available copies for "\${book.title}"\` });
    }

    const existing = await db.query.issued_books.findFirst({
      where: and(
        eq(issued_books.student_id, sId),
        eq(issued_books.book_id, bId),
        ne(issued_books.status, 'returned')
      )
    });

    if (existing) {
      return res.status(400).json({ error: \`Student already has "\${book.title}" currently issued\` });
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
      message: \`Book "\${book.title}" issued successfully to \${student.name}\`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});`;

const newPost = `issuesRouter.post('/', async (req: Request, res: Response) => {
  const { student_id, teacher_id, book_id, return_days } = req.body;
  if ((!student_id && !teacher_id) || !book_id) {
    return res.status(400).json({ error: 'Borrower (Student or Teacher) and book are required' });
  }
  const bId = parseInt(book_id, 10);
  const days = parseInt(return_days || '14', 10);
  const isTeacher = !!teacher_id;
  const borrowerId = parseInt(isTeacher ? teacher_id : student_id, 10);

  try {
    let borrowerName = '';
    
    if (isTeacher) {
      const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, borrowerId) });
      if (!teacher) return res.status(400).json({ error: 'Selected teacher does not exist' });
      borrowerName = teacher.name;
    } else {
      const student = await db.query.students.findFirst({ where: eq(students.id, borrowerId) });
      if (!student) return res.status(400).json({ error: 'Selected student does not exist' });
      borrowerName = student.name;

      const restriction = await getStudentRestrictionStatus(borrowerId);
      if (restriction.isRestricted) {
        return res.status(400).json({
          error: \`Issue Blocked: \${borrowerName} is under a 2-week borrowing ban! (\${restriction.reason})\`,
          restriction,
        });
      }
    }

    const book = await db.query.books.findFirst({ where: eq(books.id, bId) });
    if (!book) return res.status(400).json({ error: 'Selected book does not exist' });

    if (book.available_copies < 1) {
      return res.status(400).json({ error: \`No available copies for "\${book.title}"\` });
    }

    const existing = await db.query.issued_books.findFirst({
      where: and(
        isTeacher ? eq(issued_books.teacher_id, borrowerId) : eq(issued_books.student_id, borrowerId),
        eq(issued_books.book_id, bId),
        ne(issued_books.status, 'returned')
      )
    });

    if (existing) {
      return res.status(400).json({ error: \`\${isTeacher ? 'Teacher' : 'Student'} already has "\${book.title}" currently issued\` });
    }

    const issueDate = getTodayStr();
    const dueDate = getTodayStr(days);

    const newIssue = await db.transaction(async (tx) => {
        const insertRes = await tx.insert(issued_books).values({
            book_id: bId,
            student_id: isTeacher ? null : borrowerId,
            teacher_id: isTeacher ? borrowerId : null,
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
      student_name: borrowerName,
      message: \`Book "\${book.title}" issued successfully to \${borrowerName}\`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});`;

code = code.replace(oldPost, newPost);


// Update GET route
const getReplace = `      const student = await db.query.students.findFirst({ where: eq(students.id, ib.student_id) });
      const book = await db.query.books.findFirst({ where: eq(books.id, ib.book_id) });
      
      const isOverdue = ib.due_date < today;`;

const newGetReplace = `      let studentName = "Unknown";
      let studentCard = "";
      let studentClass = "";
      let studentDiv = "";
      let studentRoll = "";
      
      if (ib.teacher_id) {
        const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, ib.teacher_id) });
        if (teacher) {
            studentName = teacher.name + " (Teacher)";
            studentCard = teacher.username;
            studentClass = teacher.assigned_class ? \`Class \${teacher.assigned_class}\` : "Staff";
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
      
      const isOverdue = ib.due_date < today;`;

code = code.replace(getReplace, newGetReplace);

const pushReplace = `      result.push({
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
      });`;

const newPushReplace = `      result.push({
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
      });`;

code = code.replace(pushReplace, newPushReplace);

// Update return logic (/:issueId)
const returnReplace = `      const student = await db.query.students.findFirst({ where: eq(students.id, record.student_id) });
      const book = await db.query.books.findFirst({ where: eq(books.id, record.book_id) });
      
      const isLate = today > record.due_date;
      let banUntilDate: string | null = null;
      if (isLate) {`;

const newReturnReplace = `      let borrowerName = "Unknown";
      let isTeacher = !!record.teacher_id;
      if (isTeacher) {
        const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, record.teacher_id!) });
        if (teacher) borrowerName = teacher.name;
      } else {
        const student = await db.query.students.findFirst({ where: eq(students.id, record.student_id!) });
        if (student) borrowerName = student.name;
      }

      const book = await db.query.books.findFirst({ where: eq(books.id, record.book_id) });
      
      const isLate = today > record.due_date;
      let banUntilDate: string | null = null;
      if (isLate && !isTeacher) {`;

code = code.replace(returnReplace, newReturnReplace);

const returnMessagesReplace = `      if (isLate) {
        res.json({
          message: \`Book "\${book ? book.title : ''}" returned late. \${student ? student.name : 'Student'} is now under a 2-week borrowing ban until \${banUntilDate}.\`,
          is_late: true,
          ban_until: banUntilDate,
          book_title: book ? book.title : "",
        });
      } else {
        res.json({
          message: \`Book "\${book ? book.title : ''}" returned on time successfully! \${student ? student.name : 'Student'} remains eligible to borrow.\`,
          is_late: false,
          ban_until: null,
          book_title: book ? book.title : "",
        });
      }`;

const newReturnMessagesReplace = `      if (isLate) {
        res.json({
          message: isTeacher ? 
            \`Book "\${book?.title}" returned late by Teacher \${borrowerName}. (No ban applied to teachers).\` :
            \`Book "\${book?.title}" returned late. \${borrowerName} is now under a 2-week borrowing ban until \${banUntilDate}.\`,
          is_late: true,
          ban_until: banUntilDate,
          book_title: book ? book.title : "",
        });
      } else {
        res.json({
          message: \`Book "\${book?.title}" returned successfully by \${borrowerName}!\`,
          is_late: false,
          ban_until: null,
          book_title: book ? book.title : "",
        });
      }`;
code = code.replace(returnMessagesReplace, newReturnMessagesReplace);


fs.writeFileSync('src/routes/issues.ts', code);
console.log('Fixed issue.ts');
