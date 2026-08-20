import React, { useState, useEffect } from 'react';
import { Mail, Send, Check, X, Sparkles, Key, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface DirectEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToEmail?: string;
  initialSubject?: string;
  initialMessage?: string;
  onEmailSent?: (sentTo: string) => void;
}

export const DirectEmailModal: React.FC<DirectEmailModalProps> = ({
  isOpen,
  onClose,
  initialToEmail,
  initialSubject,
  initialMessage,
  onEmailSent,
}) => {
  if (!isOpen) return null;

  const [toEmail, setToEmail] = useState(initialToEmail || '9sunandanik9@gmail.com');
  const [subject, setSubject] = useState(initialSubject || '📚 School Library — Book Overdue Notice');
  const [message, setMessage] = useState(
    initialMessage ||
    `Dear Student/Faculty,\n\nThis is an automated notice from the School Library.\n\nPlease return your borrowed library books to the circulation desk promptly to keep your borrowing privileges active.\n\n— School Library Administration\nEmail: 9sunandanik9@gmail.com`
  );
  const [status, setStatus] = useState<{ configured: boolean; senderEmail: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (initialToEmail) setToEmail(initialToEmail);
    if (initialSubject) setSubject(initialSubject);
    if (initialMessage) setMessage(initialMessage);
  }, [initialToEmail, initialSubject, initialMessage, isOpen]);

  useEffect(() => {
    fetch('/api/notifications/email/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/notifications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject,
          text: message,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h3 style="color: #1e293b; margin-top: 0;">${subject}</h3>
            <p style="white-space: pre-wrap; color: #334155; line-height: 1.6;">${message}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">School Library Portal System • ✉️ 9sunandanik9@gmail.com</p>
          </div>`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({
          success: true,
          msg: `Email successfully sent to ${toEmail}!`,
        });
        if (onEmailSent) {
          onEmailSent(toEmail);
        }
      } else {
        setSendResult({
          success: false,
          msg: data.error || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        msg: err.message || 'Connection error while dispatching email.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Automated Gmail Sender
                <span className="text-[10px] bg-blue-500/50 px-2 py-0.5 rounded-full border border-white/20 font-medium">
                  Background Delivery
                </span>
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Send receipts, overdue notices & alerts directly to inbox
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
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Gmail Config Guide / Status Banner */}
          {status && !status.configured ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Gmail Setup Required for Live Delivery
              </div>
              <p className="leading-relaxed">
                To send emails automatically in the background from your Gmail account, add these 2 environment variables in <strong>Project Settings &gt; Environment Variables</strong>:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200 font-mono text-[11px] space-y-1 text-slate-800">
                <div><strong>GMAIL_USER</strong> = <span className="text-blue-600">9sunandanik9@gmail.com</span></div>
                <div><strong>GMAIL_APP_PASSWORD</strong> = <span className="text-emerald-600">xxxx xxxx xxxx xxxx</span> (16-letter App Password)</div>
              </div>
              <p className="text-[11px] text-amber-700">
                👉 Generate your 16-letter App password at{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-amber-900 inline-flex items-center gap-0.5"
                >
                  myaccount.google.com/apppasswords <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Connected as <strong>{status?.senderEmail || '9sunandanik9@gmail.com'}</strong>
                </span>
              </div>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Ready to Send
              </span>
            </div>
          )}

          {/* Result Alert */}
          {sendResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                sendResult.success
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {sendResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{sendResult.msg}</span>
            </div>
          )}

          {/* Recipient Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Recipient Email Address</span>
              <button
                type="button"
                onClick={() => setToEmail('9sunandanik9@gmail.com')}
                className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
              >
                Use 9sunandanik9@gmail.com
              </button>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Email Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Message Content</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Email Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
