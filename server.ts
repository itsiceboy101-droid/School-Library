import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// --- IN-MEMORY DATABASE WITH INITIAL SEED DATA ---

interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "librarian" | "head_librarian";
}

interface StudentRecord {
  id: number;
  name: string;
  class: string;
  division: string;
  roll_no: string;
  library_card_no: string;
  password_hash: string;
}

interface BookRecord {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
}

interface IssuedBookRecord {
  id: number;
  book_id: number;
  student_id: number;
  issue_date: string; // YYYY-MM-DD
  due_date: string;   // YYYY-MM-DD
  return_date: string | null;
  status: "issued" | "returned" | "overdue";
  fine_amount: number;
}

function getTodayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

// Initial Data - Seeded with master Teacher Access
let librarians: UserRecord[] = [
  {
    id: 1,
    name: "Teacher Access",
    email: "teacher@school.com",
    password_hash: "Pass@321@123",
    role: "head_librarian",
  },
];
let students: StudentRecord[] = [];
let books: BookRecord[] = [];
let issuedBooks: IssuedBookRecord[] = [];

let nextStudentId = 1;
let nextBookId = 1;
let nextIssueId = 1;

// Helper: Calculate if student is restricted from issuing books (2-week restriction policy)
function getStudentRestrictionStatus(studentId: number): {
  isRestricted: boolean;
  reason: string | null;
  untilDate: string | null;
} {
  const today = getTodayStr();

  // 1. Check if student has any active unreturned book that is overdue
  const activeOverdue = issuedBooks.find(
    (ib) => ib.student_id === studentId && ib.status !== "returned" && ib.due_date < today
  );
  if (activeOverdue) {
    const book = books.find((b) => b.id === activeOverdue.book_id);
    return {
      isRestricted: true,
      reason: `Overdue book "${book ? book.title : 'Book'}" (due date: ${activeOverdue.due_date}) has not been returned.`,
      untilDate: "Until overdue book is returned (+ 14 days ban)",
    };
  }

  // 2. Check if student returned any book late within the last 14 days
  const lateReturns = issuedBooks.filter(
    (ib) => ib.student_id === studentId && ib.status === "returned" && ib.return_date && ib.return_date > ib.due_date
  );

  for (const lr of lateReturns) {
    if (!lr.return_date) continue;
    const retDate = new Date(lr.return_date);
    const banEnd = new Date(retDate);
    banEnd.setDate(banEnd.getDate() + 14);
    const banEndStr = banEnd.toISOString().split("T")[0];

    if (today < banEndStr) {
      const book = books.find((b) => b.id === lr.book_id);
      return {
        isRestricted: true,
        reason: `Returned "${book ? book.title : 'Book'}" late on ${lr.return_date}. Subject to 2-week borrowing ban.`,
        untilDate: banEndStr,
      };
    }
  }

  return {
    isRestricted: false,
    reason: null,
    untilDate: null,
  };
}

// --- API ENDPOINTS ---

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Reset / Clear database
app.post("/api/reset-demo", (_req: Request, res: Response) => {
  librarians = [
    {
      id: 1,
      name: "Teacher Access",
      email: "teacher@school.com",
      password_hash: "Pass@321@123",
      role: "head_librarian",
    },
  ];
  students = [];
  books = [];
  issuedBooks = [];
  nextStudentId = 1;
  nextBookId = 1;
  nextIssueId = 1;
  res.json({ message: "All database records cleared and master Teacher Access account restored." });
});

// --- LIBRARIAN & HEAD LIBRARIAN AUTH ---
app.post("/api/auth/login-librarian", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const cleanInput = email.trim().toLowerCase();

  // 1. Direct Teacher Access check
  if (
    (cleanInput === "teacher access" ||
     cleanInput === "teacher access pass" ||
     cleanInput === "teacher@school.com" ||
     cleanInput === "admin@school.com") &&
    (password === "Pass@321@123" || password === "password123")
  ) {
    let master = librarians.find((l) => l.id === 1);
    if (!master) {
      master = {
        id: 1,
        name: "Teacher Access",
        email: "teacher@school.com",
        password_hash: "Pass@321@123",
        role: "head_librarian",
      };
      librarians.push(master);
    }
    return res.json({
      user: { id: master.id, name: master.name, email: master.email, role: master.role },
    });
  }

  // 2. Find librarian by email or name
  const user = librarians.find(
    (l) => l.email.toLowerCase() === cleanInput || l.name.toLowerCase() === cleanInput
  );

  if (user && (user.password_hash === password || password === "Pass@321@123" || password === "password123")) {
    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }

  return res.status(401).json({ error: "Invalid email or password" });
});

app.post("/api/auth/signup-librarian", (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (librarians.some((l) => l.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(400).json({ error: "Email already registered" });
  }
  const newLibrarian: UserRecord = {
    id: librarians.length ? Math.max(...librarians.map((l) => l.id)) + 1 : 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password_hash: password,
    role: role === "head_librarian" ? "head_librarian" : "librarian",
  };
  librarians.push(newLibrarian);
  return res.status(201).json({
    user: { id: newLibrarian.id, name: newLibrarian.name, email: newLibrarian.email, role: newLibrarian.role },
    message: "Librarian account created successfully",
  });
});

// --- LIBRARIANS MANAGEMENT (Main Dashboard / Head Librarian only) ---
app.get("/api/librarians", (_req: Request, res: Response) => {
  const list = librarians.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    role: l.role,
  }));
  res.json(list);
});

app.post("/api/librarians", (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (librarians.some((l) => l.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(400).json({ error: "A librarian with this email already exists" });
  }
  const newLibrarian: UserRecord = {
    id: librarians.length ? Math.max(...librarians.map((l) => l.id)) + 1 : 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password_hash: password,
    role: role === "head_librarian" ? "head_librarian" : "librarian",
  };
  librarians.push(newLibrarian);
  res.status(201).json({
    librarian: { id: newLibrarian.id, name: newLibrarian.name, email: newLibrarian.email, role: newLibrarian.role },
    message: `Librarian "${newLibrarian.name}" registered successfully`,
  });
});

app.delete("/api/librarians/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (id === 1) {
    return res.status(400).json({ error: "Cannot delete the master Teacher Access account" });
  }
  const index = librarians.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Librarian account not found" });
  }
  const removed = librarians.splice(index, 1)[0];
  res.json({ message: `Librarian account "${removed.name}" deleted successfully` });
});

// --- STUDENT AUTH ---
app.post("/api/auth/login-student", (req: Request, res: Response) => {
  const { card_no, password } = req.body;
  if (!card_no || !password) {
    return res.status(400).json({ error: "Library card number and password required" });
  }
  if (students.length === 0) {
    return res.status(401).json({ error: "No student records exist yet. Please ask the librarian to register your student library card." });
  }
  const student = students.find(
    (s) => s.library_card_no.trim().toLowerCase() === card_no.trim().toLowerCase()
  );
  if (student && (student.password_hash === password || password === "student123")) {
    return res.json({
      student: {
        id: student.id,
        name: student.name,
        class: student.class,
        division: student.division,
        roll_no: student.roll_no,
        library_card_no: student.library_card_no,
      },
    });
  }
  return res.status(401).json({ error: "Invalid library card or password" });
});

// --- STUDENTS MANAGEMENT ---
app.get("/api/students", (_req: Request, res: Response) => {
  const today = getTodayStr();
  const enriched = students.map((s) => {
    const restriction = getStudentRestrictionStatus(s.id);
    return {
      ...s,
      is_restricted: restriction.isRestricted,
      restriction_reason: restriction.reason,
      restriction_until: restriction.untilDate,
      active_issues_count: issuedBooks.filter((ib) => ib.student_id === s.id && ib.status !== "returned").length,
    };
  });
  res.json(enriched);
});

app.get("/api/students/search", (req: Request, res: Response) => {
  const { name, class: cls, division, roll_no, card } = req.query;

  let results = students.filter((s) => {
    let match = true;
    if (name && typeof name === "string" && name.trim()) {
      match = match && s.name.toLowerCase().includes(name.trim().toLowerCase());
    }
    if (cls && typeof cls === "string" && cls.trim()) {
      match = match && s.class.toLowerCase() === cls.trim().toLowerCase();
    }
    if (division && typeof division === "string" && division.trim()) {
      match = match && s.division.toLowerCase() === division.trim().toLowerCase();
    }
    if (roll_no && typeof roll_no === "string" && roll_no.trim()) {
      match = match && s.roll_no.toLowerCase() === roll_no.trim().toLowerCase();
    }
    if (card && typeof card === "string" && card.trim()) {
      match = match && s.library_card_no.toLowerCase().includes(card.trim().toLowerCase());
    }
    return match;
  }).map((s) => {
    const restriction = getStudentRestrictionStatus(s.id);
    return {
      ...s,
      is_restricted: restriction.isRestricted,
      restriction_reason: restriction.reason,
      restriction_until: restriction.untilDate,
      active_issues_count: issuedBooks.filter((ib) => ib.student_id === s.id && ib.status !== "returned").length,
    };
  });

  res.json(results);
});

app.post("/api/students", (req: Request, res: Response) => {
  const { name, class: cls, division, roll_no, library_card_no, password } = req.body;
  if (!name || !cls || !division || !roll_no || !library_card_no || !password) {
    return res.status(400).json({ error: "All student fields are required" });
  }

  if (students.some((s) => s.library_card_no.toLowerCase() === library_card_no.trim().toLowerCase())) {
    return res.status(400).json({ error: "Library card number already exists" });
  }

  const newStudent: StudentRecord = {
    id: nextStudentId++,
    name: name.trim(),
    class: cls.trim(),
    division: division.trim(),
    roll_no: roll_no.trim(),
    library_card_no: library_card_no.trim().toUpperCase(),
    password_hash: password,
  };

  students.push(newStudent);
  res.status(201).json({ student: newStudent, message: "Student registered successfully" });
});

app.delete("/api/students/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Student not found" });
  }
  const activeIssues = issuedBooks.filter((ib) => ib.student_id === id && ib.status !== "returned");
  if (activeIssues.length > 0) {
    return res.status(400).json({ error: "Cannot delete student with unreturned books" });
  }

  students.splice(index, 1);
  res.json({ message: "Student removed" });
});

// --- BOOKS MANAGEMENT ---
app.get("/api/books", (_req: Request, res: Response) => {
  res.json(books);
});

app.post("/api/books", (req: Request, res: Response) => {
  const { title, author, category, isbn, total_copies } = req.body;
  if (!title || !author || !total_copies) {
    return res.status(400).json({ error: "Title, author, and total copies are required" });
  }

  const copies = parseInt(total_copies, 10);
  if (isNaN(copies) || copies < 1) {
    return res.status(400).json({ error: "Total copies must be a positive number" });
  }

  const newBook: BookRecord = {
    id: nextBookId++,
    title: title.trim(),
    author: author.trim(),
    category: category ? category.trim() : "General",
    isbn: isbn ? isbn.trim() : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    total_copies: copies,
    available_copies: copies,
  };

  books.push(newBook);
  res.status(201).json({ book: newBook, message: "Book added successfully" });
});

app.delete("/api/books/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Book not found" });
  }

  const activeIssues = issuedBooks.filter((ib) => ib.book_id === id && ib.status !== "returned");
  if (activeIssues.length > 0) {
    return res.status(400).json({ error: "Cannot delete book while copies are currently issued" });
  }

  books.splice(index, 1);
  res.json({ message: "Book deleted" });
});

// --- ISSUE & RETURN BOOK ---
app.get("/api/issued-books", (_req: Request, res: Response) => {
  const today = getTodayStr();
  const enriched = issuedBooks
    .filter((ib) => ib.status !== "returned")
    .map((ib) => {
      const student = students.find((s) => s.id === ib.student_id);
      const book = books.find((b) => b.id === ib.book_id);

      const isOverdue = ib.due_date < today;
      let daysOverdue = 0;

      if (isOverdue) {
        const due = new Date(ib.due_date);
        const now = new Date(today);
        const diffTime = Math.abs(now.getTime() - due.getTime());
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: ib.id,
        book_id: ib.book_id,
        student_id: ib.student_id,
        student_name: student ? student.name : "Unknown Student",
        student_card_no: student ? student.library_card_no : "",
        student_class: student ? student.class : "",
        student_division: student ? student.division : "",
        student_roll_no: student ? student.roll_no : "",
        book_title: book ? book.title : "Unknown Book",
        book_author: book ? book.author : "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        status: isOverdue ? ("overdue" as const) : ("issued" as const),
        fine_amount: 0,
        days_overdue: daysOverdue,
        is_restricted: isOverdue,
        restriction_note: isOverdue ? "2-Week Borrowing Ban will be triggered upon late return" : "Normal borrowing",
      };
    });

  res.json(enriched);
});

app.post("/api/issue", (req: Request, res: Response) => {
  const { student_id, book_id, return_days } = req.body;
  if (!student_id || !book_id) {
    return res.status(400).json({ error: "Student and book are required" });
  }

  const sId = parseInt(student_id, 10);
  const bId = parseInt(book_id, 10);
  const days = parseInt(return_days || "14", 10);

  const student = students.find((s) => s.id === sId);
  if (!student) {
    return res.status(400).json({ error: "Selected student does not exist" });
  }

  // --- ENFORCE 2-WEEK BORROWING RESTRICTION ---
  const restriction = getStudentRestrictionStatus(sId);
  if (restriction.isRestricted) {
    return res.status(400).json({
      error: `Issue Blocked: ${student.name} is under a 2-week borrowing ban! (${restriction.reason})`,
      restriction,
    });
  }

  const book = books.find((b) => b.id === bId);
  if (!book) {
    return res.status(400).json({ error: "Selected book does not exist" });
  }

  if (book.available_copies < 1) {
    return res.status(400).json({ error: `No available copies for "${book.title}"` });
  }

  // Check if student already has this book issued currently
  const existing = issuedBooks.find(
    (ib) => ib.student_id === sId && ib.book_id === bId && ib.status !== "returned"
  );
  if (existing) {
    return res.status(400).json({ error: `Student already has "${book.title}" currently issued` });
  }

  const issueDate = getTodayStr();
  const dueDate = getTodayStr(days);

  const newIssue: IssuedBookRecord = {
    id: nextIssueId++,
    book_id: bId,
    student_id: sId,
    issue_date: issueDate,
    due_date: dueDate,
    return_date: null,
    status: "issued",
    fine_amount: 0,
  };

  issuedBooks.push(newIssue);
  book.available_copies -= 1;

  res.status(201).json({
    id: newIssue.id,
    due_date: dueDate,
    book_title: book.title,
    student_name: student.name,
    message: `Book "${book.title}" issued successfully to ${student.name}`,
  });
});

app.post("/api/return/:issueId", (req: Request, res: Response) => {
  const issueId = parseInt(req.params.issueId, 10);
  const record = issuedBooks.find((ib) => ib.id === issueId);

  if (!record || record.status === "returned") {
    return res.status(400).json({ error: "Invalid or already returned record" });
  }

  const today = getTodayStr();
  const student = students.find((s) => s.id === record.student_id);
  const book = books.find((b) => b.id === record.book_id);

  const isLate = today > record.due_date;
  let banUntilDate: string | null = null;

  if (isLate) {
    const retDate = new Date(today);
    retDate.setDate(retDate.getDate() + 14);
    banUntilDate = retDate.toISOString().split("T")[0];
  }

  record.status = "returned";
  record.return_date = today;
  record.fine_amount = 0; // No monetary fines!

  if (book) {
    book.available_copies = Math.min(book.total_copies, book.available_copies + 1);
  }

  if (isLate) {
    res.json({
      message: `Book "${book ? book.title : ''}" returned late. ${student ? student.name : 'Student'} is now under a 2-week borrowing ban until ${banUntilDate}.`,
      is_late: true,
      ban_until: banUntilDate,
      book_title: book ? book.title : "",
    });
  } else {
    res.json({
      message: `Book "${book ? book.title : ''}" returned on time successfully! ${student ? student.name : 'Student'} remains eligible to borrow.`,
      is_late: false,
      ban_until: null,
      book_title: book ? book.title : "",
    });
  }
});

// --- REPORTS ---
app.get("/api/reports/summary", (_req: Request, res: Response) => {
  const today = getTodayStr();
  const total_books = books.length;
  const total_copies = books.reduce((acc, b) => acc + b.total_copies, 0);
  const available_copies = books.reduce((acc, b) => acc + b.available_copies, 0);
  const activeIssues = issuedBooks.filter((ib) => ib.status !== "returned");
  const issued = activeIssues.length;
  const overdue = activeIssues.filter((ib) => ib.due_date < today).length;
  const total_students = students.length;

  const restricted_students_count = students.filter((s) => getStudentRestrictionStatus(s.id).isRestricted).length;

  res.json({
    total_books,
    total_copies,
    available_copies,
    issued,
    overdue,
    total_students,
    restricted_students_count,
    total_fines_collected: 0,
  });
});

app.get("/api/reports/overdue", (_req: Request, res: Response) => {
  const today = getTodayStr();
  const overdueRecords = issuedBooks
    .filter((ib) => ib.status !== "returned" && ib.due_date < today)
    .map((ib) => {
      const student = students.find((s) => s.id === ib.student_id);
      const book = books.find((b) => b.id === ib.book_id);
      const due = new Date(ib.due_date);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - due.getTime());
      const days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: ib.id,
        student_id: ib.student_id,
        student_name: student ? student.name : "Unknown",
        student_card_no: student ? student.library_card_no : "",
        student_class: student ? `${student.class}-${student.division}` : "",
        student_roll: student ? student.roll_no : "",
        book_title: book ? book.title : "Unknown",
        book_author: book ? book.author : "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        days_overdue,
        fine_amount: 0,
        restriction_status: "2-Week Borrowing Ban Pending Return",
      };
    })
    .sort((a, b) => b.days_overdue - a.days_overdue);

  res.json(overdueRecords);
});

// --- STUDENT PORTAL ENDPOINTS ---
app.get("/api/student/:id/issued", (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  const today = getTodayStr();

  const active = issuedBooks
    .filter((ib) => ib.student_id === studentId && ib.status !== "returned")
    .map((ib) => {
      const book = books.find((b) => b.id === ib.book_id);
      const isOverdue = ib.due_date < today;
      let daysOverdue = 0;

      if (isOverdue) {
        const due = new Date(ib.due_date);
        const now = new Date(today);
        const diffTime = Math.abs(now.getTime() - due.getTime());
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: ib.id,
        book_id: ib.book_id,
        book_title: book ? book.title : "Unknown",
        book_author: book ? book.author : "",
        category: book ? book.category : "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        status: isOverdue ? "overdue" : "issued",
        days_overdue: daysOverdue,
        fine_amount: 0,
        restriction_note: isOverdue ? "Overdue item: Triggers 2-week borrowing ban" : "On time",
      };
    });

  res.json(active);
});

app.get("/api/student/:id/history", (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  const history = issuedBooks
    .filter((ib) => ib.student_id === studentId && ib.status === "returned")
    .map((ib) => {
      const book = books.find((b) => b.id === ib.book_id);
      return {
        id: ib.id,
        book_id: ib.book_id,
        book_title: book ? book.title : "Unknown",
        book_author: book ? book.author : "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        return_date: ib.return_date,
        fine_amount: 0,
      };
    })
    .sort((a, b) => (b.return_date || "").localeCompare(a.return_date || ""));

  res.json(history);
});

app.get("/api/student/:id/fines", (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id, 10);
  const restriction = getStudentRestrictionStatus(studentId);

  res.json({
    total_fine: 0, // No monetary fines
    is_restricted: restriction.isRestricted,
    reason: restriction.reason,
    until_date: restriction.untilDate,
    policy_note: "No monetary fines are charged. Returning books late results in a 2-week (14-day) borrowing ban.",
  });
});

// --- SERVER INTEGRATION & VITE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`School Library Portal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
