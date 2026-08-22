import React, { useState, useEffect } from 'react';
import { KeyRound, Plus, Trash2, Edit2, CheckCircle2, X } from 'lucide-react';
import { Book, IssueCode } from '../../types';

interface IssueCodeManagerProps {
  onSuccessToast: (msg: string) => void;
}

export const IssueCodeManager: React.FC<IssueCodeManagerProps> = ({ onSuccessToast }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [issueCodes, setIssueCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  
  const [selectedBookId, setSelectedBookId] = useState('');
  const [firstTwo, setFirstTwo] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstTwo, setEditFirstTwo] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [booksRes, codesRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/issue-codes')
      ]);
      const booksData = await booksRes.json();
      const codesData = await codesRes.json();
      if (booksRes.ok) setBooks(booksData);
      if (codesRes.ok) setIssueCodes(codesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedBookId) return setFormError('Please select a book.');
    if (!/^\d{1,2}$/.test(firstTwo.trim())) return setFormError('First 2 digits must be numbers (e.g., 12 or 05).');

    try {
      const res = await fetch('/api/issue-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: Number(selectedBookId), first_two: firstTwo.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate issue code');
      
      onSuccessToast('Issue codes generated successfully.');
      setSelectedBookId('');
      setFirstTwo('');
      fetchInitialData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this issue code?')) return;
    try {
      const res = await fetch(`/api/issue-codes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onSuccessToast('Issue code deleted successfully.');
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (code: any) => {
    setEditingId(code.id);
    setEditFirstTwo(code.first_two);
  };

  const saveEdit = async (id: number) => {
    if (!/^\d{1,2}$/.test(editFirstTwo.trim())) return alert('Must be 1 or 2 digits');
    try {
      const res = await fetch(`/api/issue-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_two: editFirstTwo.trim() })
      });
      if (!res.ok) throw new Error('Failed to update');
      onSuccessToast('Issue code updated successfully.');
      setEditingId(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // Group issue codes by book title for better display
  const groupedCodes = issueCodes.reduce((acc: any, curr) => {
    const title = curr.book_title || 'Unknown Book';
    if (!acc[title]) acc[title] = [];
    acc[title].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 p-6 rounded-2xl shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          Book Issue Code Generator
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Select a book and enter the first 2 digits. The system automatically generates the last 2 digits based on the total number of physical copies to create a complete 4-digit issue code.
        </p>

        {formError && (
          <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl mb-6">
            {formError}
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Book</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              required
            >
              <option value="">-- Choose a book --</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.title} ({b.total_copies} copies)</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-semibold text-slate-700 mb-1">First 2 Digits</label>
            <input
              type="text"
              maxLength={2}
              value={firstTwo}
              onChange={(e) => setFirstTwo(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 12"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              required
            />
          </div>
          <div className="w-full sm:w-auto self-end sm:mt-[22px]">
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Generate
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-blue-200 p-6 rounded-2xl shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Generated Issue Codes</h3>
        {loading ? (
          <p className="text-xs text-slate-500 animate-pulse">Loading...</p>
        ) : Object.keys(groupedCodes).length === 0 ? (
          <p className="text-xs text-slate-500">No issue codes have been generated yet.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCodes).map(([title, codes]: [string, any]) => (
              <div key={title} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{title}</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {codes.map((code: any) => (
                    <div key={code.id} className="border border-indigo-100 bg-indigo-50/30 rounded-lg p-2.5 flex items-center justify-between group">
                      {editingId === code.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            maxLength={2}
                            value={editFirstTwo}
                            onChange={(e) => setEditFirstTwo(e.target.value.replace(/\D/g, ''))}
                            className="w-10 px-1 py-0.5 text-xs font-bold text-center border border-indigo-300 rounded focus:outline-none"
                            autoFocus
                          />
                          <span className="text-xs font-mono font-bold text-slate-600">{code.last_two}</span>
                          <button onClick={() => saveEdit(code.id)} className="ml-auto text-emerald-600 hover:text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-black text-indigo-700 tracking-wider">
                              {code.full_code}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(code)} className="text-slate-400 hover:text-indigo-600 transition">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(code.id)} className="text-slate-400 hover:text-rose-600 transition">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
