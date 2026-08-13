import React, { useState, useEffect } from 'react';
import { Hash, Sparkles, BookOpen, Edit2, Trash2, Check, X, Search, RefreshCw, KeyRound, AlertCircle, ChevronDown } from 'lucide-react';
import { Book, IssueCode } from '../../types';
import { formatDate } from '../../utils/dateFormatter';

interface IssueCodeManagerProps {
  onSuccessToast: (msg: string) => void;
}

export const IssueCodeManager: React.FC<IssueCodeManagerProps> = ({ onSuccessToast }) => {
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [codesList, setCodesList] = useState<IssueCode[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [firstTwoInput, setFirstTwoInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Editing State
  const [editingCode, setEditingCode] = useState<IssueCode | null>(null);
  const [editFirstTwo, setEditFirstTwo] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resBooks, resCodes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/issue-codes')
      ]);

      if (resBooks.ok) {
        const booksData = await resBooks.json();
        setBooksList(booksData);
      }

      if (resCodes.ok) {
        const codesData = await resCodes.json();
        setCodesList(codesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedBookId) {
      setFormError('Please select a book.');
      return;
    }

    const cleanFirstTwo = firstTwoInput.trim();
    if (!cleanFirstTwo || !/^\d{1,2}$/.test(cleanFirstTwo)) {
      setFormError('First 2 numbers must be digits (e.g. 12, 05, 99).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/issue-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: selectedBookId,
          first_two: cleanFirstTwo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccessToast(`Generated ${data.length} codes for "${data[0]?.book_title || 'Book'}"!`);
        setFirstTwoInput('');
        // Refresh codes list
        fetchInitialData();
      } else {
        setFormError(data.error || 'Failed to generate issue code');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (codes: IssueCode[]) => {
    if (!codes.length) return;
    const bookId = codes[0].book_id;
    setDeletingId(bookId);
    try {
      await Promise.all(codes.map(c => fetch(`/api/issue-codes/${c.id}`, { method: 'DELETE' })));
      onSuccessToast('Issue codes deleted successfully.');
      fetchInitialData();
    } catch (err: any) {
      console.error(err);
      onSuccessToast('Error deleting codes');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCodes = codesList.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.book_title && c.book_title.toLowerCase().includes(q)) ||
      (c.book_author && c.book_author.toLowerCase().includes(q)) ||
      c.full_code.includes(q) ||
      c.first_two.includes(q)
    );
  });

  const groupedCodes = Object.values(
    filteredCodes.reduce((acc, code) => {
      if (!acc[code.book_id]) {
        acc[code.book_id] = {
          ...code,
          all_codes: []
        };
      }
      acc[code.book_id].all_codes.push(code);
      return acc;
    }, {} as Record<number, IssueCode & { all_codes: IssueCode[] }>)
  ) as (IssueCode & { all_codes: IssueCode[] })[];

  const previewFirstTwo = firstTwoInput.trim().padStart(2, '0').slice(0, 2);
  const selectedBookObj = booksList.find(b => b.id.toString() === selectedBookId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-blue-600" />
              4-Digit Generator
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Book Issue Code Generator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select a book and enter the first 2 digits. The system automatically generates the last 2 digits to create a complete 4-digit issue code. You can edit the first 2 digits anytime.
          </p>
        </div>

        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Creation Form & Preview Card */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Generate New 4-Digit Issue Code
        </h3>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Select Book */}
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Book <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="">-- Choose a book from catalog --</option>
              {booksList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.author}) — {b.available_copies} available
                </option>
              ))}
            </select>
          </div>

          {/* Enter First 2 Digits */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              First 2 Digits <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={2}
                placeholder="e.g. 45"
                value={firstTwoInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFirstTwoInput(val);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono font-bold text-slate-900 tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                2 Digits
              </span>
            </div>
          </div>

          {/* Code Preview & Submit */}
          <div className="md:col-span-4 flex items-center gap-3">
            <div className="flex-1 bg-sky-50/80 border border-blue-200 rounded-xl px-3.5 py-2 flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-500">
                4-Digit Preview:
              </div>
              <div className="flex items-center gap-1 font-mono text-base font-extrabold">
                <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded">
                  {firstTwoInput ? previewFirstTwo : '??'}
                </span>
                <span className="text-slate-400">+</span>
                <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-xs">
                  Auto (2D)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50 shrink-0"
            >
              {submitting ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 bg-sky-50/50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              Generated Issue Codes ({filteredCodes.length})
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
              <tr>
                <th className="px-6 py-3.5">Book Title & Author</th>
                <th className="px-6 py-3.5 text-center">First 2 Digits</th>
                <th className="px-6 py-3.5 text-center">Generated Codes</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {groupedCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No 4-digit issue codes generated yet. Use the form above to select a book and generate a code.
                  </td>
                </tr>
              ) : (
                groupedCodes.map((group) => (
                  <tr key={group.book_id} className="hover:bg-blue-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{group.book_title || 'Unknown Book'}</div>
                      <div className="text-[11px] text-slate-500">{group.book_author || 'N/A'}</div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                        {group.first_two}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <select className="px-3 py-1.5 bg-slate-900 text-amber-300 border border-slate-700 rounded-xl text-sm font-mono font-black shadow-xs focus:outline-none appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FCD34D%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:10px_10px] bg-[right_10px_center]">
                        {group.all_codes.map(c => (
                          <option key={c.id} value={c.id}>{c.full_code}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-[11px] font-medium">
                      {group.created_at ? formatDate(group.created_at) : 'Just now'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteGroup(group.all_codes)}
                        disabled={deletingId === group.book_id}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition disabled:opacity-50 inline-flex items-center gap-1"
                        title="Delete All Codes for Book"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Codes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
