const fs = require('fs');
let code = fs.readFileSync('src/routes/auth.ts', 'utf8');

// Remove teacher login from login-student
const teacherLoginInStudent = `
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
        token: Buffer.from(\`teacher:\${teacher.id}:\${Date.now()}\`).toString('base64'),
      });
    }
`;
code = code.replace(teacherLoginInStudent.trim(), "");

// Add teacher login to login-librarian
const teacherLoginInLibrarian = `
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
        token: Buffer.from(\`teacher:\${teacher.id}:\${Date.now()}\`).toString('base64'),
      });
    }
`;

code = code.replace(
  "    if (!user || user.password_hash !== password) {",
  teacherLoginInLibrarian.trim() + "\n\n    if (!user || user.password_hash !== password) {"
);

fs.writeFileSync('src/routes/auth.ts', code);
