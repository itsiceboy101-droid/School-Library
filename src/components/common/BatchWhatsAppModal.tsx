import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Send, Check, X, AlertTriangle, User, ExternalLink, RefreshCw, CheckCircle2, Clock, Play, Sparkles, CheckCheck } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';

export const DEFAULT_WHATSAPP_NUMBER = '8789803047';

interface OverdueReminderItem {
  id: number;
  borrower_name: string;
  borrower_type: 'student' | 'teacher';
  borrower_class: string;
  card_or_user: string;
  phone?: string;
  has_phone: boolean;
  book_title: string;
  issue_date: string;
  due_date: string;
  days_overdue: number;
  message: string;
  whatsapp_url: string;
}

interface BatchWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchWhatsAppModal: React.FC<BatchWhatsAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [items, setItems] = useState<OverdueReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});
  const [phoneEdits, setPhoneEdits] = useState<Record<number, string>>({});
  const [filterType, setFilterType] = useState<'all' | 'with_phone' | 'missing_phone'>('all');
  const [autoIndex, setAutoIndex] = useState<number | null>(null);

  const fetchOverdueReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/overdue-list');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        // Pre-fill missing phones with default 8789803047
        const defaults: Record<number, string> = {};
        data.forEach((item: OverdueReminderItem) => {
          if (!item.phone || !item.phone.trim()) {
            defaults[item.id] = DEFAULT_WHATSAPP_NUMBER;
          }
        });
        setPhoneEdits((prev) => ({ ...defaults, ...prev }));
      }
    } catch (err) {
      console.error('Failed to fetch overdue reminders list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueReminders();
  }, []);

  const handleMarkSent = (id: number) => {
    setSentMap((prev) => ({ ...prev, [id]: true }));
  };

  const getCleanPhone = (rawPhone: string) => {
    const phoneToUse = rawPhone && rawPhone.trim() ? rawPhone : DEFAULT_WHATSAPP_NUMBER;
    const digits = phoneToUse.replace(/\D/g, '');
    if (digits.length === 10) return '91' + digits;
    return digits;
  };

  const getWhatsAppLink = (item: OverdueReminderItem) => {
    const activePhone = phoneEdits[item.id] !== undefined ? phoneEdits[item.id] : (item.phone || DEFAULT_WHATSAPP_NUMBER);
    const clean = getCleanPhone(activePhone);
    const encoded = encodeURIComponent(item.message);
    if (clean) {
      return `https://wa.me/${clean}?text=${encoded}`;
    }
    return `https://wa.me/91${DEFAULT_WHATSAPP_NUMBER}?text=${encoded}`;
  };

  const handleSetAllToDefault = () => {
    const updated: Record<number, string> = {};
    items.forEach((item) => {
      updated[item.id] = DEFAULT_WHATSAPP_NUMBER;
    });
    setPhoneEdits(updated);
  };

  const handleAutoSendNext = () => {
    if (items.length === 0) return;
    const nextIdx = autoIndex === null ? 0 : autoIndex + 1;
    if (nextIdx < items.length) {
      setAutoIndex(nextIdx);
      const targetItem = items[nextIdx];
      handleMarkSent(targetItem.id);
      window.open(getWhatsAppLink(targetItem), '_blank');
    } else {
      setAutoIndex(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const hasPhone = Boolean((phoneEdits[item.id] !== undefined ? phoneEdits[item.id] : item.phone)?.trim());
    if (filterType === 'with_phone') return hasPhone;
    if (filterType === 'missing_phone') return !hasPhone;
    return true;
  });

  const sentCount = Object.keys(sentMap).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Auto-Send WhatsApp Reminders
                <span className="text-xs bg-emerald-500/60 px-2.5 py-0.5 rounded-full font-medium">
                  {items.length} Overdue Borrowers
                </span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Default Auto-Send Number: <span className="font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded">+91 {DEFAULT_WHATSAPP_NUMBER}</span> everywhere
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Overdue ({items.length})
            </button>
            <button
              onClick={() => setFilterType('with_phone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'with_phone'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Custom Numbers ({items.filter((i) => Boolean(i.phone)).length})
            </button>
            <button
              onClick={handleSetAllToDefault}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition flex items-center gap-1.5"
              title="Set all phone numbers to default 8789803047"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Use {DEFAULT_WHATSAPP_NUMBER} for All
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoSendNext}
              disabled={items.length === 0}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {autoIndex === null ? 'Auto-Send Next in Queue' : `Send Next (${autoIndex + 1}/${items.length})`}
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Sent: <span className="text-emerald-600 font-bold">{sentCount}</span> / {items.length}
            </span>
            <button
              onClick={fetchOverdueReminders}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 transition"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-4">
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold text-slate-500">Preparing WhatsApp reminders with auto-send number {DEFAULT_WHATSAPP_NUMBER}...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              {items.length === 0 ? 'No overdue books found! All accounts are clear.' : 'No records match the current filter.'}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const currentPhone = phoneEdits[item.id] !== undefined ? phoneEdits[item.id] : (item.phone || DEFAULT_WHATSAPP_NUMBER);
              const isSent = Boolean(sentMap[item.id]);
              const isCurrentAuto = autoIndex === idx;

              return (
                <div
                  key={item.id}
                  className={`pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-2xl transition ${
                    isCurrentAuto
                      ? 'bg-amber-50 border-2 border-amber-400 shadow-sm'
                      : isSent
                      ? 'bg-emerald-50/60 border border-emerald-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.borrower_name}</span>
                      <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {item.card_or_user} • {item.borrower_class}
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {item.days_overdue}d overdue
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      Book: <span className="font-bold text-slate-800">{item.book_title}</span> • Due: {formatDate(item.due_date)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Editable Phone Input */}
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <input
                        type="text"
                        placeholder="8789803047"
                        value={currentPhone}
                        onChange={(e) => setPhoneEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-36 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* WhatsApp Action Button */}
                    <a
                      href={getWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkSent(item.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {isSent ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Send className="w-3.5 h-3.5" />}
                      {isSent ? 'Sent (Re-send)' : 'Send to 8789803047'}
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Using auto-send number <strong className="font-mono text-emerald-800">+91 {DEFAULT_WHATSAPP_NUMBER}</strong> for instant notifications.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
