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

// Database seeding - ensures master librarian exists
import { db } from './src/db/db';
import { librarians } from './src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function seedDatabase() {
    try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS teachers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            assigned_class VARCHAR(50),
            assigned_division VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);

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
