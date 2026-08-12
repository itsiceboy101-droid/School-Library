const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

// Replace handleEditClick
const oldHandleEdit = `  const handleEditClick = (lib: LibrarianAccount) => {
    setEditingLibrarian(lib);
    setEditName(lib.name);
    setEditEmail(lib.email);
    setEditPassword(lib.password || '');
  };`;
const newHandleEdit = `  const handleEditClick = (lib: LibrarianAccount) => {
    setEditingLibrarian(lib);
    setEditName(lib.name);
    setEditEmail(lib.email);
    setEditPassword(lib.password || '');
    setShowEditModal(true);
  };`;
code = code.replace(oldHandleEdit, newHandleEdit);

// Find the entire table body mapping and replace it
// Because replacing regex with JSX can be messy in JS, let's just do it manually with targeted replaces.

// 1. Name cell
code = code.replace(
`                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-32"
                                />
                              ) : (
                                lib.name
                              )}`,
`                              {lib.name}`
);

// 2. Email cell
code = code.replace(
`                        {isEditing ? (
                          <input
                            type="text"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-40"
                          />
                        ) : (
                          lib.email
                        )}`,
`                        {lib.email}`
);

// 3. Password cell
code = code.replace(
`                        {isEditing ? (
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500 w-28"
                            placeholder="Password"
                          />
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {isPassShown ? (lib.password || 'N/A') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTablePassword(lib.id)}
                              className="text-slate-400 hover:text-slate-700 transition"
                              title={isPassShown ? "Hide password" : "Show password"}
                            >
                              {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}`,
`                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {isPassShown ? (lib.password || 'N/A') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTablePassword(lib.id)}
                              className="text-slate-400 hover:text-slate-700 transition"
                              title={isPassShown ? "Hide password" : "Show password"}
                            >
                              {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>`
);

// 4. Action cell
const actionStart = `                        {isEditing ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 text-xs transition font-semibold"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingLibrarian(null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-600 text-slate-600 hover:text-white border border-slate-200 text-xs transition font-semibold"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">`;
code = code.replace(actionStart, `<div className="inline-flex items-center gap-2">`);

// 5. Action cell end
const actionEnd = `                          </div>
                        )}`;
code = code.replace(actionEnd, `</div>`);

// Finally, add the Edit Modal JSX
const editModalStr = `      {/* Edit Librarian Modal */}
      {showEditModal && editingLibrarian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Edit Staff Details
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm mb-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Login Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                Update Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}`;

if (code.includes('{/* Delete Confirmation Modal */}')) {
  code = code.replace('{/* Delete Confirmation Modal */}', editModalStr);
}

fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', code);
