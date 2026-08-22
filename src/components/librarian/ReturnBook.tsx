import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, AlertTriangle, Clock, RefreshCw, CheckCircle2, DollarSign, Layers, Search, Loader2, Mail } from 'lucide-react';
import { IssuedBook } from '../../types';
import { formatDate } from '../../utils/dateFormatter';
import { DirectEmailModal } from '../common/DirectEmailModal';

interface ReturnBookProps {
  onSuccessToast: (msg: string) => void;
}

export const ReturnBook: React.FC<ReturnBookProps> = ({ onSuccessToast }) => {
  const [issuedList, setIssuedList] = useState<IssuedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssuedBook | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailItem, setSelectedEmailItem] = useState<IssuedBook | null>(null);

  const groupedIssuedList = React.useMemo(() => {
    const groups: Record<string, any> = {};
    const filteredList = issuedList.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.student_name.toLowerCase().includes(q) ||
        (item.student_card_no || '').toLowerCase().includes(q) ||
        item.book_title.toLowerCase().includes(q) ||
        (item.issue_code || '').toLowerCase().includes(q)
      );
    });

    filteredList.forEach(item => {
      const key = `${item.student_name}-${item.book_id}-${item.issue_date}-${item.due_date}`;
      if (!groups[key]) {
        groups[key] = { ...item, copies: 1, copy_ids: [item.id], issue_codes: [item.issue_code] };
      } else {
        groups[key].copies += 1;
        groups[key].copy_ids.push(item.id);
        groups[key].issue_codes.push(item.issue_code);
      }
    });
    return Object.values(groups);
  }, [issuedList]);


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


  const handleEditClick = (item: IssuedBook) => {
    setEditingIssue(item);
    setNewDueDate(item.due_date);
  };

  const handleSaveEdit = async () => {
    if (!editingIssue) return;
    setSavingEdit(true);
    try {
      const ids = editingIssue.copy_ids || [editingIssue.id];
      for (const id of ids) {
        await fetch(`/api/issue/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ due_date: newDueDate })
        });
      }
      onSuccessToast('Due date updated successfully.');
      setEditingIssue(null);
      fetchIssuedBooks();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReturn = async (item: any) => {
    const allIds = item.copy_ids || [item.id];
    const isTeacherWithMultiple = (!!item.teacher_id || item.student_name?.includes('(Teacher)')) && item.copies > 1;
    const selectedQty = (isTeacherWithMultiple && returnQtyMap[item.id] !== undefined)
      ? returnQtyMap[item.id]
      : allIds.length;

    const idsToReturn = allIds.slice(0, selectedQty);
    setReturningId(idsToReturn[0]);
    try {
      let lastMsg = '';
      for (const id of idsToReturn) {
        const res = await fetch(`/api/return/${id}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          lastMsg = data.message;
        }
      }
      onSuccessToast(
        selectedQty > 1
          ? `Returned ${selectedQty} copies of "${item.book_title}" successfully.`
          : (lastMsg || `Returned "${item.book_title}" successfully.`)
      );
      fetchIssuedBooks();
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search borrower or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white w-64 transition-all"
            />
          </div>
          <button
            onClick={fetchIssuedBooks}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading active borrowings & issued books...</p>
          </div>
        ) : groupedIssuedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            All issued books have been returned! No active borrowings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Borrower Details</th>
                  <th className="px-6 py-3.5">Book Title</th>
                  <th className="px-6 py-3.5 text-center">No. of Copies</th>
                  <th className="px-6 py-3.5">Issue & Due Dates</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Borrowing Restriction Penalty</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {groupedIssuedList.map((item) => {
                  const isOverdue = item.status === 'overdue';
                  const isTeacherWithMultiple = (!!item.teacher_id || item.student_name?.includes('(Teacher)')) && item.copies > 1;
                  const selectedQty = (isTeacherWithMultiple && returnQtyMap[item.id] !== undefined)
                    ? returnQtyMap[item.id]
                    : item.copies;
                  const isThisReturning = returningId === item.copy_ids[0];

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.student_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-blue-700 font-semibold">{item.student_card_no}</span>
                          {item.student_class === 'Subject Teacher' || item.student_class === 'Staff' ? (
                            <span>• {item.student_class.replace('Class ', '')}</span>
                          ) : (
                            <span>• {item.student_class.startsWith('Class') ? item.student_class : `Class ${item.student_class}`}{item.student_division ? `-${item.student_division}` : ''}</span>
                          )}
                        </div>
                        {item.email || item.student_email || item.teacher_email ? (
                          <div className="text-[11px] text-blue-700 flex items-center gap-1 font-mono mt-1">
                            <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate max-w-[190px]">{item.email || item.student_email || item.teacher_email}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                            <span>No email on profile</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.book_title}</div>
                        <div className="text-[11px] text-slate-500">{item.book_author}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                          item.copies > 1 
                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          {item.copies} {item.copies === 1 ? 'Copy' : 'Copies'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-slate-600">Issue: {formatDate(item.issue_date)}</div>
                        <div className={`font-semibold mt-0.5 ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                          Due: {formatDate(item.due_date)}
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedEmailItem(item);
                              setIsEmailModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition inline-flex items-center gap-1 border border-indigo-200"
                            title="Send Email Notice"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            Edit
                          </button>

                          {isTeacherWithMultiple ? (
                            <div className="inline-flex items-stretch rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition overflow-hidden border border-blue-700">
                              <select
                                value={selectedQty}
                                onChange={(e) => setReturnQtyMap(prev => ({ ...prev, [item.id]: parseInt(e.target.value, 10) }))}
                                disabled={returningId !== null}
                                className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-2 py-1.5 focus:outline-none border-r border-blue-500 cursor-pointer disabled:opacity-50"
                              >
                                {Array.from({ length: item.copies }, (_, i) => i + 1).map((num) => (
                                  <option key={num} value={num} className="bg-white text-slate-800 font-medium">
                                    {num} {num === 1 ? 'Copy' : 'Copies'}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleReturn(item)}
                                disabled={returningId !== null}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800/60 transition disabled:opacity-50"
                              >
                                {isThisReturning ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                )}
                                {isThisReturning ? 'Returning...' : 'Return'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleReturn(item)}
                              disabled={returningId !== null}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                            >
                              {isThisReturning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              )}
                              {isThisReturning ? 'Processing Return...' : 'Return'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      
      {/* Edit Due Date Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Edit Due Date</h3>
            <p className="text-xs text-slate-500 mb-4">
              Update the return deadline for <span className="font-semibold text-slate-700">{editingIssue.book_title}</span>.
            </p>
            
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Due Date</label>
            <input 
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-6 font-medium"
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingIssue(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
              >
                {savingEdit && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Email Modal */}
      <DirectEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedEmailItem(null);
        }}
        initialToEmail={selectedEmailItem?.email || selectedEmailItem?.student_email || selectedEmailItem?.teacher_email || ''}
        initialSubject={selectedEmailItem ? (selectedEmailItem.status === 'overdue' ? `📚 Overdue Notice: "${selectedEmailItem.book_title}" — School Library` : `📚 Library Notice: "${selectedEmailItem.book_title}"`) : undefined}
        initialMessage={selectedEmailItem ? `Dear ${selectedEmailItem.student_name},\n\nThis is a notice from the School Library regarding your borrowed book:\n📖 "${selectedEmailItem.book_title}"\n📅 Due Date: ${selectedEmailItem.due_date}${selectedEmailItem.status === 'overdue' ? ` (${selectedEmailItem.days_overdue} days overdue)` : ''}.\n\nPlease return this book to the circulation desk promptly to keep your borrowing privileges active.\n\n— School Library Administration\nEmail: library@school.com` : undefined}
        studentId={selectedEmailItem?.student_id}
        teacherId={selectedEmailItem?.teacher_id}
        onEmailSent={(sentTo) => {
          onSuccessToast(`Email notice delivered to ${sentTo}!`);
        }}
      />
      </div>
    </div>
  );
};