const fs = require('fs');

let libCode = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');
libCode = libCode.replace(
  /placeholder="name@school\.edu"/,
  'placeholder="name@podar.org"\n                  pattern=".*@podar\\\\.org$"\n                  title="Email must end with @podar.org"'
);
fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', libCode);

let tCode = fs.readFileSync('src/components/librarian/TeachersManager.tsx', 'utf8');
tCode = tCode.replace(
  /placeholder="teacher@school\.edu"/,
  'placeholder="teacher@podar.org"\n                  pattern=".*@podar\\\\.org$"\n                  title="Email must end with @podar.org"'
);
tCode = tCode.replace(
  /placeholder="name@school\.edu"/,
  'placeholder="name@podar.org"\n                  pattern=".*@podar\\\\.org$"\n                  title="Email must end with @podar.org"'
);
fs.writeFileSync('src/components/librarian/TeachersManager.tsx', tCode);

console.log("Updated managers UI");
