const fs = require('fs');
let code = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');

code = code.replace('Please enter Email / ID Name and Password', 'Please enter Username/Email and Password');

fs.writeFileSync('src/components/LoginModal.tsx', code);
