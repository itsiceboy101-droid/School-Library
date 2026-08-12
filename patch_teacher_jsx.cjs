const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/TeachersManager.tsx', 'utf8');

const originalTr = `
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
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteClick(t)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                            title="Delete Teacher Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
`;

const newTr = `
                    const isEditing = editingTeacher?.id === t.id;
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
                              className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:border-blue-500 w-32 mb-1 block"
                            />
                          ) : (
                            <div className="mb-1">{t.email}</div>
                          )}
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500 w-24"
                                placeholder="Password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400 hover:text-blue-600 transition"
                              >
                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : null}
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
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition"
                                title="Save Changes"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingTeacher(null)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-slate-200 transition"
                                title="Cancel Edit"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                                title="Edit Info & Password"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(t)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                                title="Delete Teacher Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
`;

code = code.replace(originalTr.trim(), newTr.trim());
fs.writeFileSync('src/components/librarian/TeachersManager.tsx', code);
