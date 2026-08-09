import React, { useState, useEffect } from 'react';
import { History, CheckCircle, Calendar } from 'lucide-react';
import { Student } from '../../types';

interface BorrowingHistoryProps {
  student: Student;
}

export const BorrowingHistory: React.FC<BorrowingHistoryProps> = ({ student }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${student.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [student.id]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          Borrowing History & Return Timeline
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Past books returned to the library
        </p>
      </div>

      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No borrowing history recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Book Title</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5">Returned Date</th>
                  <th className="px-6 py-3.5 text-right">Return Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{item.book_title}</td>
                    <td className="px-6 py-3.5 text-slate-500">{item.book_author}</td>
                    <td className="px-6 py-3.5 text-slate-600">{item.issue_date}</td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-700">
                      {item.return_date || 'Returned'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
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
    </div>
  );
};
