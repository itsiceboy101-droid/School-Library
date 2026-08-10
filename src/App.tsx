import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { MainDashboard } from './components/MainDashboard';
import { LibrarianDashboard } from './components/LibrarianDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Toast } from './components/Toast';
import { User as LibrarianUser, Student } from './types';

export default function App() {
  const [userType, setUserType] = useState<'librarian' | 'student' | null>(null);
  const [currentUser, setCurrentUser] = useState<LibrarianUser | Student | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleLogout = () => {
    setUserType(null);
    setCurrentUser(null);
    showToast('Logged out successfully');
  };

  const handleLoginLibrarian = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login-librarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUserType('librarian');
        setCurrentUser(data.user);
        showToast(`Welcome back, ${data.user.name}`);
        return { success: true };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server error' };
    }
  };

  const handleSignupLibrarian = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/signup-librarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUserType('librarian');
        setCurrentUser(data.user);
        showToast(`Account created! Welcome, ${data.user.name}`);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server error' };
    }
  };

  const handleLoginStudent = async (cardNo: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_no: cardNo, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUserType('student');
        setCurrentUser(data.user);
        showToast(`Welcome, ${data.user.name}`);
        return { success: true };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server error' };
    }
  };

  const handleQuickLogin = async (role: 'librarian' | 'student', idOrEmail?: string) => {
    if (role === 'librarian') {
      const email = idOrEmail || 'admin@school.com';
      await handleLoginLibrarian(email, 'password123');
    } else {
      const card = idOrEmail || 'STU101';
      await handleLoginStudent(card, 'student123');
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        showToast('All database records cleared successfully');
        setUserType(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50/50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Header
        userType={userType}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchPortal={(role) => {
          setUserType(null);
          setCurrentUser(null);
        }}
        onQuickLogin={handleQuickLogin}
        onResetDemo={handleResetDemo}
      />

      <main className="flex-1">
        {!currentUser ? (
          <LoginModal
            initialRole="librarian"
            onLoginLibrarian={handleLoginLibrarian}
            onLoginStudent={handleLoginStudent}
          />
        ) : userType === 'librarian' ? (
          (currentUser as LibrarianUser).role === 'head_librarian' ? (
            <MainDashboard
              user={currentUser as LibrarianUser}
              onSuccessToast={showToast}
            />
          ) : (
            <LibrarianDashboard
              user={currentUser as LibrarianUser}
              onSuccessToast={showToast}
            />
          )
        ) : (
          <StudentDashboard student={currentUser as Student} />
        )}
      </main>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <footer className="bg-white border-t border-blue-200 py-6 text-center text-xs text-slate-500">
        <p>School Library Portal • Central Library Management System</p>
      </footer>
    </div>
  );
}
