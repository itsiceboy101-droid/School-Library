import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// The Supabase connection string
let connectionString = process.env.DATABASE_URL;
if (!connectionString || !connectionString.startsWith('postgres')) {
  connectionString = 'postgresql://postgres:Ice_Boy%40147@db.wnggtbwdhtgqtlzpcwph.supabase.co:5432/postgres';
}

// Initialize postgres client
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Seed default Master Administrator / Librarian if empty
async function seedInitialData() {
  try {
    const existing = await db.query.librarians.findFirst();
    if (!existing) {
      await db.insert(schema.librarians).values({
        name: 'Teacher Access',
        email: 'admin@school.com',
        password_hash: 'Pass@321@123',
        role: 'head_librarian'
      });
      console.log('Seeded default librarian.');
    }
  } catch (err) {
    console.error('Failed to seed initial data:', err);
  }
}

seedInitialData();
