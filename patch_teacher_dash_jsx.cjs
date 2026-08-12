const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Replace Add button onClick
code = code.replace(
  /onClick=\{\(\) => \{\s*setError\(null\);\s*setShowAddModal\(true\);\s*\}\}/g,
  "onClick={openAddModal}"
);

// Table Header
const oldThead = `<th className="px-6 py-3.5 text-right">Class Section</th>`;
const newThead = `<th className="px-6 py-3.5">Class Section</th>
                          <th className="px-6 py-3.5 text-right">Manage</th>`;
code = code.replace(oldThead, newThead);

// Table Body mapping
const oldTbody = `<td className="px-6 py-4 text-right">
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                {s.class}-{s.division}
                              </span>
                            </td>`;
const newTbody = `<td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                {s.class}-{s.division}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                {s.active_issues_count && s.active_issues_count > 0 ? (
                                  <button
                                    disabled
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs cursor-not-allowed"
                                    title={\`Cannot delete: \${s.active_issues_count} unreturned book(s)\`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteClick(s)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>`;
code = code.replace(oldTbody, newTbody);

// Password column visibility toggle
const oldPassTd = `<td className="px-6 py-4 font-mono text-slate-500">
                              {s.password || '••••••••'}
                            </td>`;
const newPassTd = `<td className="px-6 py-4">
                              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <span className="font-mono text-xs font-semibold text-slate-800">
                                  {visiblePasswords[s.id] ? (s.password || 'N/A') : '••••••••'}
                                </span>
                                <button
                                  onClick={() => toggleTablePassword(s.id)}
                                  className="text-slate-400 hover:text-slate-700 transition"
                                >
                                  {visiblePasswords[s.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>`;
code = code.replace(oldPassTd, newPassTd);

// Add Student Modal heading and button text
code = code.replace(
  `Add Student to Class {teacher.assigned_class}-{teacher.assigned_division}`,
  `{editingStudent ? 'Edit Student Details' : \`Add Student to Class \${teacher.assigned_class}-\${teacher.assigned_division}\`}`
);
code = code.replace(
  `{addLoading ? 'Adding...' : 'Add Student'}`,
  `{addLoading ? 'Saving...' : (editingStudent ? 'Save Changes' : 'Add Student')}`
);
code = code.replace(
  `onSubmit={handleAddStudent}`,
  `onSubmit={handleSaveStudent}`
);
code = code.replace(
  `<UserPlus className="w-5 h-5 text-blue-600" />`,
  `{editingStudent ? <Pencil className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}`
);


// Also add the delete modal to the end
const deleteModal = `
      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Student?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingStudent.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

code = code.replace(`    </div>\n  );\n};`, deleteModal);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
console.log("Done phase 2");
