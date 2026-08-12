const fs = require('fs');
let code = fs.readFileSync('src/routes/teachers.ts', 'utf8');

if (!code.includes("teachersRouter.put('/:id',")) {
  const putRoute = `
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
`;

  code = code.replace("export const teachersRouter = Router();", "export const teachersRouter = Router();\n" + putRoute);
  fs.writeFileSync('src/routes/teachers.ts', code);
}
