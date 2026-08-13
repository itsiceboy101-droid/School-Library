const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

code = code.replace(
  '  const [returnDays, setReturnDays] = useState<number>(14);',
  '  const [returnDays, setReturnDays] = useState<number | \'\'> (14);\n  const [teacherLimitEnabled, setTeacherLimitEnabled] = useState(false);'
);

const oldHandleIssueStr = `  const handleIssue = async (e: React.FormEvent) => {
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

const newHandleIssueStr = `  const handleIssue = async (e: React.FormEvent) => {
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

    let finalDays = Number(returnDays);
    if (selectedTeacherId && !teacherLimitEnabled) {
       finalDays = 3650; // 10 years unlimited
    } else if (!finalDays || finalDays < 1) {
       setError('Please enter a valid return period (days).');
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
          return_days: finalDays,
        }),
      });`;

code = code.replace(oldHandleIssueStr, newHandleIssueStr);

const oldUIStr = `          {/* Return Days Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Return Period (Days)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[7, 14, 21, 30].map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setReturnDays(days)}
                  className={\`py-2 px-3 text-xs font-bold rounded-xl border transition \${
                    returnDays === days
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-blue-200 text-slate-700 hover:bg-blue-50'
                  }\`}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Calculated Due Date:{' '}
              <span className="text-blue-700 font-semibold">
                {new Date(Date.now() + returnDays * 86400000).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>`;

const newUIStr = `          {/* Return Days Selection */}
          <div className="space-y-4">
            {selectedTeacherId && (
              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
                <input 
                  type="checkbox" 
                  checked={teacherLimitEnabled} 
                  onChange={(e) => setTeacherLimitEnabled(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700">Enforce Return Limit for Teacher</span>
              </label>
            )}

            {(!selectedTeacherId || teacherLimitEnabled) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Return Period (Days)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    min="1"
                    value={returnDays}
                    onChange={(e) => setReturnDays(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-32 px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="Days"
                  />
                  <div className="flex-1 flex gap-2">
                    {[7, 14, 21, 30].map((days) => (
                      <button
                        type="button"
                        key={days}
                        onClick={() => setReturnDays(days)}
                        className={\`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg border transition \${
                          returnDays === days
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-blue-200 text-slate-700 hover:bg-blue-50'
                        }\`}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                </div>
                {returnDays !== '' && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Calculated Due Date:{' '}
                    <span className="text-blue-700 font-semibold">
                      {new Date(Date.now() + Number(returnDays) * 86400000).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                )}
              </div>
            )}

            {selectedTeacherId && !teacherLimitEnabled && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                No return limit will be enforced for this teacher.
              </p>
            )}
          </div>`;

code = code.replace(oldUIStr, newUIStr);
fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
