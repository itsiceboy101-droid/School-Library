const fs = require('fs');
let code = fs.readFileSync('src/routes/issues.ts', 'utf8');

code = code.replace(
  "const numCopies = (tId && copies) ? parseInt(copies, 10) : 1;",
  "const numCopies = (tId && copies) ? parseInt(String(copies), 10) : 1;"
);
fs.writeFileSync('src/routes/issues.ts', code);
