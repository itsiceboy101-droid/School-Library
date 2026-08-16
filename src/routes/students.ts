import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { students, issued_books } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getStudentRestrictionStatus } from '../db/utils';

export const studentsRouter = Router();

// GET /api/students/search - filter students by multiple fields
studentsRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { name, class: cls, division, roll_no, card } = req.query;
    let allStudents = await db.query.students.findMany();

    if (name) {
      const q = String(name).toLowerCase().trim();
      allStudents = allStudents.filter(s => String(s.name || '').toLowerCase().includes(q));
    }
    if (cls) {
      allStudents = allStudents.filter(s => String(s.class || '').trim().toLowerCase() === String(cls).trim().toLowerCase());
    }
    if (division) {
      allStudents = allStudents.filter(s => String(s.division || '').trim().toUpperCase() === String(division).trim().toUpperCase());
    }
    if (roll_no) {
      const targetRoll = String(roll_no).replace(/\D/g, '');
      allStudents = allStudents.filter(s => String(s.roll_no || '').replace(/\D/g, '') === targetRoll);
    }
    if (card) {
      const qCard = String(card).toLowerCase().trim();
      allStudents = allStudents.filter(s => String(s.library_card_no || '').toLowerCase().includes(qCard));
    }

    const results = [];
    for (const s of allStudents) {
      const restriction = await getStudentRestrictionStatus(Number(s.id));
      const activeIssues = await db.query.issued_books.findMany({
        where: (issued_books, { and, eq, ne }) => and(
          eq(issued_books.student_id, Number(s.id)),
          ne(issued_books.status, 'returned')
        )
      });
      results.push({
        ...s,
        password: s.password_hash,
        is_restricted: restriction.isRestricted,
        restriction_reason: restriction.reason,
        restriction_until: restriction.untilDate,
        active_issues_count: activeIssues.length
      });
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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
        const restriction = await getStudentRestrictionStatus(Number(s.id));
        const activeIssues = await db.query.issued_books.findMany({
            where: (issued_books, { and, eq, ne }) => and(
                eq(issued_books.student_id, Number(s.id)),
                ne(issued_books.status, 'returned')
            )
        });
        studentsWithCounts.push({
            ...s,
            password: s.password_hash,
            is_restricted: restriction.isRestricted,
            restriction_reason: restriction.reason,
            restriction_until: restriction.untilDate,
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
    // Check if duplicate student has this library_card_no globally
    const existingUsername = await db.query.students.findFirst({
      where: (students, { eq }) => eq(students.library_card_no, String(library_card_no).trim())
    });
    
    if (existingUsername) {
      return res.status(400).json({ error: `Username/ID '${library_card_no}' is already taken by another student.` });
    }

    const newStudent = await db.insert(students).values({
      name: name.trim(),
      class: String(cls).trim(),
      division: String(division).trim(),
      roll_no: String(roll_no).trim(),
      password_hash: password.trim(),
      library_card_no: String(library_card_no).trim(),
    }).returning();

    res.status(201).json({
      message: 'Student account created successfully',
      student: newStudent[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

studentsRouter.put('/:id', async (req: Request, res: Response) => {
    const studentId = parseInt(req.params.id, 10);
    const { name, class: cls, division, roll_no, password, library_card_no } = req.body;
    try {
        if (library_card_no) {
            const existingUsername = await db.query.students.findFirst({
              where: (students, { and, eq, ne }) => and(
                eq(students.library_card_no, String(library_card_no).trim()),
                ne(students.id, studentId)
              )
            });
            if (existingUsername) {
                return res.status(400).json({ error: `Username/ID '${library_card_no}' is already taken by another student.` });
            }
        }
        
        const updated = await db.update(students).set({
            name: name ? name.trim() : undefined,
            class: cls ? String(cls).trim() : undefined,
            division: division ? String(division).trim() : undefined,
            roll_no: roll_no ? String(roll_no).trim() : undefined,
            ...(library_card_no ? { library_card_no: String(library_card_no).trim() } : {}),
            ...(password ? { password_hash: password.trim() } : {})
        }).where(eq(students.id, studentId)).returning();
        
        if (updated.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student updated successfully', student: updated[0] });
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

