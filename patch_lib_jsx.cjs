const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

const originalTr = `
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
                              {lib.name}
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
                        {lib.email}
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

                      <td className="px-6 py-4 text-right">
                        {!isMaster ? (
                          <button
                            onClick={() => handleDeleteClick(lib)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                            title="Delete Librarian Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Protected Master</span>
                        )}
                      </td>
                    </tr>
                  );
`;

const newTr = `
                  const isEditing = editingLibrarian?.id === lib.id;
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
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="border border-blue-200 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500 w-28"
                              placeholder="Password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-slate-400 hover:text-blue-600 transition"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : lib.role === 'head_librarian' ? (
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
                              onClick={() => setEditingLibrarian(null)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-slate-200 transition"
                              title="Cancel Edit"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditClick(lib)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                              title="Edit Info & Password"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isMaster ? (
                              <button
                                onClick={() => handleDeleteClick(lib)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                                title="Delete Librarian Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 px-2">Protected Master</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
`;

code = code.replace(originalTr.trim(), newTr.trim());
fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', code);
