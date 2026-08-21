import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function isGmailConfigured(): boolean {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  return Boolean(user && pass);
}

export function getGmailUser(): string {
  return process.env.GMAIL_USER || '9sunandanik9@gmail.com';
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getTransporter();

  if (!client) {
    return {
      success: false,
      error: 'Gmail is not configured yet. Please provide GMAIL_USER and GMAIL_APP_PASSWORD in settings.',
    };
  }

  try {
    const sender = process.env.GMAIL_USER?.trim() || '9sunandanik9@gmail.com';
    const info = await client.sendMail({
      from: `"School Library Desk" <${sender}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      html: options.html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error('Failed to send email via Gmail:', err);
    return {
      success: false,
      error: err.message || 'Unknown email delivery error',
    };
  }
}

export function buildOverdueEmailHtml(params: {
  borrowerName: string;
  cardNo?: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin: 0 0 6px 0;">📚 School Library — Overdue Notice ⚠️</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Urgent Book Return Required</p>
      </div>

      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Dear <strong>${params.borrowerName}</strong>${params.cardNo ? ` (Library Card: <strong>${params.cardNo}</strong>)` : ''},
      </p>

      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Our library circulation records indicate that the following borrowed book is currently 
        <span style="color: #dc2626; font-weight: bold;">${params.daysOverdue} ${params.daysOverdue === 1 ? 'day' : 'days'} overdue</span>:
      </p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 16px; color: #991b1b; font-weight: bold;">📖 ${params.bookTitle}</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">📅 Scheduled Due Date: <strong>${params.dueDate}</strong></p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #475569;">
        <strong>⚠️ Policy Notice:</strong> Unreturned books are subject to borrowing restrictions. Please return this book to the circulation desk immediately to clear your account.
      </div>

      <p style="font-size: 14px; color: #334155; line-height: 1.5;">
        If you have already returned this book, please disregard this notice or contact the librarian.
      </p>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #64748b;">
        <p style="margin: 0 0 4px 0;">✉️ <strong>Library Email:</strong> 9sunandanik9@gmail.com</p>
        <p style="margin: 0;">🏫 <strong>School Library Administration Desk</strong></p>
      </div>
    </div>
  `;
}

export function buildIssueReceiptEmailHtml(params: {
  borrowerName: string;
  cardNo?: string;
  bookTitle: string;
  issueDate: string;
  dueDate: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #059669; margin: 0 0 6px 0;">📗 Book Issued Confirmation ✅</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">School Library Circulation Desk</p>
      </div>

      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Dear <strong>${params.borrowerName}</strong>${params.cardNo ? ` (Library Card: <strong>${params.cardNo}</strong>)` : ''},
      </p>

      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        The following book has been successfully issued to your library account:
      </p>

      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 16px; color: #065f46; font-weight: bold;">📚 ${params.bookTitle}</p>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #047857;">🗓️ Issue Date: <strong>${params.issueDate}</strong></p>
        <p style="margin: 0; font-size: 14px; color: #047857;">⏰ Due Date: <strong>${params.dueDate}</strong></p>
      </div>

      <p style="font-size: 14px; color: #334155; line-height: 1.5;">
        Please handle the book with care and remember to return or renew it on or before <strong>${params.dueDate}</strong>.
      </p>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #64748b;">
        <p style="margin: 0 0 4px 0;">✉️ <strong>Library Email:</strong> 9sunandanik9@gmail.com</p>
        <p style="margin: 0;">🏫 <strong>School Library Administration</strong></p>
      </div>
    </div>
  `;
}
