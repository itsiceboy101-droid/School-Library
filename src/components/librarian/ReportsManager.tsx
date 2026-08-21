import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  BookOpen,
  AlertTriangle,
  Users,
  Layers,
  CheckCircle2,
  Download,
  Printer,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  School,
  TrendingUp,
  Award,
  Calendar,
  ArrowDownLeft,
  Check,
  Filter,
  BarChart2,
  Clock,
  BookMarked,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { ReportSummary, AllTimeStats, HistoryLogItem } from '../../types';
import { formatDate } from '../../utils/dateFormatter';
import { DirectEmailModal } from '../common/DirectEmailModal';

export const ReportsManager: React.FC = () => {
  const [analyticsTab, setAnalyticsTab] = useState<'live' | 'all-time'>('live');

  // Live Tab Data
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  // All-Time Tab Data
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryLogItem[]>([]);
  const [loadingAllTime, setLoadingAllTime] = useState(false);

  // Live Overdue Filters & Actions
  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueFilter, setOverdueFilter] = useState<'all' | 'students' | 'teachers'>('all');
  const [returningId, setReturningId] = useState<number | null>(null);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Email Notifications
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailItem, setSelectedEmailItem] = useState<any>(null);
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null);
  const [bulkEmailSending, setBulkEmailSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // All-Time History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'returned' | 'issued' | 'overdue'>('all');
  const [historyBorrowerFilter, setHistoryBorrowerFilter] = useState<'all' | 'students' | 'teachers'>('all');
  const [historyLimit, setHistoryLimit] = useState<number>(50);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3800);
  };

  // Fetch Live Data
  const fetchLiveData = async () => {
    setLoadingLive(true);
    try {
      const [resSum, resOver] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/overdue'),
      ]);

      if (resSum.ok) {
        const sumData = await resSum.json();
        setSummary(sumData);
      }
      if (resOver.ok) {
        const overData = await resOver.json();
        setOverdueList(overData);
      }
    } catch (err) {
      console.error('Error fetching live reports:', err);
    } finally {
      setLoadingLive(false);
    }
  };

  // Fetch All-Time Data
  const fetchAllTimeData = async () => {
    setLoadingAllTime(true);
    try {
      const [resStats, resHist] = await Promise.all([
        fetch('/api/reports/all-time'),
        fetch('/api/reports/history'),
      ]);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setAllTimeStats(statsData);
      }
      if (resHist.ok) {
        const histData = await resHist.json();
        setHistoryLogs(histData);
      }
    } catch (err) {
      console.error('Error fetching all-time reports:', err);
    } finally {
      setLoadingAllTime(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    fetchAllTimeData();
  }, []);

  // Filtered Overdue List
  const filteredOverdueList = useMemo(() => {
    return overdueList.filter(item => {
      // Role filter
      if (overdueFilter === 'students' && item.is_teacher) return false;
      if (overdueFilter === 'teachers' && !item.is_teacher) return false;

      // Search query
      if (overdueSearch.trim()) {
        const q = overdueSearch.toLowerCase();
        const nameMatch = item.student_name?.toLowerCase().includes(q);
        const cardMatch = item.student_card_no?.toLowerCase().includes(q);
        const titleMatch = item.book_title?.toLowerCase().includes(q);
        const classMatch = item.student_class?.toLowerCase().includes(q);
        const emailMatch = item.email?.toLowerCase().includes(q);
        return nameMatch || cardMatch || titleMatch || classMatch || emailMatch;
      }
      return true;
    });
  }, [overdueList, overdueFilter, overdueSearch]);

  // Filtered History Logs
  const filteredHistoryLogs = useMemo(() => {
    return historyLogs.filter(item => {
      // Status filter
      if (historyStatusFilter !== 'all' && item.status !== historyStatusFilter) return false;

      // Borrower filter
      if (historyBorrowerFilter !== 'all' && item.borrower_type !== historyBorrowerFilter) return false;

      // Search query
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const nameMatch = item.borrower_name?.toLowerCase().includes(q);
        const infoMatch = item.borrower_info?.toLowerCase().includes(q);
        const titleMatch = item.book_title?.toLowerCase().includes(q);
        const authorMatch = item.book_author?.toLowerCase().includes(q);
        const codeMatch = item.issue_code?.toLowerCase().includes(q);
        return nameMatch || infoMatch || titleMatch || authorMatch || codeMatch;
      }
      return true;
    });
  }, [historyLogs, historyStatusFilter, historyBorrowerFilter, historySearch]);

  // Handle Direct Return of an Overdue Book
  const handleReturnOverdue = async (issueId: number, bookTitle: string, borrowerName: string) => {
    setReturningId(issueId);
    try {
      const res = await fetch(`/api/issue/${issueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Book "${bookTitle}" returned successfully!`);
        fetchLiveData();
        fetchAllTimeData();
      } else {
        alert(data.error || 'Failed to process return');
      }
    } catch (err: any) {
      alert(err.message || 'Server error while processing return');
    } finally {
      setReturningId(null);
    }
  };

  // Handle Edit Due Date
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
        body: JSON.stringify({ due_date: newDueDate }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Due date updated to ${newDueDate}`);
        setEditingIssue(null);
        fetchLiveData();
        fetchAllTimeData();
      } else {
        alert(data.error || 'Failed to update due date');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating due date');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Individual Email Notice
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
        showNotification(`Overdue email notice delivered to ${data.sentTo}!`);
      } else {
        setSelectedEmailItem(item);
        setIsEmailModalOpen(true);
      }
    } catch {
      setSelectedEmailItem(item);
      setIsEmailModalOpen(true);
    } finally {
      setEmailSendingId(null);
    }
  };

  // Handle Bulk Email Notice
  const handleBulkEmailOverdue = async () => {
    if (overdueList.length === 0) return;
    setBulkEmailSending(true);
    let sentCount = 0;
    try {
      for (const item of overdueList) {
        try {
          const res = await fetch('/api/notifications/email/send-overdue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issueId: item.id }),
          });
          if (res.ok) sentCount++;
        } catch {
          // continue with next item
        }
      }
      showNotification(`Bulk overdue notices sent (${sentCount} emails delivered via Gmail)!`);
    } finally {
      setBulkEmailSending(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (analyticsTab === 'live') {
      if (overdueList.length === 0) {
        alert('No overdue records to export.');
        return;
      }
      const headers = ['Borrower Name', 'Role', 'Card/Username', 'Class/Division', 'Email', 'Book Title', 'Author', 'Issue Date', 'Due Date', 'Days Overdue'];
      const rows = overdueList.map(item => [
        `"${item.student_name}"`,
        `"${item.is_teacher ? 'Teacher' : 'Student'}"`,
        `"${item.student_card_no || ''}"`,
        `"${item.student_class || ''}"`,
        `"${item.email || ''}"`,
        `"${item.book_title}"`,
        `"${item.book_author || ''}"`,
        `"${item.issue_date}"`,
        `"${item.due_date}"`,
        item.days_overdue,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Library_Overdue_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (historyLogs.length === 0) {
        alert('No history records to export.');
        return;
      }
      const headers = ['Transaction ID', 'Borrower Name', 'Role', 'Borrower Details', 'Email', 'Book Title', 'Author', 'Category', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Days Held', 'Was Late'];
      const rows = historyLogs.map(item => [
        item.id,
        `"${item.borrower_name}"`,
        `"${item.borrower_type}"`,
        `"${item.borrower_info}"`,
        `"${item.email || ''}"`,
        `"${item.book_title}"`,
        `"${item.book_author}"`,
        `"${item.book_category || ''}"`,
        `"${item.issue_date}"`,
        `"${item.due_date}"`,
        `"${item.return_date || 'Active'}"`,
        `"${item.status}"`,
        item.days_held,
        item.is_late ? 'Yes' : 'No',
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Library_All_Time_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Analytics Header with Sub-Tab Selector */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-blue-600" />
              Central Analytics
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Library Analytics & Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Toggle between real-time live operations and comprehensive all-time historical statistics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchLiveData();
              fetchAllTimeData();
              showNotification('Analytics data refreshed');
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh All Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLive || loadingAllTime ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Print Report
          </button>
        </div>
      </div>

      {/* Sub-Tabs Switcher (Live vs All-Time Data) */}
      <div className="flex items-center justify-center gap-2 bg-white border border-blue-200 p-1.5 rounded-2xl max-w-md mx-auto shadow-xs">
        <button
          onClick={() => setAnalyticsTab('live')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            analyticsTab === 'live'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Operations</span>
          {overdueList.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              analyticsTab === 'live' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {overdueList.length} Overdue
            </span>
          )}
        </button>

        <button
          onClick={() => setAnalyticsTab('all-time')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            analyticsTab === 'all-time'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>All-Time Data</span>
          {allTimeStats && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              analyticsTab === 'all-time' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {allTimeStats.total_all_time_issues} Logs
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE OPERATIONS                                                    */}
      {/* ========================================================================= */}
      {analyticsTab === 'live' && (
        <div className="space-y-6">
          {/* Live KPI Metric Grid */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Active Loans</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">{summary.issued}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">Currently with borrowers</div>
              </div>

              <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-xs bg-rose-50/20">
                <div className="text-xs font-semibold text-rose-700 flex items-center justify-between mb-2">
                  <span>Overdue Items</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600">{summary.overdue}</div>
                <div className="text-[10px] text-rose-600 font-semibold mt-1">Pending return</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Due Today</span>
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{summary.due_today || 0}</div>
                <div className="text-[10px] text-amber-600 font-medium mt-1">Expected returns today</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Today's Activity</span>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                  <span className="text-emerald-600">+{summary.today_issued || 0}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-blue-600">-{summary.today_returned || 0}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Issues / Returns today</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Available Copies</span>
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{summary.available_copies}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">Of {summary.total_copies} total physical copies</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Restricted Users</span>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600">{summary.restricted_students_count}</div>
                <div className="text-[10px] text-slate-500 mt-1">2-Week borrowing penalty</div>
              </div>
            </div>
          )}

          {/* Overdue Books Audit & Rapid Management Table */}
          <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Table Header with Filters and Search */}
            <div className="p-4 sm:p-6 border-b border-blue-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Overdue Books Audit List ({filteredOverdueList.length})
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold mt-0.5">
                    Live overdue loans requiring action. Return items or email borrowers directly.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {overdueList.length > 0 && (
                    <button
                      onClick={handleBulkEmailOverdue}
                      disabled={bulkEmailSending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-600/20 disabled:opacity-50"
                    >
                      {bulkEmailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {bulkEmailSending ? 'Sending Emails...' : 'Email All Overdue'}
                    </button>
                  )}
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search borrower name, card no, class, or book title..."
                    value={overdueSearch}
                    onChange={(e) => setOverdueSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-blue-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setOverdueFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      overdueFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    All ({overdueList.length})
                  </button>
                  <button
                    onClick={() => setOverdueFilter('students')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      overdueFilter === 'students' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Students ({overdueList.filter(i => !i.is_teacher).length})
                  </button>
                  <button
                    onClick={() => setOverdueFilter('teachers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      overdueFilter === 'teachers' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Teachers ({overdueList.filter(i => i.is_teacher).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loadingLive ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading overdue audit data...</p>
              </div>
            ) : filteredOverdueList.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">No Overdue Books Found!</h4>
                <p className="text-slate-500">
                  {overdueSearch ? 'No overdue borrowings match your search filter.' : 'All borrowings are currently returned or within their active loan periods.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-sky-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-blue-200">
                    <tr>
                      <th className="px-5 py-3.5">Borrower</th>
                      <th className="px-5 py-3.5">Book Details</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Overdue Days</th>
                      <th className="px-5 py-3.5">Status / Policy</th>
                      <th className="px-5 py-3.5 text-right print:hidden">Direct Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {filteredOverdueList.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{item.student_name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              item.is_teacher ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.is_teacher ? 'Teacher' : 'Student'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {item.student_card_no ? `Card: ${item.student_card_no}` : ''}
                            {item.student_class ? ` • ${item.student_class}` : ''}
                            {item.student_roll ? ` (#${item.student_roll})` : ''}
                          </div>
                          {item.email ? (
                            <div className="text-[11px] text-blue-700 flex items-center gap-1 font-mono mt-1">
                              <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[190px]">{item.email}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                              <span>No email on profile</span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-800">
                          <div className="font-bold text-slate-900 text-xs">{item.book_title}</div>
                          <div className="text-[11px] text-slate-500">{item.book_author}</div>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1">
                            {item.book_category || 'General'}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-rose-600">
                          {formatDate(item.due_date)}
                          <div className="text-[10px] text-slate-400 font-mono">Issued: {formatDate(item.issue_date)}</div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700">
                            {item.days_overdue} days late
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-bold text-rose-600">
                          {item.restriction_status}
                        </td>

                        <td className="px-5 py-4 text-right print:hidden">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Direct Return Button */}
                            <button
                              onClick={() => handleReturnOverdue(item.id, item.book_title, item.student_name)}
                              disabled={returningId === item.id}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                              title="Process book return immediately"
                            >
                              {returningId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              )}
                              Return
                            </button>

                            {/* Email Overdue Notice */}
                            <button
                              onClick={() => handleEmailOverdue(item)}
                              disabled={emailSendingId === item.id}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition inline-flex items-center gap-1 disabled:opacity-50"
                              title="Send Email Overdue Notice"
                            >
                              {emailSendingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              Email
                            </button>

                            {/* Edit Due Date */}
                            <button
                              onClick={() => handleEditClick(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL-TIME DATA & HISTORICAL ANALYTICS                               */}
      {/* ========================================================================= */}
      {analyticsTab === 'all-time' && (
        <div className="space-y-6">
          {/* All-Time Grand Totals Metric Cards */}
          {allTimeStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>All-Time Issues</span>
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600">{allTimeStats.total_all_time_issues}</div>
                <div className="text-[10px] text-slate-500 mt-1">Lifetime book issues</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>All-Time Returns</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">{allTimeStats.total_all_time_returns}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                  {allTimeStats.return_rate}% Return Rate
                </div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Registered Students</span>
                  <Users className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{allTimeStats.total_students}</div>
                <div className="text-[10px] text-slate-500 mt-1">Active student card holders</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Registered Teachers</span>
                  <School className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{allTimeStats.total_teachers}</div>
                <div className="text-[10px] text-slate-500 mt-1">Staff with assigned classes</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Catalog Titles</span>
                  <BookMarked className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{allTimeStats.total_books}</div>
                <div className="text-[10px] text-slate-500 mt-1">Unique catalog titles</div>
              </div>

              <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                  <span>Total Physical Copies</span>
                  <Layers className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{allTimeStats.total_copies}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {allTimeStats.available_copies} available • {allTimeStats.issued_copies} on loan
                </div>
              </div>
            </div>
          )}

          {/* Borrower Breakdown Split Bar (Students vs Teachers) */}
          {allTimeStats && (
            <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-2 flex items-center justify-between">
                <span>Borrowing Distribution by User Role</span>
                <span className="text-xs text-slate-500 font-normal">
                  Total {allTimeStats.total_all_time_issues} Lifetime Issues
                </span>
              </h3>
              
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex mb-3">
                <div
                  style={{
                    width: `${
                      allTimeStats.total_all_time_issues > 0
                        ? (allTimeStats.student_issues_count / allTimeStats.total_all_time_issues) * 100
                        : 50
                    }%`,
                  }}
                  className="bg-blue-600 h-full transition-all duration-500"
                  title={`Students: ${allTimeStats.student_issues_count}`}
                />
                <div
                  style={{
                    width: `${
                      allTimeStats.total_all_time_issues > 0
                        ? (allTimeStats.teacher_issues_count / allTimeStats.total_all_time_issues) * 100
                        : 50
                    }%`,
                  }}
                  className="bg-teal-500 h-full transition-all duration-500"
                  title={`Teachers: ${allTimeStats.teacher_issues_count}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                  <div>
                    <span className="font-bold text-slate-800">Student Loans:</span>{' '}
                    <span className="font-mono text-slate-600">
                      {allTimeStats.student_issues_count} (
                      {allTimeStats.total_all_time_issues > 0
                        ? Math.round((allTimeStats.student_issues_count / allTimeStats.total_all_time_issues) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0"></span>
                  <div>
                    <span className="font-bold text-slate-800">Teacher Loans:</span>{' '}
                    <span className="font-mono text-slate-600">
                      {allTimeStats.teacher_issues_count} (
                      {allTimeStats.total_all_time_issues > 0
                        ? Math.round((allTimeStats.teacher_issues_count / allTimeStats.total_all_time_issues) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deep Insight Leaderboard Grids */}
          {allTimeStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top 10 Most Borrowed Books */}
              <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Borrowed Books
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    All-Time
                  </span>
                </div>

                {allTimeStats.top_borrowed_books.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No borrowing records yet.</p>
                ) : (
                  <div className="space-y-3">
                    {allTimeStats.top_borrowed_books.slice(0, 5).map((book, idx) => (
                      <div key={book.id} className="flex items-center justify-between text-xs pb-2.5 border-b border-blue-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            idx === 0 ? 'bg-amber-100 text-amber-800 font-extrabold' :
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            idx === 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{book.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{book.author} • {book.category}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="inline-block font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                            {book.borrow_count} loans
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Student Readers */}
              <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" />
                    Top Student Readers
                  </h3>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    Honor Roll
                  </span>
                </div>

                {allTimeStats.top_student_readers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No student loans recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {allTimeStats.top_student_readers.slice(0, 5).map((stu, idx) => (
                      <div key={stu.id} className="flex items-center justify-between text-xs pb-2.5 border-b border-blue-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{stu.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Class {stu.class}-{stu.division} • {stu.library_card_no}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="inline-block font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-mono">
                            {stu.borrow_count} books
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class-wise Borrowing Leaderboard */}
              <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-teal-600" />
                    Class-wise Activity
                  </h3>
                  <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    Distribution
                  </span>
                </div>

                {allTimeStats.class_wise_distribution.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No class borrowing data available.</p>
                ) : (
                  <div className="space-y-2.5">
                    {allTimeStats.class_wise_distribution.slice(0, 5).map((cls) => {
                      const maxCount = allTimeStats.class_wise_distribution[0]?.count || 1;
                      const pct = Math.round((cls.count / maxCount) * 100);
                      return (
                        <div key={cls.class_name} className="text-xs">
                          <div className="flex justify-between font-semibold mb-1">
                            <span className="text-slate-800">{cls.class_name}</span>
                            <span className="text-teal-700 font-mono font-bold">{cls.count} borrowings</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-500 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All-Time Historical Loan Ledger */}
          <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-6 border-b border-blue-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    All-Time Lending History Ledger ({filteredHistoryLogs.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete archival audit of every book issue, return, duration, and penalty record.
                  </p>
                </div>
              </div>

              {/* History Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ledger by borrower, book title, card no, or issue code..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-blue-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setHistoryStatusFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyStatusFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setHistoryStatusFilter('returned')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyStatusFilter === 'returned' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Returned
                  </button>
                  <button
                    onClick={() => setHistoryStatusFilter('issued')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyStatusFilter === 'issued' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setHistoryStatusFilter('overdue')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyStatusFilter === 'overdue' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Overdue
                  </button>
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setHistoryBorrowerFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyBorrowerFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    All Roles
                  </button>
                  <button
                    onClick={() => setHistoryBorrowerFilter('student')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyBorrowerFilter === 'student' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setHistoryBorrowerFilter('teacher')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyBorrowerFilter === 'teacher' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Teachers
                  </button>
                </div>
              </div>
            </div>

            {/* History Table */}
            {loadingAllTime ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading all-time history ledger...</p>
              </div>
            ) : filteredHistoryLogs.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">No Historical Records Found</h4>
                <p className="text-slate-500">No records match the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-sky-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-blue-200">
                    <tr>
                      <th className="px-5 py-3.5">Log ID / Borrower</th>
                      <th className="px-5 py-3.5">Book Title & Category</th>
                      <th className="px-5 py-3.5">Issue Date</th>
                      <th className="px-5 py-3.5">Return / Due Date</th>
                      <th className="px-5 py-3.5">Duration Held</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {filteredHistoryLogs.slice(0, historyLimit).map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50/50 transition">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">#{log.id}</span>
                            <span className="text-xs font-bold text-slate-900">{log.borrower_name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              log.borrower_type === 'teacher' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.borrower_type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {log.borrower_info}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          <div className="font-bold text-slate-900 text-xs">{log.book_title}</div>
                          <div className="text-[11px] text-slate-500">{log.book_author} • {log.book_category}</div>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-600">
                          {formatDate(log.issue_date)}
                        </td>

                        <td className="px-5 py-3.5 font-mono">
                          {log.return_date ? (
                            <span className="text-emerald-700 font-semibold">
                              {formatDate(log.return_date)}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">
                              Due: {formatDate(log.due_date)}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-700">
                          {log.days_held} days
                          {log.is_late && (
                            <span className="block text-[10px] font-bold text-rose-600">Late return</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                            log.status === 'returned'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.status === 'returned' ? 'Returned' : log.status === 'overdue' ? 'Overdue' : 'Active Loan'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredHistoryLogs.length > historyLimit && (
                  <div className="p-4 bg-slate-50 border-t border-blue-200 text-center">
                    <button
                      onClick={() => setHistoryLimit(prev => prev + 50)}
                      className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Load More Records ({filteredHistoryLogs.length - historyLimit} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
        studentId={selectedEmailItem?.student_id}
        teacherId={selectedEmailItem?.teacher_id}
        onEmailSent={(sentTo) => {
          showNotification(`Email notice delivered to ${sentTo}!`);
        }}
      />
    </div>
  );
};
