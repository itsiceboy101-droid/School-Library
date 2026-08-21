export interface User {
  id: number;
  name: string;
  email: string;
  role: 'librarian' | 'head_librarian';
}

export interface LibrarianAccount {
  password?: string;
  id: number;
  name: string;
  email: string;
  role: 'librarian' | 'head_librarian';
  created_at?: string;
}

export interface Teacher {
  password?: string;
  id: number;
  name: string;
  email: string;
  username: string;
  phone?: string | null;
  assigned_class?: string | null;
  assigned_division?: string | null;
  created_at?: string;
}

export interface Student {
  id: number;
  name: string;
  class: string;
  division: string;
  roll_no: string;
  library_card_no: string;
  email?: string | null;
  phone?: string | null;
  password?: string;
  created_at?: string;
  is_restricted?: boolean;
  restriction_reason?: string | null;
  restriction_until?: string | null;
  active_issues_count?: number;
  class_teacher_name?: string | null;
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
  student_id?: number | null;
  teacher_id?: number | null;
  student_name: string;
  student_card_no?: string;
  student_class?: string;
  student_division?: string;
  student_roll_no?: string;
  email?: string | null;
  student_email?: string | null;
  teacher_email?: string | null;
  student_phone?: string | null;
  teacher_phone?: string | null;
  book_title: string;
  book_author?: string;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'issued' | 'returned' | 'overdue';
  fine_amount?: number;
  days_overdue?: number;
  issue_code?: string | null;
  is_restricted?: boolean;
  restriction_note?: string;
}

export interface OverdueItem {
  id: number;
  student_id?: number | null;
  teacher_id?: number | null;
  student_name: string;
  student_card_no: string;
  student_class: string;
  student_roll: string;
  email?: string | null;
  student_email?: string | null;
  teacher_email?: string | null;
  student_phone?: string | null;
  book_title: string;
  book_author: string;
  issue_date: string;
  due_date: string;
  days_overdue: number;
  fine_amount: number;
  restriction_status: string;
}

export interface ReportSummary {
  total_books: number;
  total_copies: number;
  available_copies: number;
  checked_out_copies?: number;
  issued: number;
  overdue: number;
  due_today?: number;
  today_issued?: number;
  today_returned?: number;
  total_students: number;
  total_teachers?: number;
  restricted_students_count: number;
  total_all_time_issues?: number;
  total_all_time_returns?: number;
  total_fines_collected?: number;
}

export interface AllTimeStats {
  total_all_time_issues: number;
  total_all_time_returns: number;
  return_rate: number;
  total_students: number;
  total_teachers: number;
  total_books: number;
  total_copies: number;
  available_copies: number;
  issued_copies: number;
  student_issues_count: number;
  teacher_issues_count: number;
  top_borrowed_books: Array<{
    id: number;
    title: string;
    author: string;
    category?: string;
    total_copies: number;
    available_copies: number;
    borrow_count: number;
  }>;
  top_student_readers: Array<{
    id: number;
    name: string;
    class: string;
    division: string;
    roll_no: string;
    library_card_no: string;
    email?: string | null;
    borrow_count: number;
  }>;
  top_teacher_readers: Array<{
    id: number;
    name: string;
    assigned_class?: string;
    username: string;
    email?: string | null;
    borrow_count: number;
  }>;
  class_wise_distribution: Array<{
    class_name: string;
    count: number;
  }>;
  category_wise_distribution: Array<{
    category: string;
    count: number;
  }>;
  monthly_trends: Array<{
    month: string;
    issues: number;
    returns: number;
  }>;
}

export interface HistoryLogItem {
  id: number;
  borrower_name: string;
  borrower_type: 'student' | 'teacher';
  borrower_info: string;
  email?: string | null;
  phone?: string | null;
  book_id: number;
  book_title: string;
  book_author: string;
  book_category?: string;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'issued' | 'returned' | 'overdue';
  days_held: number;
  is_late: boolean;
  issue_code?: string | null;
}

export interface IssueCode {
  id: number;
  book_id: number;
  book_title?: string;
  book_author?: string;
  first_two: string;
  last_two: string;
  full_code: string;
  created_at?: string;
}

export interface AuthState {
  userType: 'librarian' | 'student' | 'teacher' | null;
  currentUser: User | Student | Teacher | null;
  token?: string;
}

