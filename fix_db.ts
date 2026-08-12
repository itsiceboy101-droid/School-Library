import { db } from './src/db/db';
import { librarians } from './src/db/schema';
import { eq } from 'drizzle-orm';
async function run() {
  await db.update(librarians).set({
    name: 'Admin Access',
    email: 'admin@school.com'
  }).where(eq(librarians.id, 1));
}
run();
