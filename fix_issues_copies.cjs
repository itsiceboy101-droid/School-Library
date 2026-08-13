const fs = require('fs');
let code = fs.readFileSync('src/routes/issues.ts', 'utf8');

const oldPostStr = `  const { student_id, teacher_id, book_id, return_days } = req.body;
  if ((!student_id && !teacher_id) || !book_id) {
    return res.status(400).json({ error: 'Borrower and book are required' });
  }

  const sId = student_id ? parseInt(student_id, 10) : undefined;
  const tId = teacher_id ? parseInt(teacher_id, 10) : undefined;
  const bId = parseInt(book_id, 10);
  const days = parseInt(return_days || '14', 10);

  try {
    let borrowerName = "";

    if (sId) {
      const student = await db.query.students.findFirst({ where: eq(students.id, sId) });
      if (!student) return res.status(400).json({ error: 'Selected student does not exist' });
      borrowerName = student.name;

      const restriction = await getStudentRestrictionStatus(sId);
      if (restriction.isRestricted) {
        return res.status(400).json({
          error: \`Issue Blocked: \${student.name} is under a 2-week borrowing ban! (\${restriction.reason})\`,
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
    if (book.available_copies < 1) {
      return res.status(400).json({ error: \`No available copies for "\${book.title}"\` });
    }

    const existingWhereArgs = [
      eq(issued_books.book_id, bId),
      ne(issued_books.status, 'returned')
    ];
    if (sId) {
      existingWhereArgs.push(eq(issued_books.student_id, sId));
    } else if (tId) {
      existingWhereArgs.push(eq(issued_books.teacher_id, tId));
    }

    const existing = await db.query.issued_books.findFirst({
      where: and(...existingWhereArgs)
    });

    if (existing) {
      return res.status(400).json({ error: \`Borrower already has "\${book.title}" currently issued\` });
    }

    const issueDate = getTodayStr();
    const dueDate = getTodayStr(days);

    const newIssue = await db.transaction(async (tx) => {
        const insertRes = await tx.insert(issued_books).values({
            book_id: bId,
            student_id: sId || null,
            teacher_id: tId || null,
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
    });`;

const newPostStr = `  const { student_id, teacher_id, book_id, return_days, copies } = req.body;
  if ((!student_id && !teacher_id) || !book_id) {
    return res.status(400).json({ error: 'Borrower and book are required' });
  }

  const sId = student_id ? parseInt(student_id, 10) : undefined;
  const tId = teacher_id ? parseInt(teacher_id, 10) : undefined;
  const bId = parseInt(book_id, 10);
  const days = parseInt(return_days || '14', 10);
  const numCopies = (tId && copies) ? parseInt(copies, 10) : 1;

  try {
    let borrowerName = "";

    if (sId) {
      const student = await db.query.students.findFirst({ where: eq(students.id, sId) });
      if (!student) return res.status(400).json({ error: 'Selected student does not exist' });
      borrowerName = student.name;

      const restriction = await getStudentRestrictionStatus(sId);
      if (restriction.isRestricted) {
        return res.status(400).json({
          error: \`Issue Blocked: \${student.name} is under a 2-week borrowing ban! (\${restriction.reason})\`,
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
      return res.status(400).json({ error: \`Not enough available copies for "\${book.title}" (requested \${numCopies}, available \${book.available_copies})\` });
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
        return res.status(400).json({ error: \`Student already has "\${book.title}" currently issued\` });
      }
    }

    const issueDate = getTodayStr();
    const dueDate = getTodayStr(days);

    const newIssues = await db.transaction(async (tx) => {
        const insertions = [];
        for (let i = 0; i < numCopies; i++) {
          insertions.push({
            book_id: bId,
            student_id: sId || null,
            teacher_id: tId || null,
            issue_date: issueDate,
            due_date: dueDate,
            status: 'issued',
            fine_amount: 0
          });
        }
        
        const insertRes = await tx.insert(issued_books).values(insertions).returning();

        await tx.update(books)
            .set({ available_copies: book.available_copies - numCopies })
            .where(eq(books.id, bId));
        
        return insertRes;
    });

    res.status(201).json({
      id: newIssues[0].id,
      due_date: dueDate,
      book_title: book.title,
      student_name: borrowerName,
      message: numCopies > 1 
        ? \`\${numCopies} copies of "\${book.title}" issued successfully to \${borrowerName}\`
        : \`Book "\${book.title}" issued successfully to \${borrowerName}\`,
    });`;

code = code.replace(oldPostStr, newPostStr);
fs.writeFileSync('src/routes/issues.ts', code);
