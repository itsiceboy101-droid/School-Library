import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const librarians = pgTable('librarians', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'librarian' | 'head_librarian'
  created_at: timestamp('created_at').defaultNow(),
});

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  class: text('class').notNull(),
  division: text('division').notNull(),
  roll_no: text('roll_no').notNull(),
  library_card_no: text('library_card_no').notNull(),
  email: text('email'),
  phone: text('phone'),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  category: text('category'),
  isbn: text('isbn'),
  publisher: text('publisher'),
  total_copies: integer('total_copies').notNull(),
  available_copies: integer('available_copies').notNull(),
  added_at: timestamp('added_at').defaultNow(),
});

export const issued_books = pgTable('issued_books', {
  id: serial('id').primaryKey(),
  book_id: integer('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  student_id: integer('student_id').references(() => students.id, { onDelete: 'cascade' }),
  teacher_id: integer('teacher_id').references(() => teachers.id, { onDelete: 'cascade' }),
  issue_date: text('issue_date').notNull(), // YYYY-MM-DD
  due_date: text('due_date').notNull(), // YYYY-MM-DD
  return_date: text('return_date'),
  status: text('status').notNull(), // 'issued' | 'returned' | 'overdue'
  fine_amount: integer('fine_amount').default(0),
  issue_code: text('issue_code'),
});

export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  phone: text('phone'),
  password_hash: text('password_hash').notNull(),
  assigned_class: text('assigned_class'),
  assigned_division: text('assigned_division'),
  created_at: timestamp('created_at').defaultNow(),
});

export const issue_codes = pgTable('issue_codes', {
  id: serial('id').primaryKey(),
  book_id: integer('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  first_two: text('first_two').notNull(),
  last_two: text('last_two').notNull(),
  full_code: text('full_code').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
