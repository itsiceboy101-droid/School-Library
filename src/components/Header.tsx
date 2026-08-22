import React from 'react';
import { BookOpen, User, LogOut, Shield, GraduationCap, RotateCcw, Sparkles, School } from 'lucide-react';
import { User as LibrarianUser, Student, Teacher } from '../types';

interface HeaderProps {
  userType: 'librarian' | 'student' | 'teacher' | null;
  currentUser: LibrarianUser | Student | Teacher | null;
  onLogout: () => void;
  onSwitchPortal: (role: 'librarian' | 'student') => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userType,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="bg-white text-slate-900 shadow-xs sticky top-0 z-40 border-b border-blue-200">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="truncate">School Library Portal</span>
              {userType === 'librarian' && (currentUser as LibrarianUser)?.role === 'head_librarian' && (
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                  Main Dashboard
                </span>
              )}
              {userType === 'librarian' && (currentUser as LibrarianUser)?.role !== 'head_librarian' && (
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  Librarian Portal
                </span>
              )}
              {userType === 'teacher' && (
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1">
                  <School className="w-3 h-3 text-emerald-600" />
                  Teacher Portal
                </span>
              )}
              {userType === 'student' && (
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  Student Portal
                </span>
              )}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">
              {userType === 'librarian' && (currentUser as LibrarianUser)?.role === 'head_librarian'
                ? 'Central Head Analytics & Staff Control'
                : userType === 'librarian'
                ? 'Catalog Management & Issue Desk'
                : userType === 'teacher'
                ? 'Class Student Roster & Catalog Search'
                : userType === 'student'
                ? 'My Borrowed Books & Account Status'
                : 'Central School Library System'}
            </p>
          </div>
        </div>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser && (
            <div className="flex items-center gap-3 pl-3 border-l border-blue-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    userType === 'librarian'
                      ? 'bg-blue-600 text-white'
                      : userType === 'teacher'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-sky-600 text-white'
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {userType === 'librarian'
                      ? (currentUser as LibrarianUser).email
                      : userType === 'teacher'
                      ? `ID: ${(currentUser as Teacher).username} ${(currentUser as Teacher).assigned_class ? `| Class ${(currentUser as Teacher).assigned_class}-${(currentUser as Teacher).assigned_division}` : ''}`
                      : `Username: ${(currentUser as Student).library_card_no} | Class ${(currentUser as Student).class}-${(currentUser as Student).division}`}
                  </div>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-blue-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

