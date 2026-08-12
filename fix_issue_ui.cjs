const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

const importReplace = `import { Student, Book } from '../../types';`;
const newImportReplace = `import { Student, Book, Teacher } from '../../types';`;
code = code.replace(importReplace, newImportReplace);


const stateReplace = `  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');`;

const newStateReplace = `  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');`;
code = code.replace(stateReplace, newStateReplace);

const fetchDataReplace = `    try {
      const [resStu, resBks] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/books'),
      ]);
      if (resStu.ok && resBks.ok) {
        const stuData = await resStu.json();
        const bksData = await resBks.json();
        setStudents(stuData);
        setBooks(bksData);`;

const newFetchDataReplace = `    try {
      const [resStu, resTea, resBks] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/teachers'),
        fetch('/api/books'),
      ]);
      if (resStu.ok && resTea.ok && resBks.ok) {
        const stuData = await resStu.json();
        const teaData = await resTea.json();
        const bksData = await resBks.json();
        setStudents(stuData);
        setTeachers(teaData);
        setBooks(bksData);`;
code = code.replace(fetchDataReplace, newFetchDataReplace);

const handleIssueReplace = `  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    if (!selectedBookId) {
      setError('Please select a book');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          book_id: selectedBookId,
          return_days: returnDays,
        }),
      });`;

const newHandleIssueReplace = `  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStudentId && !selectedTeacherId) {
      setError('Please select a borrower (student or teacher)');
      return;
    }

    if (!selectedBookId) {
      setError('Please select a book');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId || undefined,
          teacher_id: selectedTeacherId || undefined,
          book_id: selectedBookId,
          return_days: returnDays,
        }),
      });`;
code = code.replace(handleIssueReplace, newHandleIssueReplace);

const setStudentSelectedReplace = `        setSelectedBookId('');
        setSelectedStudentId('');
        setStudentSearch('');`;
const newSetStudentSelectedReplace = `        setSelectedBookId('');
        setSelectedStudentId('');
        setSelectedTeacherId('');
        setStudentSearch('');`;
code = code.replace(setStudentSelectedReplace, newSetStudentSelectedReplace);

const selectedVarsReplace = `  const selectedStudent = students.find((s) => s.id.toString() === selectedStudentId);
  const selectedBook = books.find((b) => b.id.toString() === selectedBookId);`;

const newSelectedVarsReplace = `  const selectedStudent = students.find((s) => s.id.toString() === selectedStudentId);
  const selectedTeacher = teachers.find((t) => t.id.toString() === selectedTeacherId);
  const selectedBook = books.find((b) => b.id.toString() === selectedBookId);
  
  const allBorrowers = [
    ...students.map(s => ({ ...s, type: 'student' })),
    ...teachers.map(t => ({ ...t, type: 'teacher' }))
  ];
  `;
code = code.replace(selectedVarsReplace, newSelectedVarsReplace);

const studentInputReplace = `                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentOpen(true);
                    setSelectedStudentId('');
                  }}
                  onFocus={() => setIsStudentOpen(true)}
                  placeholder="Type student name, username, or class..."
                />
              </div>

              {isStudentOpen && (
                <div className="absolute w-full mt-2 bg-white border border-blue-200 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto overflow-x-hidden">
                  <div 
                    className="p-3 text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-blue-100 flex items-center justify-between"
                    onClick={() => {
                      setSelectedStudentId('');
                      setStudentSearch('');
                      setIsStudentOpen(false);
                    }}
                  >
                    <span>Clear selection</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">Reset</span>
                  </div>
                  {students
                    .filter((s) => 
                      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                      s.library_card_no.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.class.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-0"
                        onClick={() => {
                          setSelectedStudentId(s.id.toString());
                          setStudentSearch(\`\${s.name} (\${s.library_card_no})\`);
                          setIsStudentOpen(false);
                        }}
                      >
                        <div className="font-semibold text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {s.library_card_no} | Class {s.class}-{s.division}
                        </div>
                      </div>
                    ))}`;
                    
const newStudentInputReplace = `                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentOpen(true);
                    setSelectedStudentId('');
                    setSelectedTeacherId('');
                  }}
                  onFocus={() => setIsStudentOpen(true)}
                  placeholder="Type borrower name, username, or class..."
                />
              </div>

              {isStudentOpen && (
                <div className="absolute w-full mt-2 bg-white border border-blue-200 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto overflow-x-hidden">
                  <div 
                    className="p-3 text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-blue-100 flex items-center justify-between"
                    onClick={() => {
                      setSelectedStudentId('');
                      setSelectedTeacherId('');
                      setStudentSearch('');
                      setIsStudentOpen(false);
                    }}
                  >
                    <span>Clear selection</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">Reset</span>
                  </div>
                  {allBorrowers
                    .filter((b) => 
                      b.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                      (b.type === 'student' ? b.library_card_no.toLowerCase().includes(studentSearch.toLowerCase()) : b.username.toLowerCase().includes(studentSearch.toLowerCase())) ||
                      (b.type === 'student' ? b.class.toLowerCase().includes(studentSearch.toLowerCase()) : 'teacher'.includes(studentSearch.toLowerCase()))
                    )
                    .map((b) => (
                      <div
                        key={\`\${b.type}-\${b.id}\`}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-0"
                        onClick={() => {
                          if (b.type === 'student') {
                            setSelectedStudentId(b.id.toString());
                            setSelectedTeacherId('');
                            setStudentSearch(\`\${b.name} (\${b.library_card_no})\`);
                          } else {
                            setSelectedTeacherId(b.id.toString());
                            setSelectedStudentId('');
                            setStudentSearch(\`\${b.name} (\${b.username})\`);
                          }
                          setIsStudentOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-slate-800">{b.name}</div>
                          <span className={\`text-[10px] px-2 py-0.5 rounded-full font-bold \${b.type === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}\`}>
                            {b.type === 'teacher' ? 'Teacher' : 'Student'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {b.type === 'student' ? \`\${b.library_card_no} | Class \${b.class}-\${b.division}\` : \`\${b.username} | \${b.assigned_class ? \`Class \${b.assigned_class}\` : 'Staff'}\`}
                        </div>
                      </div>
                    ))}`;
code = code.replace(studentInputReplace, newStudentInputReplace);

const selectionTextReplace = `            {selectedStudent && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Selected: <strong className="text-slate-900">{selectedStudent.name}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-blue-700 font-semibold">{selectedStudent.library_card_no}</span>
                  <span className="text-slate-500 font-semibold">Class {selectedStudent.class}-{selectedStudent.division}</span>
                </div>
              </div>
            )}
            
            {selectedStudent && selectedStudent.is_restricted && (
              <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">Student is currently restricted from borrowing</h4>
                  <div className="mt-1 space-y-1">
                    <p className="text-[11px] text-rose-700">{selectedStudent.restriction_reason}</p>
                    {selectedStudent.restriction_until && (
                      <p className="text-[11px] font-semibold">Restriction Active Until: {selectedStudent.restriction_until}</p>
                    )}
                  </div>
                </div>
              </div>
            )}`;

const newSelectionTextReplace = `            {selectedStudent && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Selected: <strong className="text-slate-900">{selectedStudent.name}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-blue-700 font-semibold">{selectedStudent.library_card_no}</span>
                  <span className="text-slate-500 font-semibold">Class {selectedStudent.class}-{selectedStudent.division}</span>
                </div>
              </div>
            )}

            {selectedTeacher && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Selected Teacher: <strong className="text-slate-900">{selectedTeacher.name}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-amber-700 font-semibold">{selectedTeacher.username}</span>
                  <span className="text-slate-500 font-semibold">{selectedTeacher.assigned_class ? \`Class \${selectedTeacher.assigned_class}\` : 'Staff'}</span>
                </div>
              </div>
            )}
            
            {selectedStudent && selectedStudent.is_restricted && (
              <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">Student is currently restricted from borrowing</h4>
                  <div className="mt-1 space-y-1">
                    <p className="text-[11px] text-rose-700">{selectedStudent.restriction_reason}</p>
                    {selectedStudent.restriction_until && (
                      <p className="text-[11px] font-semibold">Restriction Active Until: {selectedStudent.restriction_until}</p>
                    )}
                  </div>
                </div>
              </div>
            )}`;
code = code.replace(selectionTextReplace, newSelectionTextReplace);


fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
console.log('Fixed issue UI');
