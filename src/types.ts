export interface User {
  id: number;
  name: string;
  email: string;
  role: 'librarian' | 'head_librarian';
}

export interface LibrarianAccount {
  id: number;
  name: string;
  email: string;
  role: 'librarian' | 'head_librarian';
  created_at?: string;
}

export interface Student {
  id: number;
  name: string;
  class: string;
  division: string;
  roll_no: string;
  library_card_no: string;
  password?: string;
  created_at?: string;
  is_restricted?: boolean;
  restriction_reason?: string | null;
  restriction_until?: string | null;
  active_issues_count?: number;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  category?: string;
  isbn?: string;
  publisher?: string;
  total_copies: number;
  available_copies: number;
  added_at?: string;
}

export interface IssuedBook {
  id: number;
  book_id: number;
  student_id: number;
  student_name: string;
  student_card_no?: string;
  student_class?: string;
  student_division?: string;
  student_roll_no?: string;
  book_title: string;
  book_author?: string;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'issued' | 'returned' | 'overdue';
  fine_amount?: number;
  days_overdue?: number;
  is_restricted?: boolean;
  restriction_note?: string;
}

export interface ReportSummary {
  total_books: number;
  total_copies: number;
  available_copies: number;
  issued: number;
  overdue: number;
  total_students: number;
  restricted_students_count: number;
  total_fines_collected?: number;
}

export interface AuthState {
  userType: 'librarian' | 'student' | null;
  currentUser: User | Student | null;
  token?: string;
}

