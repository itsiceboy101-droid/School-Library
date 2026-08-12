const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

// We want to change the part that renders the buttons.
// Instead of always rendering Edit, and conditionally rendering Delete:
/*
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(lib)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
*/
// to:
/*
                          <div className="inline-flex items-center gap-2">
                            {!isMaster ? (
                              <>
                                <button
                                  onClick={() => handleEditClick(lib)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(lib)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 px-2 font-bold bg-slate-100 rounded-md py-1">Protected Account</span>
                            )}
                          </div>
*/

const searchStr = `<button
                              onClick={() => handleEditClick(lib)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                            )}`;

const replaceStr = `{!isMaster ? (
                              <>
                                <button
                                  onClick={() => handleEditClick(lib)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition font-semibold"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(lib)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 px-2 font-bold bg-slate-100 rounded-md py-1">Protected Account</span>
                            )}`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', code);
  console.log("Patched LibrariansManager.tsx successfully.");
} else {
  console.error("Could not find the search string in LibrariansManager.tsx!");
}
