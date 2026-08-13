const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/ReportsManager.tsx', 'utf8');

// Add edit states
code = code.replace(
  'const [loading, setLoading] = useState(false);',
  `const [loading, setLoading] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);`
);

// Add handleEdit function
const fetchReportsStr = `  const fetchReports = async () => {`;
const handleEditStr = `
  const handleEditClick = (item: any) => {
    setEditingIssue(item);
    setNewDueDate(item.due_date);
  };

  const handleSaveEdit = async () => {
    if (!editingIssue) return;
    setSavingEdit(true);
    try {
      const res = await fetch(\`/api/issue/\${editingIssue.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: newDueDate })
      });
      if (res.ok) {
        setEditingIssue(null);
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchReports = async () => {`;
code = code.replace(fetchReportsStr, handleEditStr);

// Add Actions column header
code = code.replace(
  '<th className="px-6 py-3.5 text-right">Penalty Status</th>',
  `<th className="px-6 py-3.5 text-right">Penalty Status</th>
                  <th className="px-6 py-3.5 text-right print:hidden">Action</th>`
);

// Add Action cell
const penaltyCellStr = `<td className="px-6 py-4 text-right font-bold text-rose-600 text-xs">
                      2-Week Ban Pending Return
                    </td>
                  </tr>`;
const actionCellStr = `<td className="px-6 py-4 text-right font-bold text-rose-600 text-xs">
                      2-Week Ban Pending Return
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Edit Due Date
                      </button>
                    </td>
                  </tr>`;
code = code.replace(penaltyCellStr, actionCellStr);

// Add the modal
const modalStr = `
      {/* Edit Due Date Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Edit Due Date</h3>
            <p className="text-xs text-slate-500 mb-4">
              Update the return deadline for <span className="font-semibold text-slate-700">{editingIssue.book_title}</span>.
            </p>
            
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Due Date</label>
            <input 
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-6 font-medium"
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingIssue(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

code = code.replace(/<\/div>\s*<\/div>\s*\);\s*};\s*$/, modalStr);

fs.writeFileSync('src/components/librarian/ReportsManager.tsx', code);
