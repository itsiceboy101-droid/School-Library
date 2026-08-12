import React, { useState } from 'react';
import { BookOpen, History, DollarSign, Search } from 'lucide-react';
import { Student } from '../types';
import { MyBooks } from './student/MyBooks';
import { BorrowingHistory } from './student/BorrowingHistory';
import { StudentFines } from './student/StudentFines';
import { CatalogSearch } from './student/CatalogSearch';

interface StudentDashboardProps {
  student: Student;
}

type StudentTab = 'myBooks' | 'history' | 'fines' | 'catalog';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student }) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('myBooks');

  const navItems: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'myBooks', label: 'My Borrowed Books', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'history', label: 'Borrowing History', icon: <History className="w-4 h-4" /> },
    { id: 'fines', label: 'Fines & Account', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'catalog', label: 'Search Catalog', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Welcome Header Card */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-500/20">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Welcome, {student.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Username: {student.library_card_no}
              </span>
              <span>Class {student.class} - Div {student.division}</span>
              <span>• Roll #{student.roll_no}</span>
            </p>
          </div>
        </div>

        <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl px-4 py-2.5 text-xs">
          <span className="text-slate-500 block font-medium">Class Teacher</span>
          <span className="font-bold text-blue-900 text-sm">
            {student.class_teacher_name || 'Not Assigned'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-white border border-blue-200 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 shadow-xs">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
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

      {/* Content */}
      <div>
        {activeTab === 'myBooks' && <MyBooks student={student} />}
        {activeTab === 'history' && <BorrowingHistory student={student} />}
        {activeTab === 'fines' && <StudentFines student={student} />}
        {activeTab === 'catalog' && <CatalogSearch />}
      </div>
    </div>
  );
};
