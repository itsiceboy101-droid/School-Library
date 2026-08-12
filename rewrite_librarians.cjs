const fs = require('fs');

let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

// The goal is to refactor Add/Edit into a single modal.
// I will just write a script to completely rewrite LibrariansManager.tsx

const newCode = `import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, UserCheck, AlertCircle, Sparkles, Key, Mail, CheckCircle2, Eye, EyeOff, Pencil, Save, X } from 'lucide-react';
import { LibrarianAccount } from '../../types';

interface LibrariansManagerProps {
  onSuccessToast: (msg: string) => void;
  openAddModalInitially?: boolean;
}

export const LibrariansManager: React.FC<LibrariansManagerProps> = ({ onSuccessToast, openAddModalInitially }) => {
  const [librarians, setLibrarians] = useState<LibrarianAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially || false);
  const [editingLibrarian, setEditingLibrarian] = useState<LibrarianAccount | null>(null);
  const [deletingLibrarian, setDeletingLibrarian] = useState<LibrarianAccount | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'librarian' | 'head_librarian'>('librarian');
  const [showPassword, setShowPassword] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrarians();
  }, []);

  useEffect(() => {
    if (openAddModalInitially) {
      openAddModal();
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

  const toggleTablePassword = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingLibrarian(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('librarian');
    setError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (lib: LibrarianAccount) => {
    setEditingLibrarian(lib);
    setName(lib.name);
    setEmail(lib.email);
    setPassword(lib.password || '');
    setRole(lib.role);
    setError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }
    
    // Require password for new accounts
    if (!editingLibrarian && !password.trim()) {
      setError('Password is required for new accounts.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingLibrarian;
      const url = isEdit ? \`/api/librarians/\${editingLibrarian.id}\` : '/api/librarians';
      const method = isEdit ? 'PUT' : 'POST';

      const bodyData: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      };
      
      if (password.trim()) {
        bodyData.password = password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccessToast(data.message || \`Librarian \${name} saved successfully!\`);
        setIsModalOpen(false);
        fetchLibrarians();
      } else {
        setError(data.error || \`Failed to \${isEdit ? 'update' : 'add'} librarian\`);
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (lib: LibrarianAccount) => {
    if (lib.id === 1) {
      alert('The master Teacher Access Pass account cannot be deleted.');
      return;
    }
    setDeletingLibrarian(lib);
  };

  const confirmDelete = async () => {
    if (!deletingLibrarian) return;
    try {
      const res = await fetch(\`/api/librarians/\${deletingLibrarian.id}\`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast(data.message || 'Librarian account removed');
        fetchLibrarians();
      } else {
        console.error(data.error || 'Failed to delete librarian');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingLibrarian(null);
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
          onClick={openAddModal}
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
                  <th className="px-6 py-3.5">Password</th>
                  <th className="px-6 py-3.5 text-right">Manage</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-blue-100">
                {librarians.map((lib) => {
                  const isMaster = lib.id === 1 || lib.name === 'Teacher Access' || lib.name === 'Teacher Access Pass' || lib.name === 'Admin Access';
                  const isPassShown = !!visiblePasswords[lib.id];
                  
                  return (
                    <tr key={lib.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={\`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs \${
                            isMaster ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800'
                          }\`}>
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
                        {lib.role === 'head_librarian' || isMaster ? (
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
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {isPassShown ? (lib.password || 'N/A') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTablePassword(lib.id)}
                            className="text-slate-400 hover:text-slate-700 transition"
                            title={isPassShown ? "Hide password" : "Show password"}
                          >
                            {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isMaster ? (
                            <>
                              <button
                                onClick={() => openEditModal(lib)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(lib)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] italic text-slate-400 px-2 font-bold bg-slate-100 rounded-md py-1">Protected Account</span>
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
      </div>

      {/* Add / Edit Librarian Modal (Using Student Modal UI style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                {editingLibrarian ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingLibrarian ? \`Edit Staff Details\` : 'Add New Librarian'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingLibrarian ? \`Update information for \${editingLibrarian.name}\` : 'Register a new library staff member'}
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSaveLibrarian} className="space-y-4 text-xs">
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingLibrarian ? 'Leave blank to keep current' : '...........'}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {!editingLibrarian && (
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
              )}
              
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-blue-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingLibrarian ? 'Update Account' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLibrarian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Librarian?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove the record for <span className="font-semibold text-slate-800">{deletingLibrarian.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingLibrarian(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Delete Librarian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', newCode);
console.log("Rewrite done!");
