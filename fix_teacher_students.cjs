const fs = require('fs');
let code = fs.readFileSync('src/routes/teachers.ts', 'utf8');

const target = `    const classStudents = await db.query.students.findMany({
      where: (students, { and, eq }) => and(
        eq(students.class, teacher.assigned_class!),
        eq(students.division, teacher.assigned_division!)
      )
    });

    res.json({
      isClassTeacher: true,
      assigned_class: teacher.assigned_class,
      assigned_division: teacher.assigned_division,
      students: classStudents.map(s => ({
        ...s,
        password: s.password_hash
      }))
    });`;

const replacement = `    const classStudents = await db.query.students.findMany({
      where: (students, { and, eq }) => and(
        eq(students.class, teacher.assigned_class!),
        eq(students.division, teacher.assigned_division!)
      )
    });

    const studentsWithCounts = [];
    for (const s of classStudents) {
        const activeIssues = await db.query.issued_books.findMany({
            where: (issued_books, { and, eq, ne }) => and(
                eq(issued_books.student_id, Number(s.id)),
                ne(issued_books.status, 'returned')
            )
        });
        studentsWithCounts.push({
            ...s,
            password: s.password_hash,
            active_issues_count: activeIssues.length
        });
    }

    res.json({
      isClassTeacher: true,
      assigned_class: teacher.assigned_class,
      assigned_division: teacher.assigned_division,
      students: studentsWithCounts
    });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/routes/teachers.ts', code);
