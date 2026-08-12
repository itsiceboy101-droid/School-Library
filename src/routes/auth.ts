import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { librarians, students, teachers } from '../db/schema';
import { eq, ilike, or, and } from 'drizzle-orm';

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

// Try finding Teacher
    const teacher = await db.query.teachers.findFirst({
      where: (teachers, { or, eq, ilike }) => or(
        ilike(teachers.username, email.trim()),
        ilike(teachers.email, email.trim())
      )
    });
    if (teacher && teacher.password_hash === password) {
      return res.json({
        message: 'Login successful',
        userType: 'teacher',
        user: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          username: teacher.username,
          assigned_class: teacher.assigned_class,
          assigned_division: teacher.assigned_division,
        },
        token: Buffer.from(`teacher:${teacher.id}:${Date.now()}`).toString('base64'),
      });
    }

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      userType: 'librarian',
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
    // 1. Try finding student by library_card_no / username
    const student = await db.query.students.findFirst({
      where: ilike(students.library_card_no, card_no.trim()),
    });

    if (student && student.password_hash === password) {
      // Find class teacher name for student's class and division
      let classTeacherName: string | null = 'Not Assigned';
      if (student.class && student.division) {
        const classTeacher = await db.query.teachers.findFirst({
          where: (teachers, { and, eq }) => and(
            eq(teachers.assigned_class, String(student.class)),
            eq(teachers.assigned_division, String(student.division))
          )
        });
        if (classTeacher) {
          classTeacherName = classTeacher.name;
        }
      }

      return res.json({
        message: 'Login successful',
        userType: 'student',
        user: {
          id: student.id,
          name: student.name,
          class: student.class,
          division: student.division,
          roll_no: student.roll_no,
          library_card_no: student.library_card_no,
          class_teacher_name: classTeacherName,
        },
        token: Buffer.from(`student:${student.id}:${Date.now()}`).toString('base64'),
      });
    }

    // 2. If student not found or password didn't match, try finding Teacher
    const teacher = await db.query.teachers.findFirst({
      where: (teachers, { or, eq, ilike }) => or(
        ilike(teachers.username, card_no.trim()),
        ilike(teachers.email, card_no.trim())
      )
    });

    if (teacher && teacher.password_hash === password) {
      return res.json({
        message: 'Login successful',
        userType: 'teacher',
        user: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          username: teacher.username,
          assigned_class: teacher.assigned_class,
          assigned_division: teacher.assigned_division,
        },
        token: Buffer.from(`teacher:${teacher.id}:${Date.now()}`).toString('base64'),
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

