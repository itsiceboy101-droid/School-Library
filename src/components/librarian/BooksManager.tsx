import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Trash2, Search, CheckCircle, AlertCircle, X, Layers } from 'lucide-react';
import { Book } from '../../types';

interface BooksManagerProps {
  onSuccessToast: (msg: string) => void;
}

export const BooksManager: React.FC<BooksManagerProps> = ({ onSuccessToast }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [searchType, setSearchType] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [totalCopies, setTotalCopies] = useState('5');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const openAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setCategory('');
    setIsbn('');
    setPublisher('');
    setTotalCopies('5');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Book) => {
    setEditingBook(b);
    setTitle(b.title);
    setAuthor(b.author);
    setCategory(b.category || '');
    setIsbn(b.isbn || '');
    setPublisher(b.publisher || '');
    setTotalCopies(b.total_copies.toString());
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !author || !totalCopies) {
      setError('Title, author, and total copies are required');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingBook;
      const url = isEdit ? `/api/books/${editingBook.id}` : '/api/books';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          category,
          isbn,
          publisher,
          total_copies: totalCopies,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'add'} book`);
      } else {
        onSuccessToast(`Book "${title}" ${isEdit ? 'updated' : 'added'} successfully`);
        setIsModalOpen(false);
        setTitle('');
        setAuthor('');
        setCategory('');
        setIsbn('');
        setPublisher('');
        setTotalCopies('5');
        setEditingBook(null);
        fetchBooks();
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, bookTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${bookTitle}" from the library catalog?`)) return;

    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast(`Book "${bookTitle}" removed`);
        fetchBooks();
      } else {
        // Use toast or console instead of alert
        console.error(data.error || 'Could not delete book');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBooks = books.filter((b) => {
    const term = searchFilter.toLowerCase();
    if (!term) return true;
    
    if (searchType === 'title') return b.title.toLowerCase().includes(term);
    if (searchType === 'author') return b.author.toLowerCase().includes(term);
    if (searchType === 'publisher') return b.publisher && b.publisher.toLowerCase().includes(term);
    if (searchType === 'category') return b.category && b.category.toLowerCase().includes(term);
    
    return (
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      (b.publisher && b.publisher.toLowerCase().includes(term)) ||
      (b.category && b.category.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Book Catalog Inventory ({books.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage titles, track total vs available stock, and add new acquisitions
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-white border border-blue-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-sky-50/50 border-r border-blue-200 px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="category">Category</option>
              <option value="publisher">Publisher</option>
            </select>
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search catalog..."
                className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Book
          </button>
        </div>
      </div>

      {/* Grid / Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No books found matching "{searchFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-200">
                <tr>
                  <th className="px-6 py-3.5">Title & Author</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">ISBN</th>
                  <th className="px-6 py-3.5">Availability Status</th>
                  <th className="px-6 py-3.5 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filteredBooks.map((b) => {
                  const isAvailable = b.available_copies > 0;
                  return (
                    <tr key={b.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{b.title}</div>
                        <div className="text-slate-500 text-[11px]">
                          by {b.author} {b.publisher && <span className="ml-1 opacity-75">• {b.publisher}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                          {b.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                        {b.isbn || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle className="w-3 h-3" />
                              {b.available_copies} / {b.total_copies} Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              0 / {b.total_copies} (All Issued)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEditModal(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-xs transition"
                            title="Edit Book Details"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs transition"
                            title="Delete Book"
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
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBook ? 'Edit Book Details' : 'Add New Book Title'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingBook ? 'Update details in school library catalog' : 'Add to school library catalog inventory'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. To Kill a Mockingbird"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Harper Lee"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category / Genre
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Category...</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Math">Math</option>
                    <option value="Technology">Technology</option>
                    <option value="Literature">Literature</option>
                    <option value="Art">Art</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Biography">Biography</option>
                    <option value="Children">Children</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Copies
                  </label>
                  <div className="relative">
                    <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      value={totalCopies}
                      onChange={(e) => setTotalCopies(e.target.value)}
                      placeholder="5"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publisher (Optional)
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. Penguin Random House"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ISBN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="e.g. 978-0061120084"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBook ? 'Save Changes' : 'Add Book to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
