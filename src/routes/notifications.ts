import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students, books, issued_books, teachers } from '../db/schema';
import { eq, and, ne, lt, lte, gte } from 'drizzle-orm';
import { getTodayStr } from '../db/utils';
import {
  isGmailConfigured,
  getGmailUser,
  sendEmail,
  buildOverdueEmailHtml,
  buildIssueReceiptEmailHtml,
} from '../services/emailService';

export const notificationsRouter = Router();

export const DEFAULT_WHATSAPP_NUMBER = '8789803047';

function cleanPhoneNumber(rawPhone: string): string {
  const phoneToUse = (rawPhone && rawPhone.trim()) ? rawPhone : DEFAULT_WHATSAPP_NUMBER;
  // Remove spaces, hyphens, parentheses, plus
  const digits = phoneToUse.replace(/\D/g, '');
  // If user entered 10 digits (like standard mobile without country code), default to country code if needed (e.g. 91)
  if (digits.length === 10) {
    return '91' + digits; // default to +91
  }
  return digits;
}

export function formatWhatsAppMessage(params: {
  type: 'overdue' | 'due_today' | 'due_soon' | 'issued_receipt' | 'custom';
  recipientName: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue?: number;
  customText?: string;
  libraryCardNo?: string;
}): string {
  const { type, recipientName, bookTitle, dueDate, daysOverdue = 0, customText, libraryCardNo } = params;

  if (type === 'custom' && customText) {
    return `${customText}\n\n— *School Library Desk* (📞 +91 8789803047)`;
  }

  if (type === 'overdue') {
    return `📚 *School Library Notice — Book Overdue* ⚠️

Dear *${recipientName}*${libraryCardNo ? ` (Card: ${libraryCardNo})` : ''},

This is an urgent reminder from the *School Library* that your borrowed book:
📖 *"${bookTitle}"*
was due on *${dueDate}* (${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue).

⚠️ *Important*: Late returns incur a 2-week borrowing restriction. Please return this book to the library circulation desk immediately.

📞 Library Helpline / Inquiries: *+91 8789803047*
— *School Library Administration*`;
  }

  if (type === 'due_today') {
    return `📖 *School Library Reminder — Book Due Today* ⏰

Dear *${recipientName}*${libraryCardNo ? ` (Card: ${libraryCardNo})` : ''},

This is a friendly reminder from the *School Library* that your borrowed book:
📚 *"${bookTitle}"*
is due for return *today (${dueDate})*.

Please visit the library counter to return or renew your book.

📞 Library Helpline / WhatsApp: *+91 8789803047*
Happy Reading!
— *School Library Desk*`;
  }

  if (type === 'due_soon') {
    return `📖 *School Library Reminder — Upcoming Return Date* 🗓️

Dear *${recipientName}*${libraryCardNo ? ` (Card: ${libraryCardNo})` : ''},

This is a quick courtesy reminder from the *School Library* that your borrowed book:
📚 *"${bookTitle}"*
is scheduled to be returned on *${dueDate}*.

Please ensure the book is returned on or before this date to avoid late penalties.

📞 Library Helpline: *+91 8789803047*
— *School Library Desk*`;
  }

  if (type === 'issued_receipt') {
    return `📗 *School Library — Book Issued Confirmation* ✅

Dear *${recipientName}*,

The following book has been issued to your library account:
📚 *"${bookTitle}"*
📅 Due Date: *${dueDate}*

Please handle the book with care and return it on or before the due date.

📞 Library Desk / WhatsApp: *+91 8789803047*
— *School Library Desk*`;
  }

  return `📚 *School Library Notice*\n\nDear *${recipientName}*,\nRegarding your book *"${bookTitle}"* (Due: ${dueDate}). Please contact the library counter (📞 +91 8789803047).`;
}

// POST /api/notifications/whatsapp/prepare
notificationsRouter.post('/whatsapp/prepare', (req: Request, res: Response) => {
  try {
    const { type = 'overdue', recipientName, bookTitle, dueDate, daysOverdue, phone, customText, libraryCardNo } = req.body;
    
    if (!recipientName || !bookTitle) {
      return res.status(400).json({ error: 'Recipient name and book title are required' });
    }

    const message = formatWhatsAppMessage({
      type,
      recipientName,
      bookTitle,
      dueDate: dueDate || getTodayStr(),
      daysOverdue: daysOverdue || 0,
      customText,
      libraryCardNo,
    });

    const cleanPhone = cleanPhoneNumber(phone || '');
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    const webWhatsappUrl = cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

    res.json({
      success: true,
      message,
      phone: phone || '',
      cleanPhone,
      whatsappUrl,
      webWhatsappUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/overdue-list
notificationsRouter.get('/overdue-list', async (req: Request, res: Response) => {
  try {
    const today = getTodayStr();
    const activeOverdue = await db.query.issued_books.findMany({
      where: and(
        ne(issued_books.status, 'returned'),
        lt(issued_books.due_date, today)
      )
    });

    const allStudents = await db.query.students.findMany();
    const allTeachers = await db.query.teachers.findMany();
    const allBooks = await db.query.books.findMany();

    const studentsMap = new Map();
    allStudents.forEach(s => studentsMap.set(s.id, s));

    const teachersMap = new Map();
    allTeachers.forEach(t => teachersMap.set(t.id, t));

    const booksMap = new Map();
    allBooks.forEach(b => booksMap.set(b.id, b));

    const list = activeOverdue.map(ib => {
      let borrowerName = 'Unknown';
      let phone = '';
      let cardOrUser = '';
      let borrowerType: 'student' | 'teacher' = 'student';
      let borrowerClass = '';

      if (ib.teacher_id) {
        const teacher = teachersMap.get(ib.teacher_id);
        if (teacher) {
          borrowerName = teacher.name;
          phone = teacher.phone || '';
          cardOrUser = teacher.username;
          borrowerType = 'teacher';
          borrowerClass = teacher.assigned_class ? `Class ${teacher.assigned_class}-${teacher.assigned_division}` : 'Faculty';
        }
      } else if (ib.student_id) {
        const student = studentsMap.get(ib.student_id);
        if (student) {
          borrowerName = student.name;
          phone = student.phone || '';
          cardOrUser = student.library_card_no;
          borrowerType = 'student';
          borrowerClass = `Class ${student.class}-${student.division}`;
        }
      }

      const book = booksMap.get(ib.book_id);
      const bookTitle = book ? book.title : 'Library Book';

      const due = new Date(ib.due_date);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - due.getTime());
      const days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const message = formatWhatsAppMessage({
        type: 'overdue',
        recipientName: borrowerName,
        bookTitle,
        dueDate: ib.due_date,
        daysOverdue: days_overdue,
        libraryCardNo: cardOrUser,
      });

      const cleanPhone = cleanPhoneNumber(phone);
      const encodedText = encodeURIComponent(message);
      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

      return {
        id: ib.id,
        borrower_name: borrowerName,
        borrower_type: borrowerType,
        borrower_class: borrowerClass,
        card_or_user: cardOrUser,
        phone,
        has_phone: Boolean(phone && phone.trim().length > 0),
        book_title: bookTitle,
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        days_overdue,
        message,
        whatsapp_url: whatsappUrl,
      };
    });

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/due-today-list
notificationsRouter.get('/due-today-list', async (req: Request, res: Response) => {
  try {
    const today = getTodayStr();
    const activeDueToday = await db.query.issued_books.findMany({
      where: and(
        ne(issued_books.status, 'returned'),
        eq(issued_books.due_date, today)
      )
    });

    const allStudents = await db.query.students.findMany();
    const allTeachers = await db.query.teachers.findMany();
    const allBooks = await db.query.books.findMany();

    const studentsMap = new Map();
    allStudents.forEach(s => studentsMap.set(s.id, s));

    const teachersMap = new Map();
    allTeachers.forEach(t => teachersMap.set(t.id, t));

    const booksMap = new Map();
    allBooks.forEach(b => booksMap.set(b.id, b));

    const list = activeDueToday.map(ib => {
      let borrowerName = 'Unknown';
      let phone = '';
      let cardOrUser = '';
      let borrowerType: 'student' | 'teacher' = 'student';
      let borrowerClass = '';

      if (ib.teacher_id) {
        const teacher = teachersMap.get(ib.teacher_id);
        if (teacher) {
          borrowerName = teacher.name;
          phone = teacher.phone || '';
          cardOrUser = teacher.username;
          borrowerType = 'teacher';
          borrowerClass = teacher.assigned_class ? `Class ${teacher.assigned_class}-${teacher.assigned_division}` : 'Faculty';
        }
      } else if (ib.student_id) {
        const student = studentsMap.get(ib.student_id);
        if (student) {
          borrowerName = student.name;
          phone = student.phone || '';
          cardOrUser = student.library_card_no;
          borrowerType = 'student';
          borrowerClass = `Class ${student.class}-${student.division}`;
        }
      }

      const book = booksMap.get(ib.book_id);
      const bookTitle = book ? book.title : 'Library Book';

      const message = formatWhatsAppMessage({
        type: 'due_today',
        recipientName: borrowerName,
        bookTitle,
        dueDate: ib.due_date,
        libraryCardNo: cardOrUser,
      });

      const cleanPhone = cleanPhoneNumber(phone);
      const encodedText = encodeURIComponent(message);
      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

      return {
        id: ib.id,
        borrower_name: borrowerName,
        borrower_type: borrowerType,
        borrower_class: borrowerClass,
        card_or_user: cardOrUser,
        phone,
        has_phone: Boolean(phone && phone.trim().length > 0),
        book_title: bookTitle,
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        message,
        whatsapp_url: whatsappUrl,
      };
    });

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/email/status
notificationsRouter.get('/email/status', (req: Request, res: Response) => {
  res.json({
    configured: isGmailConfigured(),
    senderEmail: getGmailUser(),
  });
});

// POST /api/notifications/email/send
notificationsRouter.post('/email/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'Recipient "to", "subject", and email content are required' });
    }

    const result = await sendEmail({
      to,
      subject,
      html: html || `<p>${text}</p>`,
      text,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      sentTo: to,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/email/send-overdue
notificationsRouter.post('/email/send-overdue', async (req: Request, res: Response) => {
  try {
    const { issueId, recipientEmail } = req.body;
    if (!issueId) {
      return res.status(400).json({ error: 'issueId is required' });
    }

    const ib = await db.query.issued_books.findFirst({
      where: eq(issued_books.id, Number(issueId)),
    });

    if (!ib) {
      return res.status(404).json({ error: 'Issue record not found' });
    }

    const book = await db.query.books.findFirst({
      where: eq(books.id, ib.book_id),
    });

    let borrowerName = 'Student';
    let cardNo = '';
    let targetEmail = recipientEmail || '';

    if (ib.teacher_id) {
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, ib.teacher_id),
      });
      if (teacher) {
        borrowerName = teacher.name;
        cardNo = teacher.username;
        if (!targetEmail && teacher.email) {
          targetEmail = teacher.email;
        }
      }
    } else if (ib.student_id) {
      const student = await db.query.students.findFirst({
        where: eq(students.id, ib.student_id),
      });
      if (student) {
        borrowerName = student.name;
        cardNo = student.library_card_no;
        if (!targetEmail && student.email) {
          targetEmail = student.email;
        }
        if (recipientEmail && (!student.email || req.body.saveEmailToProfile)) {
          try {
            await db.update(students).set({ email: String(recipientEmail).trim() }).where(eq(students.id, student.id));
          } catch (e) {
            console.error('Failed to update student email in background:', e);
          }
        }
      }
    }

    if (!targetEmail) {
      targetEmail = getGmailUser(); // fallback to notification desk
    }

    const today = getTodayStr();
    const due = new Date(ib.due_date);
    const now = new Date(today);
    const diff = Math.ceil(Math.abs(now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

    const html = buildOverdueEmailHtml({
      borrowerName,
      cardNo,
      bookTitle: book ? book.title : 'Library Book',
      dueDate: ib.due_date,
      daysOverdue: diff,
    });

    const result = await sendEmail({
      to: targetEmail,
      subject: `[Overdue Notice] "${book ? book.title : 'Library Book'}" - School Library`,
      html,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      sentTo: targetEmail,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
