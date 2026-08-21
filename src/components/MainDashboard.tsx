import React, { useState } from 'react';
import { BarChart3, ShieldCheck, Users, BookOpen, ArrowLeftRight, UserPlus, Sparkles, School, KeyRound, Mail } from 'lucide-react';
import { User as LibrarianUser, Student } from '../types';
import { ReportsManager } from './librarian/ReportsManager';
import { LibrariansManager } from './librarian/LibrariansManager';
import { StudentsManager } from './librarian/StudentsManager';
import { TeachersManager } from './librarian/TeachersManager';
import { BooksManager } from './librarian/BooksManager';
import { IssueBook } from './librarian/IssueBook';
import { ReturnBook } from './librarian/ReturnBook';
import { IssueCodeManager } from './librarian/IssueCodeManager';
import { DirectEmailModal } from './common/DirectEmailModal';

interface MainDashboardProps {
  user: LibrarianUser;
  onSuccessToast: (msg: string) => void;
}

type MainTab = 'analytics' | 'teachers' | 'librarians' | 'students' | 'books' | 'desk';

export const MainDashboard: React.FC<MainDashboardProps> = ({ user, onSuccessToast }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('analytics');
  const [openAddLibrarian, setOpenAddLibrarian] = useState(false);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openAddTeacher, setOpenAddTeacher] = useState(false);
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [deskSubTab, setDeskSubTab] = useState<'issue' | 'return' | 'issue-codes'>('issue');

  const handleAddTeacherClick = () => {
    setOpenAddTeacher(true);
    setActiveTab('teachers');
  };

  const handleAddLibrarianClick = () => {
    setOpenAddLibrarian(true);
    setActiveTab('librarians');
  };

  const handleAddStudentClick = () => {
    setOpenAddStudent(true);
    setActiveTab('students');
  };

  const navItems: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Full Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'teachers', label: 'Teachers & Classes', icon: <School className="w-4 h-4" /> },
    { id: 'librarians', label: 'Manage Librarians', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'students', label: 'Student Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'books', label: 'Book Catalog', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'desk', label: 'Issue & Return Desk', icon: <ArrowLeftRight className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Main Dashboard Title Banner & Quick Action Buttons */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Master Admin
            </span>
            <span className="text-xs font-mono text-slate-400">
              {user.email || 'Teacher Access'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Main Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central Head Librarian platform with system-wide analytics, staff management, and student oversight.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setOpenEmailModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
            title="Auto-Send Gmail notifications in background"
          >
            <Mail className="w-4 h-4" />
            Auto-Email (Gmail)
          </button>

          <button
            onClick={handleAddTeacherClick}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition flex items-center gap-2"
          >
            <School className="w-4 h-4" />
            + Add Teacher
          </button>

          <button
            onClick={handleAddLibrarianClick}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            + Add Librarian
          </button>

          <button
            onClick={handleAddStudentClick}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            + Add Student
          </button>
        </div>
      </div>

      {/* Main Dashboard Navigation Bar */}
      <nav className="bg-white border border-blue-200 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 shadow-xs">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setOpenAddLibrarian(false);
                setOpenAddStudent(false);
                setOpenAddTeacher(false);
              }}
              className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Views */}
      <div>
        {activeTab === 'analytics' && <ReportsManager />}

        {activeTab === 'teachers' && (
          <TeachersManager
            onSuccessToast={onSuccessToast}
            openAddModalInitially={openAddTeacher}
          />
        )}

        {activeTab === 'librarians' && (
          <LibrariansManager
            onSuccessToast={onSuccessToast}
            openAddModalInitially={openAddLibrarian}
          />
        )}

        {activeTab === 'students' && (
          <StudentsManager
            onSuccessToast={onSuccessToast}
            openAddModalInitially={openAddStudent}
          />
        )}

        {activeTab === 'books' && <BooksManager onSuccessToast={onSuccessToast} />}

        {activeTab === 'desk' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 bg-white border border-blue-200 p-1.5 rounded-2xl max-w-lg mx-auto shadow-xs flex-wrap">
              <button
                onClick={() => setDeskSubTab('issue')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition ${
                  deskSubTab === 'issue'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Issue Book
              </button>
              <button
                onClick={() => setDeskSubTab('return')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition ${
                  deskSubTab === 'return'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Return Book
              </button>
              <button
                onClick={() => setDeskSubTab('issue-codes')}
                className={`flex-1 min-w-[140px] py-2 rounded-xl text-xs font-bold transition ${
                  deskSubTab === 'issue-codes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                4-Digit Issue Codes
              </button>
            </div>

            {deskSubTab === 'issue' && <IssueBook onSuccessToast={onSuccessToast} />}
            {deskSubTab === 'return' && <ReturnBook onSuccessToast={onSuccessToast} />}
            {deskSubTab === 'issue-codes' && <IssueCodeManager onSuccessToast={onSuccessToast} />}
          </div>
        )}
      </div>

      <DirectEmailModal
        isOpen={openEmailModal}
        onClose={() => setOpenEmailModal(false)}
      />
    </div>
  );
};
