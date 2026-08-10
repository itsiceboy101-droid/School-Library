import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, AlertTriangle, Clock, RefreshCw, CheckCircle2, DollarSign } from 'lucide-react';
import { IssuedBook } from '../../types';

interface ReturnBookProps {
  onSuccessToast: (msg: string) => void;
}

export const ReturnBook: React.FC<ReturnBookProps> = ({ onSuccessToast }) => {
  const [issuedList, setIssuedList] = useState<IssuedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState<number | null>(null);

  const fetchIssuedBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issued-books');
      if (res.ok) {
        const data = await res.json();
        setIssuedList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  const handleReturn = async (issueId: number) => {
    setReturningId(issueId);
    try {
      const res = await fetch(`/api/return/${issueId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast(data.message || `Returned "${data.book_title}" successfully.`);
        fetchIssuedBooks();
      } else {
        console.error(data.error || 'Failed to return book');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-blue-600" />
            Active & Overdue Issued Books
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process book returns and enforce automatic 2-week borrowing bans for late returns
          </p>
        </div>
        <button
          onClick={fetchIssuedBooks}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Refresh List
        </button>
      </div>

      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {issuedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            All issued books have been returned! No active borrowings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Book Title</th>
                  <th className="px-6 py-3.5">Issue & Due Dates</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Borrowing Restriction Penalty</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {issuedList.map((item) => {
                  const isOverdue = item.status === 'overdue';
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.student_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-blue-700 font-semibold">{item.student_card_no}</span>
                          <span>• Class {item.student_class}-{item.student_division}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.book_title}</div>
                        <div className="text-[11px] text-slate-500">{item.book_author}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600">Issue: {item.issue_date}</div>
                        <div className={`font-semibold mt-0.5 ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                          Due: {item.due_date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue ({item.days_overdue} days)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isOverdue ? (
                          <span className="font-bold text-rose-600 text-xs flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            2-Week Ban Triggers On Return
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            No Ban (On Time)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleReturn(item.id)}
                          disabled={returningId === item.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          {returningId === item.id ? 'Processing...' : 'Return Book'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
