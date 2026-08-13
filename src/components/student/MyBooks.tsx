import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, AlertTriangle, CheckCircle2, Bookmark } from 'lucide-react';
import { IssuedBook, Student } from '../../types';

interface MyBooksProps {
  student: Student;
}

export const MyBooks: React.FC<MyBooksProps> = ({ student }) => {
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${student.id}/issued`);
      if (res.ok) {
        const data = await res.json();
        setIssuedBooks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, [student.id]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Currently Borrowed Books ({issuedBooks.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active library items currently issued under card <span className="font-mono text-blue-700 font-semibold">{student.library_card_no}</span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {issuedBooks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Bookmark className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            You currently have no books borrowed from the library.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {issuedBooks.map((item) => {
              const isOverdue = item.status === 'overdue';
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition relative overflow-hidden ${
                    isOverdue
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-sky-50/50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-white border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full mb-1 inline-block shadow-2xs">
                        {item.category || 'Library Book'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {item.book_title}
                      </h3>
                      <p className="text-xs text-slate-500">by {item.book_author}</p>
                    </div>

                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Overdue ({item.days_overdue}d)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold shrink-0">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Active Borrowing
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-blue-200/60 grid grid-cols-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Issue Date</span>
                      <span className="text-slate-700 font-medium">{item.issue_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Return Due Date</span>
                      <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {new Date(item.due_date).getFullYear() > 2030 ? "No Limit" : item.due_date}
                      </span>
                    </div>
                  </div>

                  {isOverdue && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Penalty Notice:
                      </span>
                      <span className="font-bold text-[11px]">2-Week Borrowing Ban Triggers On Return</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

