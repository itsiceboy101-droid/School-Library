import { db } from './src/db/db';
import { teachers } from './src/db/schema';
import { or, eq, ilike } from 'drizzle-orm';

async function test() {
  try {
    const teacher = await db.query.teachers.findFirst({
      where: (teachers, { or, eq, ilike }) => or(
        ilike(teachers.username, 'teacher1'),
        ilike(teachers.email, 'teacher1')
      )
    });
    console.log(teacher);
  } catch (e) {
    console.error(e);
  }
}
test();
