const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

const oldFetch = `        body: JSON.stringify({
          student_id: selectedStudentId || undefined,
          teacher_id: selectedTeacherId || undefined,
          book_id: selectedBookId,
          return_days: returnDays,
          copies: selectedTeacherId ? copies : 1,
        }),`;

const newFetch = `        body: JSON.stringify({
          student_id: selectedStudentId || undefined,
          teacher_id: selectedTeacherId || undefined,
          book_id: selectedBookId,
          return_days: (selectedTeacherId && !teacherLimitEnabled) ? 99999 : returnDays,
          copies: selectedTeacherId ? copies : 1,
        }),`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
