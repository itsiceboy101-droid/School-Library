import { db } from './src/db/db';
async function test() {
  const teachers = await db.query.teachers.findMany();
  console.log('teachers:', teachers);
  const librarians = await db.query.librarians.findMany();
  console.log('librarians:', librarians);
}
test();
