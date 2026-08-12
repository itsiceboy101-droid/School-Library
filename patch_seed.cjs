const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "name: 'Teacher Access',\\n                email: 'teacher@school.com',\\n                password_hash: 'Pass@321@123',",
  "name: 'Admin Access',\n                email: 'admin@school.com',\n                password_hash: 'Pass@321@123',"
);

// We should also change it in the patch script if they are using simple replace.
code = code.replace(
  "name: 'Teacher Access',\n                email: 'teacher@school.com',\n                password_hash: 'Pass@321@123',",
  "name: 'Admin Access',\n                email: 'admin@school.com',\n                password_hash: 'Pass@321@123',"
);

fs.writeFileSync('server.ts', code);
