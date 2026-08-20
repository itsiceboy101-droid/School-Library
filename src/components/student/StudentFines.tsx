import React, { useState, useEffect } from 'react';
import { Award, AlertCircle, ShieldCheck, Clock, ShieldAlert, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Student } from '../../types';

interface StudentFinesProps {
  student: Student;
}

export const StudentFines: React.FC<StudentFinesProps> = ({ student }) => {
  const [restriction, setRestriction] = useState<{
    is_restricted: boolean;
    reason: string | null;
    until_date: string | null;
    policy_note?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${student.id}/fines`);
      if (res.ok) {
        const data = await res.json();
        setRestriction(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [student.id]);

  const isRestricted = restriction ? restriction.is_restricted : false;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white border border-blue-200 rounded-2xl p-12 shadow-xs text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 border-t-transparent animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">Checking account standing & restrictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-8 shadow-xs text-center space-y-6">
        <div>
          {isRestricted ? (
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-3xl shadow-sm">
              <ShieldAlert className="w-10 h-10 text-rose-600" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isRestricted ? 'Borrowing Suspended (2-Week Ban Active)' : 'Fully Eligible to Borrow Books!'}
          </h2>

          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
            {isRestricted
              ? 'Your account is under a temporary 2-week borrowing restriction due to a late book return or unreturned overdue book.'
              : 'Your library card is in good standing. You are eligible to borrow any available book from the school library.'}
          </p>
        </div>

        {restriction && isRestricted && (
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-left text-xs space-y-2">
            <div className="font-bold text-rose-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              Restriction Details
            </div>
            <p className="text-rose-800 font-medium text-xs">{restriction.reason}</p>
            {restriction.until_date && (
              <p className="text-rose-900 font-bold text-xs pt-1 border-t border-rose-200">
                Borrowing Ban Ends: <span className="underline">{restriction.until_date}</span>
              </p>
            )}
          </div>
        )}

        <div className="p-5 rounded-xl bg-sky-50/80 border border-blue-200 text-left text-xs space-y-2.5 text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            School Library Borrowing & Penalty Policy
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <p className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Standard Return Period:</strong> Books must be returned within 14 days of issue.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>No Monetary Fines:</strong> Our school library does not charge cash fines.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>2-Week Suspension:</strong> If a book is returned late, the student cannot borrow any new books for <strong className="text-slate-900">exactly 2 weeks (14 days)</strong> from the date of return.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

