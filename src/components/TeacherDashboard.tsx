import React, { useState, useEffect } from 'react';
import { School, UserPlus, Users, Search, AlertCircle, BookOpen, Key, Eye, EyeOff, ShieldAlert, CheckCircle2, RefreshCw, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { Teacher, Student } from '../types';
import { CatalogSearch } from './student/CatalogSearch';
import { BookMarked, History } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

interface TeacherDashboardProps {
  teacher: Teacher;
  onSuccessToast: (msg: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacher, onSuccessToast }) => {
  const [activeTab, setActiveTab] = useState<'class' | 'catalog' | 'myBooks' | 'history'>('class');

  const [students, setStudents] = useState<Student[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const groupedActiveBooks = React.useMemo(() => {
    const groups: Record<string, any> = {};
    borrowedBooks.filter(b => b.status !== 'returned').forEach(item => {
      const key = `${item.book_id}-${item.issue_date}-${item.due_date}`;
      if (!groups[key]) {
        groups[key] = { ...item, copies: 1, copy_ids: [item.id] };
      } else {
        groups[key].copies += 1;
        groups[key].copy_ids.push(item.id);
      }
    });
    return Object.values(groups);
  }, [borrowedBooks]);
  
  const groupedReturnedBooks = React.useMemo(() => {
    const groups: Record<string, any> = {};
    borrowedBooks.filter(b => b.status === 'returned').forEach(item => {
      const key = `${item.book_id}-${item.issue_date}-${item.return_date}`;
      if (!groups[key]) {
        groups[key] = { ...item, copies: 1, copy_ids: [item.id] };
      } else {
        groups[key].copies += 1;
        groups[key].copy_ids.push(item.id);
      }
    });
    return Object.values(groups);
  }, [borrowedBooks]);

  const [searchTerm, setSearchTerm] = useState('');

  // Add student modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [password, setPassword] = useState('Pass@123');
  const [showPassword, setShowPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

  const isClassTeacher = Boolean(teacher.assigned_class && teacher.assigned_division);

  const toggleTablePassword = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setRollNo('');
    setCardNo('');
    setPassword('');
    setError(null);
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setRollNo(student.roll_no);
    setCardNo(student.library_card_no);
    setPassword(student.password || '');
    setError(null);
    setShowAddModal(true);
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
        fetchClassStudents();
      } else {
        console.error(data.error || 'Could not delete student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingStudent(null);
    }
  };

  const fetchBorrowedBooks = async () => {
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/books`);
      if (res.ok) {
        const data = await res.json();
        setBorrowedBooks(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassStudents = async () => {
    if (!isClassTeacher) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassStudents();
    fetchBorrowedBooks();
  }, [teacher.id, isClassTeacher]);

  

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !rollNo.trim() || !cardNo.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const finalRollNo = rollNo.trim().length === 1 ? '0' + rollNo.trim() : rollNo.trim();
    setAddLoading(true);

    try {
      const isEdit = !!editingStudent;
      const url = isEdit ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: teacher.assigned_class,
          division: teacher.assigned_division,
          roll_no: finalRollNo,
          library_card_no: cardNo.trim().toUpperCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'add'} student`);
      } else {
        onSuccessToast(`Student ${name} ${isEdit ? 'updated' : 'added'} successfully!`);
        setShowAddModal(false);
        setName('');
        setRollNo('');
        setCardNo('');
        setPassword('Pass@123');
        setEditingStudent(null);
        fetchClassStudents();
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setAddLoading(false);
    }
  };

    const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.library_card_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_no.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Teacher Profile Header Banner */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-blue-500/20">
            {teacher.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Welcome, {teacher.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                Teacher ID: {teacher.username}
              </span>
              <span>Email: {teacher.email}</span>
            </p>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
          <School className="w-5 h-5 text-sky-600" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Class Assigned</span>
            <span className="font-bold text-slate-900 text-sm">
              {isClassTeacher ? `Class ${teacher.assigned_class} - Division ${teacher.assigned_division}` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-white border border-blue-200 p-1.5 rounded-2xl flex items-center gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('class')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'class'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <Users className="w-4 h-4" />
          My Class Students
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Search Book Catalog
        </button>

        <button
          onClick={() => setActiveTab('myBooks')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'myBooks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          My Borrowed Books
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <History className="w-4 h-4" />
          Borrowing History
        </button>
      </nav>


      {/* Tab 1: My Class Students */}
      {activeTab === 'class' && (
        <div>
          {!isClassTeacher ? (
            /* Not a Class Teacher Notice */
            <div className="bg-white border border-amber-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  You are not a class teacher
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  You are currently registered in the system but have not been assigned to a specific class.
                  Please contact the Head Librarian to assign you as a Class Teacher to manage students.
                </p>
              </div>
            </div>
          ) : (
            /* Class Teacher Active Area */
            <div className="space-y-6">
              {/* Header and Add Student Action */}
              <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Class {teacher.assigned_class} - Division {teacher.assigned_division} Roster
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage students registered under your class section
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search student or roll no..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Student
                  </button>
                </div>
              </div>

              {/* Student Table */}
              <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-xs font-semibold text-slate-500 animate-pulse">Fetching class student roster...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-blue-300" />
                    <p className="text-sm font-semibold">No students found in Class {teacher.assigned_class}-{teacher.assigned_division}</p>
                    <p className="text-xs text-slate-400">Click "Add Student" to register students to your class.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                        <tr>
                          <th className="px-6 py-3.5">Roll No</th>
                          <th className="px-6 py-3.5">Student Name</th>
                          <th className="px-6 py-3.5">Username / Card No</th>
                          <th className="px-6 py-3.5">Password</th>
                          <th className="px-6 py-3.5">Class Section</th>
                          <th className="px-6 py-3.5 text-right">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100 text-xs">
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-blue-50/50 transition">
                            <td className="px-6 py-4 font-bold text-blue-900 font-mono">
                              Roll #{s.roll_no}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              {s.name}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-700">
                              {s.library_card_no}
                            </td>
                            <td className="px-6 py-4">
                              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <span className="font-mono text-xs font-semibold text-slate-800">
                                  {visiblePasswords[s.id] ? (s.password || 'N/A') : '••••••••'}
                                </span>
                                <button
                                  onClick={() => toggleTablePassword(s.id)}
                                  className="text-slate-400 hover:text-slate-700 transition"
                                >
                                  {visiblePasswords[s.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                {s.class}-{s.division}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
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
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                )}
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
        </div>
      )}

      {/* Tab 2: Book Catalog */}
      {activeTab === 'catalog' && (
        <CatalogSearch />
      )}
      {activeTab === 'myBooks' && (
        <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading your borrowed books...</p>
            </div>
          ) : borrowedBooks.filter(b => b.status !== 'returned').length === 0 ? (
            <div className="p-12 text-center text-slate-500 shadow-sm">
              <BookMarked className="w-12 h-12 mx-auto text-blue-200 mb-4" />
              <p className="font-semibold">No books currently borrowed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                  <tr>
                    <th className="px-6 py-3.5">Book Title</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 text-xs">
                  {groupedActiveBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {b.book_title}
                        <div className="text-[11px] text-slate-500 font-normal">{b.book_author}</div>
                        {b.copies > 1 && (
                          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            {b.copies} Copies
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(b.issue_date)}</td>
                      <td className="px-6 py-4 font-mono text-slate-700 font-semibold">{formatDate(b.due_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'overdue' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === 'history' && (
        <div className="bg-white border border-blue-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading borrowing history...</p>
            </div>
          ) : borrowedBooks.filter(b => b.status === 'returned').length === 0 ? (
            <div className="p-12 text-center text-slate-500 shadow-sm">
              <History className="w-12 h-12 mx-auto text-blue-200 mb-4" />
              <p className="font-semibold">No borrowing history available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Book Title</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Return Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {groupedReturnedBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {b.book_title}
                        <div className="text-[11px] text-slate-500 font-normal">{b.book_author}</div>
                        {b.copies > 1 && (
                          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            {b.copies} Copies
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(b.issue_date)}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{b.return_date ? formatDate(b.return_date) : '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
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
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingStudent ? <Pencil className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                {editingStudent ? 'Edit Student Details' : `Add Student to Class ${teacher.assigned_class}-${teacher.assigned_division}`}
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

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Roll No *
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => {
                      if (rollNo.length === 1) setRollNo('0' + rollNo);
                    }}
                    placeholder="e.g. 03"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username / Card No *
                  </label>
                  <input
                    type="text"
                    value={cardNo}
                    onChange={(e) => setCardNo(e.target.value.replace(/\s+/g, '-').toUpperCase())}
                    placeholder="e.g. STU-009"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Student Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-800 pr-10 font-mono focus:outline-none focus:border-blue-500"
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

              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-center justify-between text-slate-700">
                <span className="font-semibold">Target Section:</span>
                <span className="font-bold text-blue-900">
                  Class {teacher.assigned_class} - Division {teacher.assigned_division}
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-blue-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {addLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  {addLoading ? 'Saving...' : (editingStudent ? 'Save Changes' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Student?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingStudent.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingStudent(null)}
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

