import React, { useState } from 'react';
import { MessageSquare, Phone, Send, Copy, Check, X, ExternalLink, Sparkles } from 'lucide-react';

export const DEFAULT_WHATSAPP_NUMBER = '8789803047';

interface DirectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectWhatsAppModal: React.FC<DirectWhatsAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [phone, setPhone] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('General Library Notice');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const quickTemplates = [
    {
      title: 'Overdue Reminder',
      text: `📚 *School Library Notice — Book Overdue* ⚠️\n\nDear Student/Faculty,\n\nThis is an urgent reminder to return your overdue library books to the desk.\n\n📞 Library Contact: +91 8789803047\n— *School Library Desk*`,
    },
    {
      title: 'New Books Arrival',
      text: `🎉 *School Library Announcement — New Arrivals!* 📖\n\nExciting new fiction, science, and reference titles have just arrived at the School Library!\n\nVisit the circulation counter today to borrow your copy.\n\n— *School Library Desk* (📞 +91 8789803047)`,
    },
    {
      title: 'Due Today Alert',
      text: `⏰ *School Library Reminder — Book Due Today*\n\nDear Student/Faculty,\n\nPlease remember that your borrowed library book is due for return today. Please visit the desk to return or renew.\n\n📞 WhatsApp Helpline: +91 8789803047\n— *School Library Desk*`,
    },
    {
      title: 'Library Hours & Support',
      text: `🏛️ *School Library Information*\n\nLibrary Desk is open Mon–Sat for book issuance, returns, and study reference.\n\nFor queries or assistance, contact WhatsApp helpline: *+91 8789803047*.\n\n— *School Library Administration*`,
    },
  ];

  const getCleanPhone = (raw: string) => {
    const p = raw.trim() || DEFAULT_WHATSAPP_NUMBER;
    const digits = p.replace(/\D/g, '');
    if (digits.length === 10) return '91' + digits;
    return digits;
  };

  const finalMessage = message.trim() || quickTemplates[0].text;
  const cleanPhone = getCleanPhone(phone);
  const encodedText = encodeURIComponent(finalMessage);
  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Send WhatsApp Message
                <span className="text-[10px] bg-emerald-500/50 px-2 py-0.5 rounded-full border border-white/20 font-medium">
                  Auto-Sender
                </span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Active auto-send number: <strong className="font-mono text-white bg-white/20 px-1.5 py-0.5 rounded">+91 {DEFAULT_WHATSAPP_NUMBER}</strong>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Target Mobile / WhatsApp Number
              </span>
              <button
                type="button"
                onClick={() => setPhone(DEFAULT_WHATSAPP_NUMBER)}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
              >
                Reset to {DEFAULT_WHATSAPP_NUMBER}
              </button>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 8789803047 or +91 8789803047"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Quick Template Chips */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Quick Notice Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMessage(t.text);
                    setSubject(t.title);
                  }}
                  className="text-left px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border border-slate-200 transition truncate"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Message Content</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your WhatsApp notification or announcement..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans"
            />
          </div>

          {/* Preview Box */}
          <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200 shadow-inner">
            <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs text-slate-800 whitespace-pre-wrap max-w-md border-l-4 border-emerald-500">
              {finalMessage}
              <div className="text-[10px] text-slate-400 text-right mt-2 font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • WhatsApp ({cleanPhone})
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sending to +{cleanPhone}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              Close
            </button>
            <a
              href={waMeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              Auto-Send via WhatsApp
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
