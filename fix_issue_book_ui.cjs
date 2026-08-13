const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

const returnDaysSelectionLabel = '{/* Return Days Selection */}';
const copiesSelectionUI = `
          {/* Copies Selection for Teachers */}
          {selectedTeacherId && selectedBook && selectedBook.available_copies > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookPlus className="w-4 h-4 text-blue-600" />
                Number of Copies
              </label>
              <select
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                {Array.from({ length: Math.min(50, selectedBook.available_copies) }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Copy' : 'Copies'}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Return Days Selection */}`;

code = code.replace(returnDaysSelectionLabel, copiesSelectionUI);

fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
