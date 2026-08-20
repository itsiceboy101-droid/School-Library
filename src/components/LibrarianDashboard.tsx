import React, { useState } from 'react';
import { Search, BookPlus, ArrowDownLeft, Users, BookOpen, FileText, ArrowLeftRight, KeyRound, Mail } from 'lucide-react';
import { User as LibrarianUser, Student } from '../types';
import { StudentSearch } from './librarian/StudentSearch';
import { IssueBook } from './librarian/IssueBook';
import { ReturnBook } from './librarian/ReturnBook';
import { StudentsManager } from './librarian/StudentsManager';
import { BooksManager } from './librarian/BooksManager';
import { ReportsManager } from './librarian/ReportsManager';
import { IssueCodeManager } from './librarian/IssueCodeManager';
import { DirectEmailModal } from './common/DirectEmailModal';

interface LibrarianDashboardProps {
  user: LibrarianUser;
  onSuccessToast: (msg: string) => void;
}

type TabType = 'search' | 'desk' | 'students' | 'books' | 'reports' | 'issue-codes';

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({ user, onSuccessToast }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [deskSubTab, setDeskSubTab] = useState<'issue' | 'return'>('issue');
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);
  const [openEmailModal, setOpenEmailModal] = useState(false);

  const handleQuickIssue = (student: Student) => {
    setPreselectedStudent(student);
    setActiveTab('desk');
    setDeskSubTab('issue');
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'search', label: 'Search Student', icon: <Search className="w-4 h-4" /> },
    { id: 'desk', label: 'Issue & Return Desk', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'issue-codes', label: '4-Digit Issue Codes', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'students', label: 'Students Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'books', label: 'Book Catalog', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Overdue', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white border border-blue-200 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Welcome, {user.name}</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Librarian</span>
          </h2>
          <p className="text-xs text-slate-500">Fast book lending, returns, student searches & automated email notifications.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenEmailModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
            title="Auto-Send Gmail notifications in background"
          >
            <Mail className="w-4 h-4" />
            Auto-Email (Gmail)
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
              onClick={() => setActiveTab(item.id)}
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
            <div className="flex items-center justify-center gap-2 bg-white border border-blue-200 p-1.5 rounded-2xl max-w-sm mx-auto shadow-xs">
              <button
                onClick={() => setDeskSubTab('issue')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  deskSubTab === 'issue'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookPlus className="w-4 h-4 inline-block mr-1" />
                Issue Book
              </button>
              <button
                onClick={() => setDeskSubTab('return')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  deskSubTab === 'return'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 inline-block mr-1" />
                Return Book
              </button>
            </div>
            {deskSubTab === 'issue' ? (
              <IssueBook
                preselectedStudent={preselectedStudent}
                onSuccessToast={onSuccessToast}
              />
            ) : (
              <ReturnBook onSuccessToast={onSuccessToast} />
            )}
          </div>
        )}
        {activeTab === 'issue-codes' && <IssueCodeManager onSuccessToast={onSuccessToast} />}
        {activeTab === 'students' && <StudentsManager onSuccessToast={onSuccessToast} />}
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
