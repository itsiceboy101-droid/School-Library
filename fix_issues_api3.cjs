const fs = require('fs');
let code = fs.readFileSync('src/routes/issues.ts', 'utf8');

const targetStr = `      const student = await db.query.students.findFirst({ where: eq(students.id, record.student_id) });
      const book = await db.query.books.findFirst({ where: eq(books.id, record.book_id) });
      const isLate = today > record.due_date;
      let banUntilDate: string | null = null;
      if (isLate) {`;
      
const idx = code.indexOf(targetStr);
if (idx !== -1) {
  const newStr = `      let borrowerName = "Unknown";
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
  code = code.substring(0, idx) + newStr + code.substring(idx + targetStr.length);
  fs.writeFileSync('src/routes/issues.ts', code);
  console.log("Fixed return block via exact match!");
} else {
  console.log("Could not find the block");
}
