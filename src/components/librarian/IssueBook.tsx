import React, { useState, useEffect } from 'react';
import { BookPlus, Calendar, UserCheck, BookOpen, AlertCircle, CheckCircle, ChevronDown, Search } from 'lucide-react';
import { Student, Book } from '../../types';

interface IssueBookProps {
  preselectedStudent?: Student | null;
  onSuccessToast: (msg: string) => void;
}

export const IssueBook: React.FC<IssueBookProps> = ({ preselectedStudent, onSuccessToast }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [returnDays, setReturnDays] = useState<number>(14);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [isBookOpen, setIsBookOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [resStu, resBks] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/books'),
      ]);
      if (resStu.ok && resBks.ok) {
        const stuData = await resStu.json();
        const bksData = await resBks.json();
        setStudents(stuData);
        setBooks(bksData);

        if (preselectedStudent) {
          setSelectedStudentId(preselectedStudent.id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedStudent]);

  const selectedBook = books.find((b) => b.id.toString() === selectedBookId);
  const selectedStudent = students.find((s) => s.id.toString() === selectedStudentId);

  const handleIssue = async (e: React.FormEvent) => {
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
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to issue book');
      } else {
        onSuccessToast(data.message || `Book issued! Return due on ${data.due_date}`);
        setSelectedBookId('');
        setSelectedStudentId('');
        setStudentSearch('');
        setBookSearch('');
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <BookPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Issue Book Desk</h2>
            <p className="text-xs text-slate-500">
              Assign library books to registered students and set expected return terms
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleIssue} className="space-y-6">
          {/* Student Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Search & Select Student
            </label>
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10" />
                <input
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
                        setStudentSearch(`${s.name} (${s.library_card_no})`);
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
              )}
            </div>
            {selectedStudent && (
              <div className="mt-2 space-y-2">
                <div className="p-2.5 rounded-lg bg-sky-50 border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
                  <span>Selected: <strong className="text-slate-900">{selectedStudent.name}</strong></span>
                  <span className="font-mono text-blue-700 font-semibold">{selectedStudent.library_card_no}</span>
                </div>
                {selectedStudent.is_restricted ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Borrowing Restricted (2-Week Ban Active)
                    </div>
                    <p className="text-[11px] text-rose-700">{selectedStudent.restriction_reason}</p>
                    {selectedStudent.restriction_until && (
                      <p className="text-[11px] font-semibold">Restriction Active Until: {selectedStudent.restriction_until}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Eligible to Borrow Books
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Book Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Search & Select Book
            </label>
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => {
                    setBookSearch(e.target.value);
                    setIsBookOpen(true);
                    setSelectedBookId('');
                  }}
                  onFocus={() => setIsBookOpen(true)}
                  placeholder="Type book title, author, category, or publisher..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              
              {isBookOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div 
                    className="px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic"
                    onClick={() => {
                      setSelectedBookId('');
                      setBookSearch('');
                      setIsBookOpen(false);
                    }}
                  >
                    -- Clear Selection --
                  </div>
                  {books
                    .filter(b => 
                      b.title.toLowerCase().includes(bookSearch.toLowerCase()) || 
                      b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
                      (b.publisher && b.publisher.toLowerCase().includes(bookSearch.toLowerCase())) ||
                      (b.category && b.category.toLowerCase().includes(bookSearch.toLowerCase()))
                    )
                    .map((b) => (
                    <div 
                      key={b.id}
                      onClick={() => {
                        if (b.available_copies < 1) return;
                        setSelectedBookId(b.id.toString());
                        setBookSearch(b.title);
                        setIsBookOpen(false);
                      }}
                      className={`px-3.5 py-2.5 text-xs flex items-center justify-between ${b.available_copies < 1 ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : 'text-slate-800 hover:bg-blue-50 cursor-pointer'}`}
                    >
                      <div>
                        <span className="font-bold text-slate-900">{b.title}</span>
                        <span className="ml-2 text-slate-500 text-[11px]">by {b.author}</span>
                        {b.publisher && (
                          <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {b.publisher}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${b.available_copies > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-600'}`}>
                        {b.available_copies} / {b.total_copies} available
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedBook && (
              <div className="mt-2 p-3 rounded-lg bg-sky-50 border border-blue-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{selectedBook.title}</div>
                  <div className="text-slate-500">Author: {selectedBook.author}</div>
                </div>
                <div>
                  {selectedBook.available_copies > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      {selectedBook.available_copies} Copies Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Return Days Selection */}
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
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    returnDays === days
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-blue-200 text-slate-700 hover:bg-blue-50'
                  }`}
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
          </div>

          <button
            type="submit"
            disabled={loading || (selectedBook && selectedBook.available_copies < 1) || Boolean(selectedStudent && selectedStudent.is_restricted)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookPlus className="w-4 h-4" />
            {loading ? 'Processing Issue...' : 'Confirm Book Issue'}
          </button>
        </form>
      </div>
    </div>
  );
};
