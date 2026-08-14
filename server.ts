import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import { authRouter } from "./src/routes/auth";
import { studentsRouter } from "./src/routes/students";
import { librariansRouter } from "./src/routes/librarians";
import { booksRouter } from "./src/routes/books";
import { issuesRouter } from "./src/routes/issues";
import { reportsRouter } from "./src/routes/reports";
import { studentPortalRouter } from "./src/routes/studentPortal";
import { teachersRouter } from "./src/routes/teachers";
import { issueCodesRouter } from "./src/routes/issueCodes";

const app = express();
const PORT = 3000;

app.use(express.json());

// Apply routers
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/librarians', librariansRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/books', booksRouter);
app.use('/api/issue', issuesRouter);
app.use('/api/return', issuesRouter);
app.use('/api/issued-books', issuesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/student', studentPortalRouter);
app.use('/api/issue-codes', issueCodesRouter);

// Database seeding - ensures master librarian exists
import { db } from './src/db/db';
import { librarians, books, issue_codes, issued_books } from './src/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function seedDatabase() {
    try {
        const existing = await db.query.librarians.findFirst({
            where: eq(librarians.id, 1)
        });
        if (!existing) {
            await db.insert(librarians).values({
                id: 1,
                name: 'Admin Access',
                email: 'admin@school.com',
                password_hash: 'Pass@321@123',
                role: 'head_librarian'
            });
            console.log('Seeded master librarian');
        }

        // FIX 1: Ensure all books have their issue codes fully generated up to total_copies
        const allBooks = await db.query.books.findMany();
        for (const book of allBooks) {
          const existingCodes = await db.query.issue_codes.findMany({ where: eq(issue_codes.book_id, book.id) });
          if (existingCodes.length < book.total_copies) {
            const firstTwo = existingCodes.length > 0 ? existingCodes[0].first_two : String(book.id % 100).padStart(2, '0');
            const insertions = [];
            for (let i = existingCodes.length + 1; i <= book.total_copies; i++) {
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
            }
          }
        }

        // FIX 2: Fix any active issues that have duplicate issue codes or null (N/A) issue codes
        // Import ne from drizzle-orm if not already imported
        const { ne } = await import('drizzle-orm');
        
        const activeIssuesToFix = await db.query.issued_books.findMany({
            where: ne(issued_books.status, 'returned'),
            orderBy: (issued_books, { asc }) => [asc(issued_books.id)]
        });

        const issuesByBook: Record<number, any[]> = {};
        for (const issue of activeIssuesToFix) {
            if (!issuesByBook[issue.book_id]) issuesByBook[issue.book_id] = [];
            issuesByBook[issue.book_id].push(issue);
        }

        for (const [bIdStr, issues] of Object.entries(issuesByBook)) {
            const bId = parseInt(bIdStr, 10);
            const codesForBook = await db.query.issue_codes.findMany({ where: eq(issue_codes.book_id, bId) });
            const allCodeStrings = codesForBook.map(c => c.full_code);
            
            const usedCodes = new Set<string>();
            const issuesNeedingCodes = [];

            for (const issue of issues) {
                // If it has a code, it's valid, and we haven't used it yet -> keep it
                if (issue.issue_code && !usedCodes.has(issue.issue_code) && allCodeStrings.includes(issue.issue_code)) {
                    usedCodes.add(issue.issue_code);
                } else {
                    // It's null, or duplicate, or an invalid code -> needs reassignment
                    issuesNeedingCodes.push(issue);
                }
            }

            const availableCodes = allCodeStrings.filter(c => !usedCodes.has(c));
            
            let codeIdx = 0;
            for (const issue of issuesNeedingCodes) {
                if (codeIdx < availableCodes.length) {
                    await db.update(issued_books)
                        .set({ issue_code: availableCodes[codeIdx] })
                        .where(eq(issued_books.id, issue.id));
                    codeIdx++;
                }
            }
        }

    } catch(e) {
        console.error('Error seeding database', e);
    }
}
seedDatabase();

// --- SERVER INTEGRATION & VITE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`School Library Portal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
