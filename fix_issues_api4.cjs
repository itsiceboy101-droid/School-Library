const fs = require('fs');
let code = fs.readFileSync('src/routes/issues.ts', 'utf8');

const regex = /const student = await db\.query\.students\.findFirst\(\{ where: eq\(students\.id, record\.student_id\) \}\);\s*const book = await db\.query\.books\.findFirst\(\{ where: eq\(books\.id, record\.book_id\) \}\);\s*const isLate = today > record\.due_date;\s*let banUntilDate: string \| null = null;\s*if \(isLate\) \{/;

const newStr = `let borrowerName = "Unknown";
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
      if (isLate && !isTeacher) {`;

code = code.replace(regex, newStr);
fs.writeFileSync('src/routes/issues.ts', code);
console.log("Fixed with regex!");
