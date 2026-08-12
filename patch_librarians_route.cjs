const fs = require('fs');
let code = fs.readFileSync('src/routes/librarians.ts', 'utf8');

if (!code.includes("librariansRouter.put('/:id'")) {
  const putRoute = `
librariansRouter.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, password } = req.body;
  try {
    const updated = await db.update(librarians)
      .set({
        name: name || undefined,
        email: email || undefined,
        password_hash: password || undefined,
      })
      .where(eq(librarians.id, id))
      .returning();
      
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Librarian not found' });
    }
    res.json({ message: 'Librarian updated successfully', librarian: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;

  code = code.replace("export const librariansRouter = Router();", "export const librariansRouter = Router();\n" + putRoute);
  fs.writeFileSync('src/routes/librarians.ts', code);
}
