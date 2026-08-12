const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// add state for borrowed books
const stateStr = `  const [students, setStudents] = useState<Student[]>([]);`;
const newStateStr = `  const [students, setStudents] = useState<Student[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);`;
code = code.replace(stateStr, newStateStr);

// add fetch function inside the component, near fetchClassStudents
const fetchStudentsStr = `  const fetchClassStudents = async () => {`;
const newFetchCode = `  const fetchBorrowedBooks = async () => {
    try {
      const res = await fetch(\`/api/teachers/\${teacher.id}/books\`);
      if (res.ok) {
        const data = await res.json();
        setBorrowedBooks(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassStudents = async () => {`;
code = code.replace(fetchStudentsStr, newFetchCode);

// Add fetchBorrowedBooks to useEffect
const effectStr = `  useEffect(() => {
    fetchClassStudents();
  }, [teacher.id, isClassTeacher]);`;
const newEffectStr = `  useEffect(() => {
    fetchClassStudents();
    fetchBorrowedBooks();
  }, [teacher.id, isClassTeacher]);`;
code = code.replace(effectStr, newEffectStr);

// render active and past books
const activeBooksStr = `      {activeTab === 'myBooks' && (
        <div className="bg-white rounded-2xl p-8 border border-blue-200 text-center text-slate-500 shadow-sm">
          <BookMarked className="w-12 h-12 mx-auto text-blue-200 mb-4" />
          <p className="font-semibold">No books borrowed yet.</p>
        </div>
      )}`;

const newActiveBooksStr = `      {activeTab === 'myBooks' && (
        <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
          {borrowedBooks.filter(b => b.status !== 'returned').length === 0 ? (
            <div className="p-12 text-center text-slate-500 shadow-sm">
              <BookMarked className="w-12 h-12 mx-auto text-blue-200 mb-4" />
              <p className="font-semibold">No books currently borrowed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                  <tr>
                    <th className="px-6 py-3.5">Book Title</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 text-xs">
                  {borrowedBooks.filter(b => b.status !== 'returned').map((b) => (
                    <tr key={b.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {b.book_title}
                        <div className="text-[11px] text-slate-500 font-normal">{b.book_author}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{b.issue_date}</td>
                      <td className="px-6 py-4 font-mono text-slate-700 font-semibold">{b.due_date}</td>
                      <td className="px-6 py-4">
                        <span className={\`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \${
                          b.status === 'overdue' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }\`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}`;
code = code.replace(activeBooksStr, newActiveBooksStr);

const historyBooksStr = `      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-8 border border-blue-200 text-center text-slate-500 shadow-sm">
          <History className="w-12 h-12 mx-auto text-blue-200 mb-4" />
          <p className="font-semibold">No borrowing history available.</p>
        </div>
      )}`;

const newHistoryBooksStr = `      {activeTab === 'history' && (
        <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
          {borrowedBooks.filter(b => b.status === 'returned').length === 0 ? (
            <div className="p-12 text-center text-slate-500 shadow-sm">
              <History className="w-12 h-12 mx-auto text-blue-200 mb-4" />
              <p className="font-semibold">No borrowing history available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Book Title</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Return Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {borrowedBooks.filter(b => b.status === 'returned').map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {b.book_title}
                        <div className="text-[11px] text-slate-500 font-normal">{b.book_author}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{b.issue_date}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{b.return_date || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Returned
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}`;
code = code.replace(historyBooksStr, newHistoryBooksStr);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
console.log("Updated TeacherDashboard");
