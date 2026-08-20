import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, AlertTriangle, Users, DollarSign, Layers, CheckCircle2, Download, Printer, Loader2, Mail, Send, Check } from 'lucide-react';
import { ReportSummary } from '../../types';
import { formatDate } from '../../utils/dateFormatter';
import { DirectEmailModal } from '../common/DirectEmailModal';

export const ReportsManager: React.FC = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null);
  const [emailSuccessToast, setEmailSuccessToast] = useState<string | null>(null);
  const [bulkEmailSending, setBulkEmailSending] = useState(false);

  const [selectedEmailItem, setSelectedEmailItem] = useState<any>(null);

  const groupedOverdueList = React.useMemo(() => {
    const groups: Record<string, any> = {};
    overdueList.forEach(item => {
      const isTeacher = item.student_name && item.student_name.includes('(Teacher)');
      if (isTeacher) {
        const key = `${item.student_name}-${item.book_id || item.book_title}-${item.issue_date}-${item.due_date}`;
        if (!groups[key]) {
          groups[key] = { ...item, copies: 1, copy_ids: [item.id] };
        } else {
          groups[key].copies += 1;
          groups[key].copy_ids.push(item.id);
        }
      } else {
        groups[`${item.id}`] = { ...item, copies: 1, copy_ids: [item.id] };
      }
    });
    return Object.values(groups);
  }, [overdueList]);

  const handleEmailOverdue = async (item: any) => {
    setEmailSendingId(item.id);
    try {
      const res = await fetch('/api/notifications/email/send-overdue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: item.id,
          recipientEmail: item.email || item.student_email || item.teacher_email || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSuccessToast(`Overdue email sent to ${data.sentTo}!`);
        setTimeout(() => setEmailSuccessToast(null), 3500);
      } else {
        setSelectedEmailItem(item);
        setIsEmailModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      setSelectedEmailItem(item);
      setIsEmailModalOpen(true);
    } finally {
      setEmailSendingId(null);
    }
  };

  const handleBulkEmailOverdue = async () => {
    if (groupedOverdueList.length === 0) return;
    setBulkEmailSending(true);
    let sentCount = 0;
    try {
      for (const item of groupedOverdueList) {
        try {
          const res = await fetch('/api/notifications/email/send-overdue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issueId: item.id,
            }),
          });
          if (res.ok) sentCount++;
        } catch {
          // ignore single item failure
        }
      }
      setEmailSuccessToast(`Sent overdue alert emails (${sentCount} delivered via Gmail)!`);
      setTimeout(() => setEmailSuccessToast(null), 4000);
    } finally {
      setBulkEmailSending(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingIssue(item);
    setNewDueDate(item.due_date);
  };

  const handleSaveEdit = async () => {
    if (!editingIssue) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/issue/${editingIssue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: newDueDate })
      });
      if (res.ok) {
        setEditingIssue(null);
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [resSum, resOver] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/overdue'),
      ]);

      if (resSum.ok && resOver.ok) {
        const sumData = await resSum.json();
        const overData = await resOver.json();
        setSummary(sumData);
        setOverdueList(overData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {emailSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{emailSuccessToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Library Operational Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time library metrics, borrowing stats, and overdue penalty tracking
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          Print / Export Report
        </button>
      </div>

      {/* Summary KPI Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between mb-2">
              <span>Total Titles</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_books}</div>
            <div className="text-[10px] text-slate-500 mt-1">Unique catalog items</div>
          </div>

          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between mb-2">
              <span>Total Copies</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_copies}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">
              {summary.available_copies} copies currently available
            </div>
          </div>

          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between mb-2">
              <span>Active Borrowings</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{summary.issued}</div>
            <div className="text-[10px] text-slate-500 mt-1">Currently with borrowers</div>
          </div>

          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between mb-2">
              <span>Overdue Items</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600">{summary.overdue}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-1">Past expected due date</div>
          </div>

          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between mb-2">
              <span>Students</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_students}</div>
            <div className="text-[10px] text-slate-500 mt-1">Registered members</div>
          </div>

          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between mb-2">
              <span>Restricted Borrowers</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600">{summary.restricted_students_count}</div>
            <div className="text-[10px] text-slate-500 mt-1">2-week borrowing ban</div>
          </div>
        </div>
      )}

      {/* Overdue Books List */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Overdue Books Audit List ({groupedOverdueList.length})
            </h3>
            <span className="text-xs text-rose-600 font-semibold">
              Policy: 2-Week Borrowing Restriction on Late Return
            </span>
          </div>

          {groupedOverdueList.length > 0 && (
            <button
              onClick={handleBulkEmailOverdue}
              disabled={bulkEmailSending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-600/20 disabled:opacity-50"
            >
              {bulkEmailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {bulkEmailSending ? 'Sending Emails...' : 'Email All Overdue'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-slate-500 animate-pulse">Fetching analytics data...</p>
          </div>
        ) : groupedOverdueList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            No overdue books at this time! All borrowings are currently within the due date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Borrower</th>
                  <th className="px-6 py-3.5">Book Title</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Days Overdue</th>
                  <th className="px-6 py-3.5 text-right">Penalty Status</th>
                  <th className="px-6 py-3.5 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {groupedOverdueList.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.student_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.student_card_no ? item.student_card_no : ''}
                        {item.student_class ? ` • ${item.student_class}` : ''}
                        {item.student_roll ? ` (#${item.student_roll})` : ''}
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
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.book_title}
                      {item.copies > 1 && (
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                          {item.copies} Copies
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">
                      {formatDate(item.due_date)}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600">
                      {item.days_overdue} days
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600 text-xs">
                      2-Week Ban Pending Return
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleEmailOverdue(item)}
                          disabled={emailSendingId === item.id}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition inline-flex items-center gap-1 disabled:opacity-50"
                          title="Send Email Overdue Notice"
                        >
                          {emailSendingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          Email Overdue
                        </button>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          Edit Due
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      
      {/* Edit Due Date Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
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
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 inline-flex items-center gap-1.5"
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
        initialToEmail={selectedEmailItem?.email || selectedEmailItem?.student_email || selectedEmailItem?.teacher_email || '9sunandanik9@gmail.com'}
        initialSubject={selectedEmailItem ? `📚 Overdue Notice: "${selectedEmailItem.book_title}" — School Library` : undefined}
        initialMessage={selectedEmailItem ? `Dear ${selectedEmailItem.student_name},\n\nThis is an urgent notice from the School Library regarding your borrowed book:\n📖 "${selectedEmailItem.book_title}"\n📅 Due Date: ${selectedEmailItem.due_date} (${selectedEmailItem.days_overdue} days overdue).\n\nPlease return this book to the circulation desk immediately to keep your borrowing privileges active.\n\n— School Library Administration\nEmail: 9sunandanik9@gmail.com` : undefined}
        onEmailSent={(sentTo) => {
          setEmailSuccessToast(`Email notice delivered to ${sentTo}!`);
          setTimeout(() => setEmailSuccessToast(null), 3500);
        }}
      />
      </div>
    </div>
  );
};
