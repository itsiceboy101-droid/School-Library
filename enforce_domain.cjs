const fs = require('fs');

// Update auth.ts
let authCode = fs.readFileSync('src/routes/auth.ts', 'utf8');

const loginLibrarianCheck = `  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (email.includes('@') && !email.toLowerCase().endsWith('@podar.org')) {
    return res.status(401).json({ error: 'Access denied: Only @podar.org email addresses are authorized.' });
  }
`;
authCode = authCode.replace(/  if \(!email \|\| !password\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Email and password are required' \}\);\s*\}/, loginLibrarianCheck);

const loginStudentTeacherCheck = `  if (!card_no || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (card_no.includes('@') && !card_no.toLowerCase().endsWith('@podar.org')) {
    return res.status(401).json({ error: 'Access denied: Only @podar.org email addresses are authorized.' });
  }
`;
authCode = authCode.replace(/  if \(!card_no \|\| !password\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Username and password are required' \}\);\s*\}/, loginStudentTeacherCheck);

fs.writeFileSync('src/routes/auth.ts', authCode);

// Update teachers.ts
let teachersCode = fs.readFileSync('src/routes/teachers.ts', 'utf8');
const teacherRegCheck = `  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: 'Name, email, username, and password are required' });
  }

  if (!email.toLowerCase().endsWith('@podar.org')) {
    return res.status(400).json({ error: 'Only @podar.org email addresses are allowed for teachers.' });
  }
`;
teachersCode = teachersCode.replace(/  if \(!name \|\| !email \|\| !username \|\| !password\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Name, email, username, and password are required' \}\);\s*\}/, teacherRegCheck);
fs.writeFileSync('src/routes/teachers.ts', teachersCode);

// Update librarians.ts
let libCode = fs.readFileSync('src/routes/librarians.ts', 'utf8');
const libRegCheck = `  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!email.toLowerCase().endsWith('@podar.org')) {
    return res.status(400).json({ error: 'Only @podar.org email addresses are allowed for librarians.' });
  }
`;
libCode = libCode.replace(/  if \(!name \|\| !email \|\| !password\) \{\s*return res\.status\(400\)\.json\(\{ error: 'All fields are required' \}\);\s*\}/, libRegCheck);
fs.writeFileSync('src/routes/librarians.ts', libCode);

console.log("Updated");
