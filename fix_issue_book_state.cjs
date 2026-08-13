const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

code = code.replace(
  "  const [teacherLimitEnabled, setTeacherLimitEnabled] = useState(false);",
  "  const [teacherLimitEnabled, setTeacherLimitEnabled] = useState(false);\n  const [copies, setCopies] = useState<number>(1);"
);

// Add copies to the fetch call
const oldFetch = `        body: JSON.stringify({
          student_id: selectedStudentId || undefined,
          teacher_id: selectedTeacherId || undefined,
          book_id: selectedBookId,
          return_days: finalDays,
        }),`;
const newFetch = `        body: JSON.stringify({
          student_id: selectedStudentId || undefined,
          teacher_id: selectedTeacherId || undefined,
          book_id: selectedBookId,
          return_days: finalDays,
          copies: selectedTeacherId ? copies : 1,
        }),`;
code = code.replace(oldFetch, newFetch);

// Reset copies on success
code = code.replace(
  "setSelectedBookId('');",
  "setSelectedBookId('');\n        setCopies(1);"
);

fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
