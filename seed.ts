import { db } from './src/db/db';
import { librarians } from './src/db/schema';
async function test() {
  await db.insert(librarians).values({
    name: 'Admin Access',
    email: 'admin@school.com',
    password_hash: 'Pass@321@123',
    role: 'head_librarian'
  });
  console.log('seeded');
}
test();
