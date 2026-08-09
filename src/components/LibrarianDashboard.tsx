import React, { useState } from 'react';
import { Search, BookPlus, ArrowDownLeft, Users, BookOpen, FileText } from 'lucide-react';
import { User as LibrarianUser, Student } from '../types';
import { StudentSearch } from './librarian/StudentSearch';
import { IssueBook } from './librarian/IssueBook';
import { ReturnBook } from './librarian/ReturnBook';
import { StudentsManager } from './librarian/StudentsManager';
import { BooksManager } from './librarian/BooksManager';
import { ReportsManager } from './librarian/ReportsManager';

interface LibrarianDashboardProps {
  user: LibrarianUser;
  onSuccessToast: (msg: string) => void;
}

type TabType = 'search' | 'issue' | 'return' | 'students' | 'books' | 'reports';

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({ user, onSuccessToast }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);

  const handleQuickIssue = (student: Student) => {
    setPreselectedStudent(student);
    setActiveTab('issue');
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'search', label: 'Search Student', icon: <Search className="w-4 h-4" /> },
    { id: 'issue', label: 'Issue Book', icon: <BookPlus className="w-4 h-4" /> },
    { id: 'return', label: 'Return Book', icon: <ArrowDownLeft className="w-4 h-4" /> },
    { id: 'students', label: 'Students Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'books', label: 'Book Catalog', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
        {activeTab === 'issue' && (
          <IssueBook
            preselectedStudent={preselectedStudent}
            onSuccessToast={onSuccessToast}
          />
        )}
        {activeTab === 'return' && <ReturnBook onSuccessToast={onSuccessToast} />}
        {activeTab === 'students' && <StudentsManager onSuccessToast={onSuccessToast} />}
        {activeTab === 'books' && <BooksManager onSuccessToast={onSuccessToast} />}
        {activeTab === 'reports' && <ReportsManager />}
      </div>
    </div>
  );
};
