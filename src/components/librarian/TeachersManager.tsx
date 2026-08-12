import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, UserCheck, AlertCircle, Sparkles, Eye, EyeOff, School, CheckCircle2, RefreshCw, Pencil, Save, X } from 'lucide-react';
import { Teacher } from '../../types';

interface TeachersManagerProps {
  onSuccessToast: (msg: string) => void;
}

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const TeachersManager: React.FC<TeachersManagerProps> = ({ onSuccessToast }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'classes'>('list');

  // Add Teacher Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const toggleTablePassword = (id: number) => setVisiblePasswords(prev => ({...prev, [id]: !prev[id]}));
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [assignedClass, setAssignedClass] = useState('');
  const [assignedDivision, setAssignedDivision] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClass, setEditClass] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Selected class for Class Matrix
  const [filterClass, setFilterClass] = useState('9');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields (Name, Username, Email, Password)');
      return;
    }

    if (!email.trim().toLowerCase().endsWith('@podar.org')) {
      setError('Teacher email must be a valid @podar.org address.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          assigned_class: assignedClass || null,
          assigned_division: assignedClass ? assignedDivision : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create teacher');
      } else {
        onSuccessToast(`Teacher ${name} registered successfully!`);
        setShowAddModal(false);
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setAssignedClass('');
        fetchTeachers();
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setSubmitLoading(false);
    }
  };

  
  const handleEditClick = (t: Teacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditUsername(t.username);
    setEditPassword(t.password || '');
    setEditClass(t.assigned_class || '');
    setEditDivision(t.assigned_division || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          username: editUsername,
          password: editPassword,
          assigned_class: editClass || null,
          assigned_division: editDivision || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast('Teacher info updated');
        setEditingTeacher(null);
        setShowEditModal(false);
        fetchTeachers();
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating teacher');
    }
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setDeletingTeacher(teacher);
  };

  const confirmDelete = async () => {
    if (!deletingTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${deletingTeacher.id}`, { method: 'DELETE' });
      if (res.ok) {
        onSuccessToast(`Teacher ${deletingTeacher.name} deleted`);
        fetchTeachers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete teacher');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingTeacher(null);
    }
  };

  const cancelDelete = () => {
    setDeletingTeacher(null);
  };

  const handleAssignClassTeacher = async (cls: string, div: string, teacherId: string) => {
    try {
      const res = await fetch('/api/teachers/assign-class-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: cls,
          division: div,
          teacher_id: teacherId || null,
        }),
      });

      if (res.ok) {
        onSuccessToast(`Updated Class Teacher for Class ${cls}-${div}`);
        fetchTeachers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign class teacher');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-blue-200 rounded-2xl p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" />
            Teacher & Class Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Register teachers, assign class teachers for each class, and manage portal access credentials
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeachers}
            className="p-2.5 rounded-xl border border-blue-200 text-slate-600 hover:bg-blue-50 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Add New Teacher
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-blue-200 gap-2">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Teachers Directory ({teachers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'classes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          Class Teacher Assignments (Classes 1 - 12)
        </button>
      </div>

      {/* Sub-Tab 1: Teachers Directory */}
      {activeSubTab === 'list' && (
        <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
          {teachers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <School className="w-10 h-10 mx-auto text-blue-300" />
              <p className="text-sm font-semibold">No teachers registered yet</p>
              <p className="text-xs text-slate-400">Click "Add New Teacher" above to register staff members.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                  <tr>
                    <th className="px-6 py-3.5">Teacher Name</th>
                    <th className="px-6 py-3.5">Username / ID</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Assigned Class</th>
                    <th className="px-6 py-3.5">Password</th>
                  <th className="px-6 py-3.5 text-right">Manage</th>
                  </tr>
                </thead>
                
              <tbody className="divide-y divide-blue-100 text-xs">
                  {teachers.map((t) => {
                    const hasClass = t.assigned_class && t.assigned_division;
                    const isPassShown = !!visiblePasswords[t.id];
                    
                    return (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-sm border border-blue-200">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div>{t.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">Staff ID #{t.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700 font-bold">
                          {t.username}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {t.email}
                        </td>
                        <td className="px-6 py-4">
                          {hasClass ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Class {t.assigned_class} - Div {t.assigned_division}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs">
                              Not Class Teacher
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {isPassShown ? (t.password || 'N/A') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTablePassword(t.id)}
                              className="text-slate-400 hover:text-slate-700 transition"
                              title={isPassShown ? "Hide password" : "Show password"}
                            >
                              {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
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
      )}

      {/* Sub-Tab 2: Class Teacher Assignments Matrix */}
      {activeSubTab === 'classes' && (
        <div className="space-y-6">
          {/* Class Filter Selector */}
          <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Filter Class:</span>
            <div className="flex flex-wrap gap-1.5">
              {CLASSES.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filterClass === cls
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Divisions Matrix for Selected Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIVISIONS.map((div) => {
              const currentTeacher = teachers.find(
                (t) => t.assigned_class === filterClass && t.assigned_division === div
              );

              return (
                <div
                  key={div}
                  className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-xs">
                        {filterClass}{div}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Class {filterClass} - Division {div}</h4>
                        <p className="text-[11px] text-slate-500">Assign a Class Teacher for this section</p>
                      </div>
                    </div>

                    {currentTeacher ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                        Assigned
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                        Vacant
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Class Teacher:
                    </label>
                    <select
                      value={currentTeacher ? currentTeacher.id : ''}
                      onChange={(e) => handleAssignClassTeacher(filterClass, div, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- No Class Teacher Assigned --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.username}) {t.assigned_class ? `[Curr: ${t.assigned_class}-${t.assigned_division}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Register New Teacher Account
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

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Teacher Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mrs. Sunita Sharma"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username / Portal Login ID *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toUpperCase())}
                  placeholder="e.g. TEACHER101"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Portal Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Pass@123"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 pr-10 font-mono"
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

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Class (Optional)
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Division
                  </label>
                  <select
                    value={assignedDivision}
                    onChange={(e) => setAssignedDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {DIVISIONS.map((div) => (
                      <option key={div} value={div}>Division {div}</option>
                    ))}
                  </select>
                </div>
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
                  {submitLoading ? 'Registering...' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Edit Teacher Details
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm mb-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Login Password</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Class</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Division</label>
                  <select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                Update Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Teacher?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove the record for <span className="font-semibold text-slate-800">{deletingTeacher.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Delete Teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
