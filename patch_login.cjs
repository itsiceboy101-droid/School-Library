const fs = require('fs');
let code = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');

code = code.replace(/Librarian & Staff Portal/g, 'Librarian & Teacher Portal');
code = code.replace(/Student & Teacher Portal/g, 'Student Portal');
code = code.replace(/Librarian & Staff Login/g, 'Librarian & Teacher Login');
code = code.replace(/Student & Teacher Portal Access/g, 'Student Portal Access');

fs.writeFileSync('src/components/LoginModal.tsx', code);
