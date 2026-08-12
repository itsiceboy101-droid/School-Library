const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/TeachersManager.tsx', 'utf8');

// Replace state
code = code.replace(
  "const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);",
  "const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);\n  const [showEditModal, setShowEditModal] = useState(false);\n  const [editClass, setEditClass] = useState('');\n  const [editDivision, setEditDivision] = useState('');"
);

// Edit Logic
const editLogicOld = `
  const handleEditClick = (t: Teacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditUsername(t.username);
    setEditPassword(t.password || '');
  };
`;
const editLogicNew = `
  const handleEditClick = (t: Teacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditUsername(t.username);
    setEditPassword(t.password || '');
    setEditClass(t.assigned_class || '');
    setEditDivision(t.assigned_division || '');
    setShowEditModal(true);
  };
`;
code = code.replace(editLogicOld.trim(), editLogicNew.trim());

const saveLogicOld = `
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          username: editUsername,
          password: editPassword,
        }),
`;
const saveLogicNew = `
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          username: editUsername,
          password: editPassword,
          assigned_class: editClass || null,
          assigned_division: editDivision || null,
        }),
`;
code = code.replace(saveLogicOld.trim(), saveLogicNew.trim());

code = code.replace(
  "setEditingTeacher(null);",
  "setEditingTeacher(null);\n        setShowEditModal(false);"
);

// Restore the table row layout back from inline editing
const tableBodyMatch = code.match(/<tbody className="divide-y divide-blue-100 text-xs">[\s\S]*?<\/tbody>/);
if (tableBodyMatch) {
  const tableBodyStr = tableBodyMatch[0];
  const newTbody = `
              <tbody className="divide-y divide-blue-100 text-xs">
                  {teachers.map((t) => {
                    const hasClass = t.assigned_class && t.assigned_division;
                    const isPassShown = !!visiblePasswords[t.id];
                    
                    return (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-sm border border-blue-200">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div>{t.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">Staff ID #{t.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700 font-bold">
                          {t.username}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {t.email}
                        </td>
                        <td className="px-6 py-4">
                          {hasClass ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Class {t.assigned_class} - Div {t.assigned_division}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs">
                              Not Class Teacher
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {isPassShown ? (t.password || 'N/A') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTablePassword(t.id)}
                              className="text-slate-400 hover:text-slate-700 transition"
                              title={isPassShown ? "Hide password" : "Show password"}
                            >
                              {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
`;
  code = code.replace(tableBodyStr, newTbody.trim());
}

// Add Edit Modal JSX at the end of the return statement before the final closing tag
const editModalJSX = `
      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingTeacher(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Teacher Details
                </h3>
                <p className="text-xs text-slate-500">
                  Update information for {editingTeacher.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
                >
                  Update Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  /    <\/div>\s*<\/div>\s*$/g,
  editModalJSX + "\n    </div>\n  </div>"
);

fs.writeFileSync('src/components/librarian/TeachersManager.tsx', code);
