import React, { useState, useEffect } from 'react';
import { Search, UserCheck, BookPlus, RefreshCw, GraduationCap, AlertCircle } from 'lucide-react';
import { Student } from '../../types';

interface StudentSearchProps {
  onQuickIssue: (student: Student) => void;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({ onQuickIssue }) => {
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const [division, setDivision] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [card, setCard] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (cls) params.append('class', cls);
      if (division) params.append('division', division);
      if (rollNo) params.append('roll_no', rollNo);
      if (card) params.append('card', card);

      const res = await fetch(`/api/students/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearch();
  }, []);

  const handleReset = () => {
    setName('');
    setCls('');
    setDivision('');
    setRollNo('');
    setCard('');
    fetchSearch();
  };

  return (
    <div className="space-y-6">
      {/* Search Header Form Card */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Search Student Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any combination of details to locate student library records
            </p>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSearch();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3"
        >
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul"
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Class
            </label>
            <input
              type="text"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Division
            </label>
            <input
              type="text"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="e.g. A"
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Roll No
            </label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 15"
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Search className="w-3.5 h-3.5" />
              Search Records
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-blue-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Search Results ({students.length})
          </h3>
          {loading && <span className="text-xs text-blue-600 animate-pulse">Searching...</span>}
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            {searched ? 'No students matched your search criteria.' : 'Enter search terms above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Library Card</th>
                  <th className="px-6 py-3">Class & Division</th>
                  <th className="px-6 py-3">Roll No</th>
                  <th className="px-6 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      {student.name}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                        {student.library_card_no}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">
                      Class {student.class} - Div {student.division}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">#{student.roll_no}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => onQuickIssue(student)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 text-xs font-semibold transition"
                      >
                        <BookPlus className="w-3.5 h-3.5" />
                        Issue Book
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
