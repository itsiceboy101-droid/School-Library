const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

if (!code.includes("podar.org")) {
  code = code.replace(
    /if \(!name\.trim\(\) \|\| !email\.trim\(\) \|\| !password\.trim\(\)\) \{\s*setError\('Name, email, and password are required'\);\s*return;\s*\}/,
    `if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required');
      return;
    }
    if (!email.trim().toLowerCase().endsWith('@podar.org')) {
      setError('Librarian email must be a valid @podar.org address.');
      return;
    }`
  );
  
  // also change the placeholder
  code = code.replace(
    /placeholder="librarian@school.com"/g,
    'placeholder="librarian@podar.org"'
  );
  
  fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', code);
}
