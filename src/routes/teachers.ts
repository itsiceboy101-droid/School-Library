import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { teachers, students } from '../db/schema';
import { eq, and, like } from 'drizzle-orm';

export const teachersRouter = Router();

teachersRouter.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, username, password } = req.body;
  try {
    const updated = await db.update(teachers)
      .set({
        name: name || undefined,
        email: email || undefined,
        username: username || undefined,
        password_hash: password || undefined,
      })
      .where(eq(teachers.id, id))
      .returning();
      
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ message: 'Teacher updated successfully', teacher: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Get all teachers
teachersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allTeachers = await db.query.teachers.findMany();
    const result = allTeachers.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      username: t.username,
      password: t.password_hash,
      assigned_class: t.assigned_class,
      assigned_division: t.assigned_division,
      created_at: t.created_at,
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new teacher
teachersRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, username, password, assigned_class, assigned_division } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: 'Name, email, username, and password are required' });
  }

  if (!email.toLowerCase().endsWith('@podar.org')) {
    return res.status(400).json({ error: 'Only @podar.org email addresses are allowed for teachers.' });
  }


  try {
    const existingEmail = await db.query.teachers.findFirst({
      where: like(teachers.email, email.trim()),
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Teacher email already registered' });
    }

    const existingUsername = await db.query.teachers.findFirst({
      where: like(teachers.username, username.trim()),
    });
    if (existingUsername) {
      return res.status(400).json({ error: 'Teacher username already exists' });
    }

    // If assigning a class, unassign any existing teacher from that class
    if (assigned_class && assigned_division) {
      const currentClassTeacher = await db.query.teachers.findFirst({
        where: (teachers, { and, eq }) => and(
          eq(teachers.assigned_class, String(assigned_class)),
          eq(teachers.assigned_division, String(assigned_division))
        )
      });
      if (currentClassTeacher) {
        await db.update(teachers)
          .set({ assigned_class: null, assigned_division: null })
          .where(eq(teachers.id, currentClassTeacher.id));
      }
    }

    const [newTeacher] = await db.insert(teachers).values({
      name: name.trim(),
      email: email.trim(),
      username: username.trim(),
      password_hash: password,
      assigned_class: assigned_class ? String(assigned_class) : null,
      assigned_division: assigned_division ? String(assigned_division).toUpperCase() : null,
    }).returning();

    res.json({
      message: 'Teacher created successfully',
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        username: newTeacher.username,
        assigned_class: newTeacher.assigned_class,
        assigned_division: newTeacher.assigned_division,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update teacher's assigned class/division
teachersRouter.put('/:id/assign', async (req: Request, res: Response) => {
  const teacherId = parseInt(req.params.id, 10);
  const { assigned_class, assigned_division } = req.body;

  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId)
    });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Unassign previous teacher for this class/division if specified
    if (assigned_class && assigned_division) {
      const existingClassTeacher = await db.query.teachers.findFirst({
        where: (teachers, { and, eq }) => and(
          eq(teachers.assigned_class, String(assigned_class)),
          eq(teachers.assigned_division, String(assigned_division))
        )
      });
      if (existingClassTeacher && existingClassTeacher.id !== teacherId) {
        await db.update(teachers)
          .set({ assigned_class: null, assigned_division: null })
          .where(eq(teachers.id, existingClassTeacher.id));
      }
    }

    await db.update(teachers)
      .set({
        assigned_class: assigned_class ? String(assigned_class) : null,
        assigned_division: assigned_division ? String(assigned_division).toUpperCase() : null,
      })
      .where(eq(teachers.id, teacherId));

    res.json({ message: 'Teacher class assignment updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete teacher
teachersRouter.delete('/:id', async (req: Request, res: Response) => {
  const teacherId = parseInt(req.params.id, 10);
  try {
    await db.delete(teachers).where(eq(teachers.id, teacherId));
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assign class teacher for a specific class & division
teachersRouter.post('/assign-class-teacher', async (req: Request, res: Response) => {
  const { class_name, division, teacher_id } = req.body;

  if (!class_name || !division) {
    return res.status(400).json({ error: 'Class name and division are required' });
  }

  try {
    // 1. Clear any teacher previously assigned to this class and division
    const existingClassTeachers = await db.query.teachers.findMany({
      where: (teachers, { and, eq }) => and(
        eq(teachers.assigned_class, String(class_name)),
        eq(teachers.assigned_division, String(division).toUpperCase())
      )
    });

    for (const t of existingClassTeachers) {
      await db.update(teachers)
        .set({ assigned_class: null, assigned_division: null })
        .where(eq(teachers.id, t.id));
    }

    // 2. If a teacher_id is provided, assign them to this class
    if (teacher_id) {
      const tid = parseInt(teacher_id, 10);
      await db.update(teachers)
        .set({
          assigned_class: String(class_name),
          assigned_division: String(division).toUpperCase()
        })
        .where(eq(teachers.id, tid));
    }

    res.json({ message: 'Class teacher assigned successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get students for a teacher's class
teachersRouter.get('/:id/students', async (req: Request, res: Response) => {
  const teacherId = parseInt(req.params.id, 10);
  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId)
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (!teacher.assigned_class || !teacher.assigned_division) {
      return res.json({ isClassTeacher: false, students: [] });
    }

    const classStudents = await db.query.students.findMany({
      where: (students, { and, eq }) => and(
        eq(students.class, teacher.assigned_class!),
        eq(students.division, teacher.assigned_division!)
      )
    });

    const studentsWithCounts = [];
    for (const s of classStudents) {
        const activeIssues = await db.query.issued_books.findMany({
            where: (issued_books, { and, eq, ne }) => and(
                eq(issued_books.student_id, Number(s.id)),
                ne(issued_books.status, 'returned')
            )
        });
        studentsWithCounts.push({
            ...s,
            password: s.password_hash,
            active_issues_count: activeIssues.length
        });
    }

    res.json({
      isClassTeacher: true,
      assigned_class: teacher.assigned_class,
      assigned_division: teacher.assigned_division,
      students: studentsWithCounts
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

teachersRouter.get('/:id/books', async (req: Request, res: Response) => {
  const teacherId = parseInt(req.params.id, 10);
  try {
    const teacherIssues = await db.query.issued_books.findMany({
      where: (issued_books, { eq }) => eq(issued_books.teacher_id, teacherId)
    });
    
    const result = [];
    for (const ib of teacherIssues) {
      const book = await db.query.books.findFirst({ where: (books, { eq }) => eq(books.id, ib.book_id) });
      result.push({
        id: ib.id,
        book_id: ib.book_id,
        book_title: book?.title || "Unknown Book",
        book_author: book?.author || "",
        issue_date: ib.issue_date,
        due_date: ib.due_date,
        return_date: ib.return_date,
        status: ib.status,
        fine_amount: ib.fine_amount
      });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
