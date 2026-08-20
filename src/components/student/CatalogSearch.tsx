import React, { useState, useEffect } from 'react';
import { Search, BookOpen, CheckCircle, AlertCircle, Bookmark, Loader2 } from 'lucide-react';
import { Book } from '../../types';

export const CatalogSearch: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);

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

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.author.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (b.category && b.category.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Library Catalog Search
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search available book titles and check real-time stock at the library
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search book title, author, genre..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-blue-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading library catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xs">
          No books found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const isAvailable = b.available_copies > 0;
            return (
              <div
                key={b.id}
                className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      {b.category || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ISBN: {b.isbn || 'N/A'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">by {b.author}</p>
                </div>

                <div className="pt-3 border-t border-blue-100 flex items-center justify-between">
                  <div>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {b.available_copies} Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        All Issued
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {b.total_copies} total copies
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
