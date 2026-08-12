const fs = require('fs');

let lib = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

// Add visiblePasswords state
if (!lib.includes("visiblePasswords")) {
  lib = lib.replace(
    "const [showAddModal, setShowAddModal] = useState(false);",
    "const [showAddModal, setShowAddModal] = useState(false);\n  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});\n  const toggleTablePassword = (id: number) => setVisiblePasswords(prev => ({...prev, [id]: !prev[id]}));"
  );
}

// Add Password Header
lib = lib.replace(
  /<th className="px-6 py-3\.5 text-right">Actions<\/th>/,
  '<th className="px-6 py-3.5">Password</th>\n                  <th className="px-6 py-3.5 text-right">Manage</th>'
);

// We need to inject the Password cell before the Actions cell.
// Let's replace the whole tbody with a clean one that uses isEditing and isPassShown.
const newLibTbody = `
              <tbody className="divide-y divide-blue-100">
                {librarians.map((lib) => {
                  const isMaster = lib.id === 1 || lib.name === 'Teacher Access' || lib.name === 'Teacher Access Pass';
                  const isEditing = editingLibrarian?.id === lib.id;
                  const isPassShown = !!visiblePasswords[lib.id];
                  
                  return (
                    <tr key={lib.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={\`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs \${
                            isMaster ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800'
                          }\`}>
                            {lib.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-32"
                                />
                              ) : (
                                lib.name
                              )}
                              {isMaster && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-amber-300">
                                  MASTER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">Staff ID: #{lib.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-40"
                          />
                        ) : (
                          lib.email
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {lib.role === 'head_librarian' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Head Librarian / Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
                            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                            Librarian
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isEditing ? (
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
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
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
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(lib)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {!isMaster ? (
                              <button
                                onClick={() => handleDeleteClick(lib)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 px-2">Protected</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
`;

lib = lib.replace(/<tbody className="divide-y divide-blue-100">[\s\S]*?<\/tbody>/, newLibTbody);
fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', lib);

// Now Teacher
let teacher = fs.readFileSync('src/components/librarian/TeachersManager.tsx', 'utf8');

if (!teacher.includes("visiblePasswords")) {
  teacher = teacher.replace(
    "const [showAddModal, setShowAddModal] = useState(false);",
    "const [showAddModal, setShowAddModal] = useState(false);\n  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});\n  const toggleTablePassword = (id: number) => setVisiblePasswords(prev => ({...prev, [id]: !prev[id]}));"
  );
}

// Add Password Header
teacher = teacher.replace(
  /<th className="px-6 py-3\.5 text-right">Actions<\/th>/,
  '<th className="px-6 py-3.5">Password</th>\n                  <th className="px-6 py-3.5 text-right">Manage</th>'
);

const newTeacherTbody = `
              <tbody className="divide-y divide-blue-100 text-xs">
                  {teachers.map((t) => {
                    const hasClass = t.assigned_class && t.assigned_division;
                    const isEditing = editingTeacher?.id === t.id;
                    const isPassShown = !!visiblePasswords[t.id];
                    
                    return (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-sm border border-blue-200">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-32"
                              />
                            ) : (
                              <div>{t.name}</div>
                            )}
                            <div className="text-[10px] text-slate-400 font-normal">Staff ID #{t.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700 font-bold">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-24"
                            />
                          ) : (
                            t.username
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-32 block"
                            />
                          ) : (
                            <div>{t.email}</div>
                          )}
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
                          {isEditing ? (
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500 w-24"
                              placeholder="Password"
                            />
                          ) : (
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
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 text-xs transition font-semibold"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTeacher(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-600 text-slate-600 hover:text-white border border-slate-200 text-xs transition font-semibold"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </div>
                          ) : (
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
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
`;

teacher = teacher.replace(/<tbody className="divide-y divide-blue-100 text-xs">[\s\S]*?<\/tbody>/, newTeacherTbody);
fs.writeFileSync('src/components/librarian/TeachersManager.tsx', teacher);

