import { db } from './src/db/db.js';
import { books, issue_codes } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const allBooks = await db.query.books.findMany();
  for (const book of allBooks) {
    const existing = await db.query.issue_codes.findMany({ where: eq(issue_codes.book_id, book.id) });
    if (existing.length === 0) {
      const firstTwo = String(book.id % 100).padStart(2, '0');
      const insertions = [];
      for (let i = 1; i <= book.total_copies; i++) {
        const formattedLastTwo = String(i).padStart(2, '0');
        insertions.push({
          book_id: book.id,
          first_two: firstTwo,
          last_two: formattedLastTwo,
          full_code: `${firstTwo}${formattedLastTwo}`,
        });
      }
      if (insertions.length > 0) {
        await db.insert(issue_codes).values(insertions);
        console.log(`Generated ${insertions.length} codes for book: ${book.title}`);
      }
    } else if (book.total_copies > existing.length) {
      const firstTwo = existing[0].first_two;
      const insertions = [];
      for (let i = existing.length + 1; i <= book.total_copies; i++) {
        const formattedLastTwo = String(i).padStart(2, '0');
        insertions.push({
          book_id: book.id,
          first_two: firstTwo,
          last_two: formattedLastTwo,
          full_code: `${firstTwo}${formattedLastTwo}`,
        });
      }
      if (insertions.length > 0) {
        await db.insert(issue_codes).values(insertions);
        console.log(`Generated ${insertions.length} additional codes for book: ${book.title}`);
      }
    }
  }
  console.log("Done!");
  process.exit(0);
}
run();
