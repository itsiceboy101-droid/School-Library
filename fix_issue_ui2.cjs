const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

// 1. replace variables definition
const varsOld = `  const selectedBook = books.find((b) => b.id.toString() === selectedBookId);
  const selectedStudent = students.find((s) => s.id.toString() === selectedStudentId);`;

const varsNew = `  const selectedBook = books.find((b) => b.id.toString() === selectedBookId);
  const selectedStudent = students.find((s) => s.id.toString() === selectedStudentId);
  const selectedTeacher = teachers.find((t) => t.id.toString() === selectedTeacherId);
  
  const allBorrowers = [
    ...students.map(s => ({ ...s, type: 'student' as const })),
    ...teachers.map(t => ({ ...t, type: 'teacher' as const }))
  ];`;
code = code.replace(varsOld, varsNew);

// 2. replace handleIssue
const handleIssueOld = `  const handleIssue = async (e: React.FormEvent) => {
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

const handleIssueNew = `  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStudentId && !selectedTeacherId) {
      setError('Please select a borrower');
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
code = code.replace(handleIssueOld, handleIssueNew);

// 3. replace "Search & Select Student" text
code = code.replace(
  `<h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Search & Select Student
            </h3>`,
  `<h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Search & Select Borrower (Student / Teacher)
            </h3>`
);

// 4. replace the dropdown input and list
const dropdownOld = `                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentOpen(true);
                    setSelectedStudentId('');
                  }}
                  onFocus={() => setIsStudentOpen(true)}
                  placeholder="Type student name, username, or class..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              
              {isStudentOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div 
                    className="px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic"
                    onClick={() => {
                      setSelectedStudentId('');
                      setStudentSearch('');
                      setIsStudentOpen(false);
                    }}
                  >
                    -- Clear Selection --
                  </div>
                  {students
                    .filter(s => 
                      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                      s.library_card_no.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.class.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id.toString());
                        setStudentSearch(\`\${s.name} (\${s.library_card_no})\`);
                        setIsStudentOpen(false);
                      }}
                      className="px-3.5 py-2.5 text-xs text-slate-800 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{s.name}</span>
                        <span className="ml-2 font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                          {s.library_card_no}
                        </span>
                        <span className="ml-2 text-slate-500 text-[11px]">
                          Class {s.class}-{s.division} (Roll #{s.roll_no})
                        </span>
                      </div>
                      {s.is_restricted && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                          RESTRICTED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}`;

const dropdownNew = `                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentOpen(true);
                    setSelectedStudentId('');
                    setSelectedTeacherId('');
                  }}
                  onFocus={() => setIsStudentOpen(true)}
                  placeholder="Type borrower name, username, or class..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              
              {isStudentOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div 
                    className="px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic"
                    onClick={() => {
                      setSelectedStudentId('');
                      setSelectedTeacherId('');
                      setStudentSearch('');
                      setIsStudentOpen(false);
                    }}
                  >
                    -- Clear Selection --
                  </div>
                  {allBorrowers
                    .filter(b => 
                      b.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                      (b.type === 'student' ? b.library_card_no.toLowerCase().includes(studentSearch.toLowerCase()) : b.username.toLowerCase().includes(studentSearch.toLowerCase())) ||
                      (b.type === 'student' ? b.class.toLowerCase().includes(studentSearch.toLowerCase()) : 'teacher'.includes(studentSearch.toLowerCase()))
                    )
                    .map((b) => (
                    <div 
                      key={\`\${b.type}-\${b.id}\`}
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
                      className="px-3.5 py-2.5 text-xs text-slate-800 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{b.name}</span>
                        <span className={\`ml-2 font-mono px-1.5 py-0.5 rounded text-[10px] font-bold \${b.type === 'teacher' ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'}\`}>
                          {b.type === 'teacher' ? b.username : b.library_card_no}
                        </span>
                        <span className="ml-2 text-slate-500 text-[11px]">
                          {b.type === 'student' ? \`Class \${b.class}-\${b.division} (Roll #\${b.roll_no})\` : (b.assigned_class ? \`Class \${b.assigned_class}\` : 'Staff')}
                        </span>
                        <span className={\`ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider \${b.type === 'teacher' ? 'text-amber-600 bg-amber-100 border border-amber-200' : 'hidden'}\`}>
                          Teacher
                        </span>
                      </div>
                      {b.type === 'student' && b.is_restricted && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                          RESTRICTED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}`;
code = code.replace(dropdownOld, dropdownNew);

// 5. replace selected display block
const selectedOld = `            {selectedStudent && (
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

const selectedNew = `            {selectedStudent && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-sm transition-all duration-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Selected Student: <strong className="text-slate-900">{selectedStudent.name}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-blue-700 font-semibold">{selectedStudent.library_card_no}</span>
                  <span className="text-slate-500 font-semibold">Class {selectedStudent.class}-{selectedStudent.division}</span>
                </div>
              </div>
            )}

            {selectedTeacher && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-sm transition-all duration-200">
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
code = code.replace(selectedOld, selectedNew);

fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
console.log("Success UI fix");
