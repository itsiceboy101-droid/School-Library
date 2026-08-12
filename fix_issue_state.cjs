const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

const stateStr = `  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');`;

const newStateStr = `  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');`;

code = code.replace(stateStr, newStateStr);
fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
