import React, { useState } from 'react';
import { Shield, GraduationCap, Lock, Mail, CreditCard, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  initialRole?: 'librarian' | 'student';
  onLoginLibrarian: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onLoginStudent: (cardNo: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  initialRole = 'librarian',
  onLoginLibrarian,
  onLoginStudent,
}) => {
  const [platform, setPlatform] = useState<'librarian' | 'student'>(
    initialRole === 'student' ? 'student' : 'librarian'
  );

  // Form states
  const [emailOrPass, setEmailOrPass] = useState('');
  const [password, setPassword] = useState('');
  const [cardNo, setCardNo] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (target: 'librarian' | 'student') => {
    setPlatform(target);
    setError(null);
    setEmailOrPass('');
    setPassword('');
    setCardNo('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (platform === 'librarian') {
        if (!emailOrPass || !password) {
          setError('Please enter Username/Email and Password');
          setLoading(false);
          return;
        }
        const res = await onLoginLibrarian(emailOrPass, password);
        if (!res.success) setError(res.error || 'Invalid staff credentials');
      } else {
        if (!cardNo || !password) {
          setError('Please enter username and password');
          setLoading(false);
          return;
        }
        const res = await onLoginStudent(cardNo, password);
        if (!res.success) setError(res.error || 'Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xs border border-blue-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* 2 Platform Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-sky-50/70 border-b border-blue-200 text-center gap-1.5">
          <button
            id="tab-librarian"
            type="button"
            onClick={() => handleTabChange('librarian')}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              platform === 'librarian'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            Librarian & Teacher Portal
          </button>
          <button
            id="tab-student"
            type="button"
            onClick={() => handleTabChange('student')}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              platform === 'student'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Portal
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-sm ${
                platform === 'librarian'
                  ? 'bg-blue-100/70 text-blue-700 border border-blue-200/60'
                  : 'bg-emerald-100/70 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              {platform === 'librarian' ? (
                <Shield className="w-7 h-7" />
              ) : (
                <GraduationCap className="w-7 h-7" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {platform === 'librarian' ? 'Librarian & Teacher Login' : 'Student Portal Access'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {platform === 'librarian'
                ? 'Sign in with your @podar.org email or username to access the system'
                : 'Enter your student username to view active borrowings and account status'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {platform === 'librarian' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username/Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400/80 absolute left-3 top-3" />
                  <input
                    id="input-librarian-email"
                    type="text"
                    value={emailOrPass}
                    onChange={(e) => setEmailOrPass(e.target.value)}
                    placeholder="@podar.org email or username"
                    className="w-full pl-9 pr-3 py-2.5 bg-white/80 border border-blue-200 rounded-xl text-sm text-slate-800 placeholder-slate-400/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400/80 absolute left-3 top-3" />
                  <input
                    id="input-student-card"
                    type="text"
                    value={cardNo}
                    onChange={(e) => setCardNo(e.target.value.replace(/\s+/g, '-').toUpperCase())}
                    placeholder="e.g. STU101"
                    className="w-full pl-9 pr-3 py-2.5 bg-white/80 border border-blue-200 rounded-xl text-sm text-slate-800 placeholder-slate-400/60 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 uppercase font-semibold"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400/80 absolute left-3 top-3" />
                <input
                  id="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-white/80 border border-blue-200 rounded-xl text-sm text-slate-800 placeholder-slate-400/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  id="btn-toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
                platform === 'librarian'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading
                ? 'Authenticating...'
                : platform === 'librarian'
                ? 'Sign In to Library Desk'
                : 'Access Student Account'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
