const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');
code = code.replace(
  "        body: JSON.stringify({\n          student_id: selectedStudentId,\n          book_id: selectedBookId,\n          return_days: returnDays,\n        }),",
  "        body: JSON.stringify({\n          student_id: selectedStudentId || undefined,\n          teacher_id: selectedTeacherId || undefined,\n          book_id: selectedBookId,\n          return_days: returnDays,\n        }),"
);
fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
