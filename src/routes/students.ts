import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students } from '../db/schema';
import { eq, ilike, or } from 'drizzle-orm';

export const studentsRouter = Router();

studentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allStudents = await db.query.students.findMany();
    // Sort logic in JS to properly parse strings to integers for class and roll no
    allStudents.sort((a, b) => {
        // Parse Class (e.g. "Class 9" -> 9, or "9" -> 9)
        const classAStr = a.class.replace(/\D/g, '');
        const classBStr = b.class.replace(/\D/g, '');
        const classA = parseInt(classAStr, 10) || 0;
        const classB = parseInt(classBStr, 10) || 0;
        
        if (classA !== classB) return classA - classB;

        // Parse Division (e.g. "Div A" -> "A")
        const divA = a.division.toUpperCase().replace(/[^A-Z]/g, '');
        const divB = b.division.toUpperCase().replace(/[^A-Z]/g, '');
        if (divA !== divB) return divA.localeCompare(divB);

        // Parse Roll No (e.g. "Roll #35" -> 35, or "35" -> 35)
        const rollA = parseInt(a.roll_no.replace(/\D/g, ''), 10) || 0;
        const rollB = parseInt(b.roll_no.replace(/\D/g, ''), 10) || 0;
        return rollA - rollB;
    });

    res.json(allStudents.map(s => ({
        ...s,
        active_issues_count: 0
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

studentsRouter.post('/', async (req: Request, res: Response) => {
  const { name, cls, division, roll_no, password } = req.body;
  if (!name || !cls || !division || !roll_no || !password) {
    return res.status(400).json({ error: 'All student fields are required' });
  }

  try {
    const newStudent = await db.insert(students).values({
      name,
      class: cls,
      division,
      roll_no,
      password_hash: password,
      library_card_no: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
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
    const { name, cls, division, roll_no, password } = req.body;
    try {
        const updated = await db.update(students).set({
            name,
            class: cls,
            division,
            roll_no,
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
