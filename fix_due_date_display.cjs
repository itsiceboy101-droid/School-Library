const fs = require('fs');

const files = [
  'src/components/TeacherDashboard.tsx',
  'src/components/student/MyBooks.tsx',
  'src/components/librarian/ReturnBook.tsx',
  'src/components/librarian/ReportsManager.tsx'
];

for (const file of files) {
  try {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace standard {item.due_date} or {b.due_date} with ternary check
    code = code.replace(/\{([a-zA-Z0-9_]+)\.due_date\}/g, '{new Date($1.due_date).getFullYear() > 2030 ? "No Limit" : $1.due_date}');
    
    fs.writeFileSync(file, code);
    console.log("Updated", file);
  } catch (err) {
    console.error("Failed on", file, err.message);
  }
}
