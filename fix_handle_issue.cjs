const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');
code = code.replace(
  "    if (!selectedStudentId) {\n      setError('Please select a student');\n      return;\n    }",
  "    if (!selectedStudentId && !selectedTeacherId) {\n      setError('Please select a borrower');\n      return;\n    }"
);
fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
