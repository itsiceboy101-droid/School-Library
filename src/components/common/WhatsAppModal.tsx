import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Send, Copy, Check, X, AlertTriangle, Clock, BookOpen, ExternalLink, User, Save, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';

export interface WhatsAppModalData {
  recipientName: string;
  recipientType?: 'student' | 'teacher';
  studentId?: number;
  teacherId?: number;
  phone?: string | null;
  bookTitle: string;
  dueDate: string;
  daysOverdue?: number;
  libraryCardNo?: string;
  initialType?: 'overdue' | 'due_today' | 'due_soon' | 'issued_receipt' | 'custom';
}

export const DEFAULT_LIBRARY_PHONE = '8789803047';

interface WhatsAppModalProps {
  data: WhatsAppModalData | null;
  onClose: () => void;
  onPhoneUpdated?: (id: number, phone: string, type: 'student' | 'teacher') => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  data,
  onClose,
  onPhoneUpdated,
}) => {
  if (!data) return null;

  const [phone, setPhone] = useState(data.phone || DEFAULT_LIBRARY_PHONE);
  const [templateType, setTemplateType] = useState<'overdue' | 'due_today' | 'due_soon' | 'issued_receipt' | 'custom'>(
    data.initialType || (data.daysOverdue && data.daysOverdue > 0 ? 'overdue' : 'due_today')
  );
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    setPhone(data.phone || DEFAULT_LIBRARY_PHONE);
    setTemplateType(data.initialType || (data.daysOverdue && data.daysOverdue > 0 ? 'overdue' : 'due_today'));
    setPhoneSaved(false);
  }, [data]);

  const generateMessageText = () => {
    if (templateType === 'custom') {
      return customMessage
        ? `${customMessage}\n\n— *School Library Desk* (📞 +91 8789803047)`
        : `Dear ${data.recipientName}, regarding your library book "${data.bookTitle}".\n\n— *School Library Desk* (📞 +91 8789803047)`;
    }

    if (templateType === 'issued_receipt') {
      return `📗 *School Library — Book Issued Confirmation* ✅

Dear *${data.recipientName}*${data.libraryCardNo ? ` (Card: ${data.libraryCardNo})` : ''},

The following book has been successfully issued to your library account:
📚 *"${data.bookTitle}"*
📅 Due Date: *${formatDate(data.dueDate)}*

Please handle the book with care and return it on or before the due date.

📞 Library Helpline / WhatsApp: *+91 8789803047*
— *School Library Desk*`;
    }

    if (templateType === 'overdue') {
      const days = data.daysOverdue || 1;
      return `📚 *School Library Notice — Book Overdue* ⚠️

Dear *${data.recipientName}*${data.libraryCardNo ? ` (Card: ${data.libraryCardNo})` : ''},

This is an urgent reminder from the *School Library* that your borrowed book:
📖 *"${data.bookTitle}"*
was due on *${formatDate(data.dueDate)}* (${days} ${days === 1 ? 'day' : 'days'} overdue).

⚠️ *Important Notice*: Late returns incur a 2-week borrowing restriction. Please return this book to the library circulation desk immediately to clear your account.

📞 Library Helpline / Contact: *+91 8789803047*
Thank you!
— *School Library Administration*`;
    }

    if (templateType === 'due_today') {
      return `📖 *School Library Reminder — Book Due Today* ⏰

Dear *${data.recipientName}*${data.libraryCardNo ? ` (Card: ${data.libraryCardNo})` : ''},

This is a friendly reminder from the *School Library* that your borrowed book:
📚 *"${data.bookTitle}"*
is due for return *today (${formatDate(data.dueDate)})*.

Please visit the library counter to return or renew your book to maintain your active borrowing privileges.

📞 Library Helpline / WhatsApp: *+91 8789803047*
Happy Reading!
— *School Library Desk*`;
    }

    return `📖 *School Library Reminder — Upcoming Return Date* 🗓️

Dear *${data.recipientName}*${data.libraryCardNo ? ` (Card: ${data.libraryCardNo})` : ''},

This is a courtesy reminder from the *School Library* that your borrowed book:
📚 *"${data.bookTitle}"*
is scheduled to be returned on *${formatDate(data.dueDate)}*.

Please ensure the book is returned on or before the due date.

📞 Library Helpline: *+91 8789803047*
— *School Library Desk*`;
  };

  const messageText = generateMessageText();

  const getCleanPhone = () => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return '91' + digits; // default country code for standard mobile numbers
    }
    return digits;
  };

  const cleanPhone = getCleanPhone();
  const encodedMessage = encodeURIComponent(messageText);

  // Link for direct WhatsApp App / Mobile
  const waMeUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  // Link specifically targeting WhatsApp Web for desktop computers
  const webWaUrl = cleanPhone
    ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?text=${encodedMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) return;
    setSavingPhone(true);
    try {
      if (data.studentId) {
        await fetch(`/api/students/${data.studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        if (onPhoneUpdated) onPhoneUpdated(data.studentId, phone.trim(), 'student');
      } else if (data.teacherId) {
        await fetch(`/api/teachers/${data.teacherId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        if (onPhoneUpdated) onPhoneUpdated(data.teacherId, phone.trim(), 'teacher');
      }
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save phone:', err);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with WhatsApp Theme */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Send WhatsApp Reminder
                <span className="text-[10px] bg-emerald-500/50 px-2 py-0.5 rounded-full border border-white/20 font-medium">
                  {templateType === 'overdue' ? 'Overdue Alert' : 'Due Notice'}
                </span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Instant 1-click text notice to student/parent or teacher
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Recipient & Book Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-sm text-slate-900">{data.recipientName}</span>
                {data.libraryCardNo && (
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {data.libraryCardNo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate max-w-xs">{data.bookTitle}</span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-[11px] text-slate-500">Due Date</div>
              <div className="text-xs font-bold text-slate-800">{formatDate(data.dueDate)}</div>
              {data.daysOverdue !== undefined && data.daysOverdue > 0 && (
                <div className="text-[10px] font-bold text-rose-600 mt-0.5 flex items-center gap-1 justify-start sm:justify-end">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  {data.daysOverdue} days overdue
                </div>
              )}
            </div>
          </div>

          {/* Recipient WhatsApp / Mobile Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Recipient WhatsApp Number
              </span>
              <div className="flex items-center gap-2">
                {phone !== DEFAULT_LIBRARY_PHONE && (
                  <button
                    type="button"
                    onClick={() => setPhone(DEFAULT_LIBRARY_PHONE)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    Use 8789803047
                  </button>
                )}
                {data.phone ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Profile Phone
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Default: 8789803047
                  </span>
                )}
              </div>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 8789803047 or +91 8789803047"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {(data.studentId || data.teacherId) && (
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={savingPhone || !phone.trim()}
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
                  title="Save this phone number to the student/teacher profile"
                >
                  {savingPhone ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : phoneSaved ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {phoneSaved ? 'Saved!' : 'Save to Profile'}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Automatic number: <strong className="text-emerald-700 font-mono">+91 8789803047</strong> everywhere.</span>
              <span className="text-[10px] text-slate-400">Mobile + Web compatible</span>
            </p>
          </div>

          {/* Template Choice Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Notice Type / Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('overdue')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                  templateType === 'overdue'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Overdue Alert
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('due_today')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                  templateType === 'due_today'
                    ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Due Today
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('due_soon')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                  templateType === 'due_soon'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Upcoming Due
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('issued_receipt')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                  templateType === 'issued_receipt'
                    ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-teal-600" />
                Issue Receipt
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('custom')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                  templateType === 'custom'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                Custom Text
              </button>
            </div>
          </div>

          {templateType === 'custom' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Custom Message</label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your custom library notice here..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {/* WhatsApp Message Preview Bubble */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                WhatsApp Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>
            </div>

            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200 shadow-inner">
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs text-slate-800 whitespace-pre-wrap font-sans max-w-md border-l-4 border-emerald-500">
                {messageText}
                <div className="text-[10px] text-slate-400 text-right mt-2 font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            {cleanPhone ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Ready to send to +{cleanPhone}
              </span>
            ) : (
              <span className="text-amber-600 font-medium">
                No phone number? Click below to choose contact in WhatsApp
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition w-full sm:w-auto text-center"
            >
              Cancel
            </button>

            <a
              href={waMeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 w-full sm:w-auto"
            >
              <Send className="w-3.5 h-3.5" />
              Open in WhatsApp
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
