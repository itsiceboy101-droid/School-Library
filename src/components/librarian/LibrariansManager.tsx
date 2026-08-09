import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, UserCheck, AlertCircle, Sparkles, Key, Mail, CheckCircle2 } from 'lucide-react';
import { LibrarianAccount } from '../../types';

interface LibrariansManagerProps {
  onSuccessToast: (msg: string) => void;
  openAddModalInitially?: boolean;
}

export const LibrariansManager: React.FC<LibrariansManagerProps> = ({ onSuccessToast, openAddModalInitially = false }) => {
  const [librarians, setLibrarians] = useState<LibrarianAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(openAddModalInitially);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'librarian' | 'head_librarian'>('librarian');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (openAddModalInitially) {
      setShowAddModal(true);
    }
  }, [openAddModalInitially]);

  const fetchLibrarians = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/librarians');
      if (res.ok) {
        const data = await res.json();
        setLibrarians(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians();
  }, []);

  const handleCreateLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/librarians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccessToast(data.message || `Librarian ${name} added successfully!`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('librarian');
        setShowAddModal(false);
        fetchLibrarians();
      } else {
        setError(data.error || 'Failed to add librarian');
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLibrarian = async (id: number, libName: string) => {
    if (id === 1) {
      alert('The master Teacher Access Pass account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete librarian account "${libName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/librarians/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast(data.message || 'Librarian account removed');
        fetchLibrarians();
      } else {
        alert(data.error || 'Failed to delete librarian');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete librarian');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Librarians Directory & Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage library staff accounts, grant access rights, and delete obsolete accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Add New Librarian
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading staff records...</div>
        ) : librarians.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No librarian accounts found. Click "+ Add New Librarian" above to register staff.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Staff Name & ID</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Access Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {librarians.map((lib) => {
                  const isMaster = lib.id === 1 || lib.name === 'Teacher Access' || lib.name === 'Teacher Access Pass';
                  return (
                    <tr key={lib.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isMaster ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {lib.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {lib.name}
                              {isMaster && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-amber-300">
                                  MASTER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">Staff ID: #{lib.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-600">
                        {lib.email}
                      </td>

                      <td className="px-6 py-4">
                        {lib.role === 'head_librarian' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Head Librarian / Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
                            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                            Librarian
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {!isMaster ? (
                          <button
                            onClick={() => handleDeleteLibrarian(lib.id, lib.name)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                            title="Delete Librarian Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Protected Master</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Librarian Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Register New Librarian Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateLibrarian} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Staff Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Teacher Access"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="..........."
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Staff Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="librarian">Standard Librarian (Catalog & Issue Desk)</option>
                  <option value="head_librarian">Head Librarian / Admin (Full Access & Staff Admin)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-blue-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
