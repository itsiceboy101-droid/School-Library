const fs = require('fs');
let code = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');

code = code.replace(
  "Enter your student or teacher username to view active borrowings and account status",
  "Enter your student username to view active borrowings and account status"
);

code = code.replace(
  "Sign in with your registered Librarian email address to access the library system",
  "Sign in with your registered Librarian or Teacher email/username to access the system"
);

code = code.replace(
  'placeholder="librarian@school.com"',
  'placeholder="admin@school.com or teacher username"'
);

fs.writeFileSync('src/components/LoginModal.tsx', code);
