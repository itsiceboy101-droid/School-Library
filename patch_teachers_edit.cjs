const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/TeachersManager.tsx', 'utf8');

const classInputStr = `<input
                    type="text"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />`;
const classSelectStr = `<select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>`;
code = code.replace(classInputStr, classSelectStr);

const divInputStr = `<input
                    type="text"
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 uppercase"
                  />`;
const divSelectStr = `<select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- None --</option>
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>`;
code = code.replace(divInputStr, divSelectStr);

fs.writeFileSync('src/components/librarian/TeachersManager.tsx', code);
