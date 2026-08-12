const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/StudentsManager.tsx', 'utf8');

if (!code.includes('const CLASSES')) {
  code = code.replace(
    'export const StudentsManager',
    "const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];\nconst DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F'];\n\nexport const StudentsManager"
  );
}

// Replace class input
const classInputStr = `<input
                    type="text"
                    value={cls}
                    onChange={(e) => setCls(e.target.value.replace(/\\D/g, ''))}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />`;
const classSelectStr = `<select
                    value={cls}
                    onChange={(e) => setCls(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>`;

code = code.replace(classInputStr, classSelectStr);

// Replace division input
const divInputStr = `<input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="A"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 uppercase font-semibold"
                  />`;
const divSelectStr = `<select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- None --</option>
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>`;

code = code.replace(divInputStr, divSelectStr);

fs.writeFileSync('src/components/librarian/StudentsManager.tsx', code);
