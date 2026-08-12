const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

code = code.replace(
  "student_id: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),",
  "student_id: integer('student_id').references(() => students.id, { onDelete: 'cascade' }),\n  teacher_id: integer('teacher_id').references(() => teachers.id, { onDelete: 'cascade' }),"
);
fs.writeFileSync('src/db/schema.ts', code);
console.log('done');
