import { db } from './src/db/db';
import { books } from './src/db/schema';
async function test() {
  try {
    await db.insert(books).values({
      title: 'Test',
      author: 'Test',
      total_copies: 5,
      available_copies: 5,
      // missing required fields?
    } as any);
  } catch (e: any) {
    console.log("Caught:", e.message);
  }
}
test();
