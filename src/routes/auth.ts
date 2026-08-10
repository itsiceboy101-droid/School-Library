import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { librarians, students } from '../db/schema';
import { eq, ilike } from 'drizzle-orm';

export const authRouter = Router();

authRouter.post('/login-librarian', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.query.librarians.findFirst({
      where: (librarians, { eq, or }) => or(
          eq(librarians.email, email),
          eq(librarians.name, email)
      ),
    });

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: Buffer.from(`librarian:${user.id}:${Date.now()}`).toString('base64'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

authRouter.post('/login-student', async (req: Request, res: Response) => {
  const { card_no, password } = req.body;
  if (!card_no || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const student = await db.query.students.findFirst({
      where: ilike(students.library_card_no, card_no),
    });

    if (!student || student.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: student.id,
        name: student.name,
        class: student.class,
        division: student.division,
        roll_no: student.roll_no,
        library_card_no: student.library_card_no,
      },
      token: Buffer.from(`student:${student.id}:${Date.now()}`).toString('base64'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
