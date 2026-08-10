import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Search, CreditCard, Lock, AlertCircle, X, Pencil, Eye, EyeOff } from 'lucide-react';
import { Student } from '../../types';

interface StudentsManagerProps {
  onSuccessToast: (msg: string) => void;
  openAddModalInitially?: boolean;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({ onSuccessToast, openAddModalInitially = false }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Table password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  useEffect(() => {
    if (openAddModalInitially) {
      setEditingStudent(null);
      setName('');
      setCls('');
      setDivision('');
      setRollNo('');
      setCardNo('');
      setPassword('');
      setIsModalOpen(true);
    }
  }, [openAddModalInitially]);

  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const [division, setDivision] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [password, setPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setCls('');
    setDivision('');
    setRollNo('');
    setCardNo('');
    setPassword('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setCls(student.class);
    setDivision(student.division);
    setRollNo(student.roll_no);
    setCardNo(student.library_card_no);
    setPassword(student.password || '');
    setError(null);
    setIsModalOpen(true);
  };

  const toggleTablePassword = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !cls.trim() || !division.trim() || !rollNo.trim() || !cardNo.trim() || !password.trim()) {
      setError('All student fields are required');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingStudent;
      const url = isEdit ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: cls.trim(),
          division: division.trim(),
          roll_no: rollNo.trim(),
          library_card_no: cardNo.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'add'} student`);
      } else {
        onSuccessToast(data.message || `Student ${name} (${cardNo}) saved successfully`);
        setIsModalOpen(false);
        setName('');
        setCls('');
        setDivision('');
        setRollNo('');
        setCardNo('');
        setPassword('');
        setEditingStudent(null);
        fetchStudents();
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setDeletingStudent(student);
  };

  const confirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      const res = await fetch(`/api/students/${deletingStudent.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast(`Student ${deletingStudent.name} removed`);
        fetchStudents();
      } else {
        console.error(data.error || 'Could not delete student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingStudent(null);
    }
  };

  const cancelDelete = () => {
    setDeletingStudent(null);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.library_card_no.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.class.toLowerCase().includes(searchFilter.toLowerCase())
  ).sort((a, b) => {
    const classA = parseInt(a.class, 10) || 0;
    const classB = parseInt(b.class, 10) || 0;
    if (classA !== classB) return classA - classB;

    const divA = (a.division || '').toUpperCase();
    const divB = (b.division || '').toUpperCase();
    if (divA !== divB) return divA.localeCompare(divB);

    const rollA = parseInt(a.roll_no, 10) || 0;
    const rollB = parseInt(b.roll_no, 10) || 0;
    return rollA - rollB;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Student Library Members ({students.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of all registered student accounts, credentials, and library cards
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by name or username..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No students found matching "{searchFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Username</th>
                  <th className="px-6 py-3.5">Class & Division</th>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Password</th>
                  <th className="px-6 py-3.5 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filteredStudents.map((s) => {
                  const isPassShown = !!visiblePasswords[s.id];
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        {s.name}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-semibold">
                          {s.library_card_no}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-700">
                        Class {s.class} (Div {s.division})
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">Roll #{s.roll_no}</td>
                      <td className="px-6 py-3.5">
                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {isPassShown ? (s.password || 'N/A') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTablePassword(s.id)}
                            className="text-slate-400 hover:text-slate-700 transition"
                            title={isPassShown ? "Hide password" : "Show password"}
                          >
                            {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                            title="Edit Student Information"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          {s.active_issues_count && s.active_issues_count > 0 ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs cursor-not-allowed"
                              title={`Cannot delete: ${s.active_issues_count} unreturned book(s)`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteClick(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
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
      </div>

      {/* Add / Edit Student Modal */}
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
                {editingStudent ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingStudent ? `Edit Student Details` : 'Add New Student'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStudent ? `Update information for ${editingStudent.name}` : 'Register a student and issue library card'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Das"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    value={cls}
                    onChange={(e) => setCls(e.target.value.replace(/\D/g, ''))}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="A"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll No
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={cardNo}
                    onChange={(e) => setCardNo(e.target.value.replace(/\s+/g, '-').toUpperCase())}
                    placeholder="e.g. STU-106"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 uppercase font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showModalPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="student123"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    title={showModalPassword ? "Hide password" : "Show password"}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingStudent ? 'Update Student' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Student?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove the record for <span className="font-semibold text-slate-800">{deletingStudent.name}</span>? This action cannot be undone.
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
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
