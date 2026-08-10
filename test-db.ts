import { db } from './src/db/db';
async function test() {
  const allLibrarians = await db.query.librarians.findMany();
  console.log(allLibrarians);
  process.exit(0);
}
test();
