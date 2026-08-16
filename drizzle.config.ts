import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres') ? process.env.DATABASE_URL : 'postgresql://postgres:Ice_Boy%40147@db.wnggtbwdhtgqtlzpcwph.supabase.co:5432/postgres',
  },
});
