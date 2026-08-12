const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

code = code.replace(
  "  const [students, setStudents] = useState<Student[]>([]);",
  "  const [students, setStudents] = useState<Student[]>([]);\n  const [teachers, setTeachers] = useState<Teacher[]>([]);"
);

code = code.replace(
  "  const [selectedStudentId, setSelectedStudentId] = useState<string>('');",
  "  const [selectedStudentId, setSelectedStudentId] = useState<string>('');\n  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');"
);

fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
console.log("Fixed IssueBook state");
