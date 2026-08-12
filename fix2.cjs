const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

// Replace the Login page text first
let loginCode = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');
loginCode = loginCode.replace('Librarian Email', 'Username/Email');
fs.writeFileSync('src/components/LoginModal.tsx', loginCode);

// Now for LibrariansManager
// Let's first make the action column correct.
// We want !isMaster to show Edit and Delete.
// isMaster should show ONLY Protected Account (AND NO EDIT BUTTON!).
