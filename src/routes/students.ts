import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students, issued_books } from '../db/schema';
import { eq, like, or } from 'drizzle-orm';

export const studentsRouter = Router();

studentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allStudents = await db.query.students.findMany();
    // Sort logic in JS to properly parse strings to integers for class and roll no
    allStudents.sort((a, b) => {
        // Parse Class (e.g. "Class 9" -> 9, or "9" -> 9)
        const classAStr = String(a.class || '').replace(/\D/g, '');
        const classBStr = String(b.class || '').replace(/\D/g, '');
        const classA = parseInt(classAStr, 10) || 0;
        const classB = parseInt(classBStr, 10) || 0;
        
        if (classA !== classB) return classA - classB;

        // Parse Division (e.g. "Div A" -> "A")
        const divA = String(a.division || '').toUpperCase().replace(/[^A-Z]/g, '');
        const divB = String(b.division || '').toUpperCase().replace(/[^A-Z]/g, '');
        if (divA !== divB) return divA.localeCompare(divB);

        // Parse Roll No (e.g. "Roll #35" -> 35, or "35" -> 35)
        const rollA = parseInt(String(a.roll_no || '').replace(/\D/g, ''), 10) || 0;
        const rollB = parseInt(String(b.roll_no || '').replace(/\D/g, ''), 10) || 0;
        return rollA - rollB;
    });

    const studentsWithCounts = [];
    for (const s of allStudents) {
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

    res.json(studentsWithCounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

studentsRouter.post('/', async (req: Request, res: Response) => {
  const { name, class: cls, division, roll_no, password, library_card_no } = req.body;
  if (!name || !cls || !division || !roll_no || !password || !library_card_no) {
    return res.status(400).json({ error: 'All student fields are required' });
  }

  try {
    const existing = await db.query.students.findFirst({ where: eq(students.library_card_no, library_card_no) });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const newStudent = await db.insert(students).values({
      name,
      class: cls,
      division,
      roll_no,
      password_hash: password,
      library_card_no,
    }).returning();

    res.status(201).json({
      message: 'Student account created',
      student: newStudent[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

studentsRouter.put('/:id', async (req: Request, res: Response) => {
    const { name, class: cls, division, roll_no, password, library_card_no } = req.body;
    try {
        if (library_card_no) {
            const existing = await db.query.students.findFirst({ where: eq(students.library_card_no, library_card_no) });
            if (existing && existing.id !== parseInt(req.params.id, 10)) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }
        
        const updated = await db.update(students).set({
            name,
            class: cls,
            division,
            roll_no,
            ...(library_card_no ? { library_card_no } : {}),
            ...(password ? { password_hash: password } : {})
        }).where(eq(students.id, parseInt(req.params.id, 10))).returning();
        
        if (updated.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student updated', student: updated[0] });
    } catch(error: any) {
        res.status(500).json({ error: error.message });
    }
});

studentsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await db.delete(students).where(eq(students.id, parseInt(req.params.id, 10))).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: `Student account deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
