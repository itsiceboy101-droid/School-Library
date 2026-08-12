import { db } from './src/db/db';
import { teachers } from './src/db/schema';
async function test() {
  await db.insert(teachers).values([
    {
      name: 'Teacher 1',
      username: 'teacher1',
      email: 'teacher1@school.com',
      password_hash: 'password123',
      assigned_class: '10',
      assigned_division: 'A',
    }
  ]);
  console.log('seeded');
}
test();
