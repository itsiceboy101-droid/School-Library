import React, { useState } from 'react';
import { Search, BookPlus, ArrowDownLeft, Users, BookOpen, FileText, ArrowLeftRight, KeyRound, Mail, School, UserPlus } from 'lucide-react';
import { User as LibrarianUser, Student } from '../types';
import { StudentSearch } from './librarian/StudentSearch';
import { IssueBook } from './librarian/IssueBook';
import { ReturnBook } from './librarian/ReturnBook';
import { StudentsManager } from './librarian/StudentsManager';
import { TeachersManager } from './librarian/TeachersManager';
import { BooksManager } from './librarian/BooksManager';
import { ReportsManager } from './librarian/ReportsManager';
import { IssueCodeManager } from './librarian/IssueCodeManager';

import { DirectEmailModal } from './common/DirectEmailModal';

interface LibrarianDashboardProps {
  user: LibrarianUser;
  onSuccessToast: (msg: string) => void;
}

type TabType = 'search' | 'desk' | 'teachers' | 'students' | 'books' | 'reports';

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({ user, onSuccessToast }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [deskSubTab, setDeskSubTab] = useState<'issue' | 'return' | 'issue-codes'>('issue');
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openAddTeacher, setOpenAddTeacher] = useState(false);
  const [openAddStudent, setOpenAddStudent] = useState(false);

  const handleQuickIssue = (student: Student) => {
    setPreselectedStudent(student);
    setActiveTab('desk');
    setDeskSubTab('issue');
  };

  const handleAddTeacherClick = () => {
    setOpenAddTeacher(true);
    setActiveTab('teachers');
  };

  const handleAddStudentClick = () => {
    setOpenAddStudent(true);
    setActiveTab('students');
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'search', label: 'Search Student', icon: <Search className="w-4 h-4" /> },
    { id: 'desk', label: 'Issue & Return Desk', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'teachers', label: 'Teachers & Classes', icon: <School className="w-4 h-4" /> },
    { id: 'students', label: 'Students Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'books', label: 'Book Catalog', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Welcome, {user.name}</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Librarian</span>
          </h2>
          <p className="text-xs text-slate-500">Fast book lending, returns, student searches & automated email notifications.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOpenEmailModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            title="Auto-Send Gmail notifications in background"
          >
            <Mail className="w-4 h-4" />
            Auto-Email (Gmail)
          </button>

          <button
            onClick={handleAddTeacherClick}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
          >
            <School className="w-4 h-4" />
            + Add Teacher
          </button>

          <button
            onClick={handleAddStudentClick}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            + Add Student
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="bg-white border border-blue-200 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 shadow-xs">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setOpenAddTeacher(false);
                setOpenAddStudent(false);
              }}
              className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
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

      {/* Tab Content */}
      <div>
        {activeTab === 'search' && <StudentSearch onQuickIssue={handleQuickIssue} />}
        
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
                <BookPlus className="w-4 h-4 inline-block mr-1" />
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
                <ArrowDownLeft className="w-4 h-4 inline-block mr-1" />
                Return Book
              </button>
              <button
                onClick={() => setDeskSubTab('issue-codes')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition ${
                  deskSubTab === 'issue-codes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <KeyRound className="w-4 h-4 inline-block mr-1" />
                Issue Codes
              </button>
            </div>

            {deskSubTab === 'issue' && (
              <IssueBook
                preselectedStudent={preselectedStudent}
                onSuccessToast={onSuccessToast}
              />
            )}
            {deskSubTab === 'return' && <ReturnBook onSuccessToast={onSuccessToast} />}
            {deskSubTab === 'issue-codes' && <IssueCodeManager onSuccessToast={onSuccessToast} />}
            
          </div>
        )}

        {activeTab === 'teachers' && (
          <TeachersManager
            onSuccessToast={onSuccessToast}
            openAddModalInitially={openAddTeacher}
          />
        )}

        {activeTab === 'students' && (
          <StudentsManager
            onSuccessToast={onSuccessToast}
            openAddModalInitially={openAddStudent}
          />
        )}

        {activeTab === 'books' && <BooksManager onSuccessToast={onSuccessToast} />}
        {activeTab === 'reports' && <ReportsManager />}
      </div>

      <DirectEmailModal
        isOpen={openEmailModal}
        onClose={() => setOpenEmailModal(false)}
      />
    </div>
  );
};
