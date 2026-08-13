import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const librarians = pgTable('librarians', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'librarian' | 'head_librarian'
  created_at: timestamp('created_at').defaultNow(),
});

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  class: varchar('class', { length: 50 }).notNull(),
  division: varchar('division', { length: 50 }).notNull(),
  roll_no: varchar('roll_no', { length: 50 }).notNull(),
  library_card_no: varchar('library_card_no', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  category: varchar('category', { length: 255 }),
  isbn: varchar('isbn', { length: 255 }),
  publisher: varchar('publisher', { length: 255 }),
  total_copies: integer('total_copies').notNull(),
  available_copies: integer('available_copies').notNull(),
  added_at: timestamp('added_at').defaultNow(),
});

export const issued_books = pgTable('issued_books', {
  id: serial('id').primaryKey(),
  book_id: integer('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  student_id: integer('student_id').references(() => students.id, { onDelete: 'cascade' }),
  teacher_id: integer('teacher_id').references(() => teachers.id, { onDelete: 'cascade' }),
  issue_date: varchar('issue_date', { length: 50 }).notNull(), // YYYY-MM-DD
  due_date: varchar('due_date', { length: 50 }).notNull(), // YYYY-MM-DD
  return_date: varchar('return_date', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull(), // 'issued' | 'returned' | 'overdue'
  fine_amount: integer('fine_amount').default(0),
  issue_code: varchar('issue_code', { length: 255 }),
});

export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  assigned_class: varchar('assigned_class', { length: 50 }),
  assigned_division: varchar('assigned_division', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const issue_codes = pgTable('issue_codes', {
  id: serial('id').primaryKey(),
  book_id: integer('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  first_two: varchar('first_two', { length: 2 }).notNull(),
  last_two: varchar('last_two', { length: 2 }).notNull(),
  full_code: varchar('full_code', { length: 4 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

