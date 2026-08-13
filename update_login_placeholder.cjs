const fs = require('fs');

let code = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');

code = code.replace(
  /placeholder="admin@school\.com or teacher username"/,
  'placeholder="@podar.org email or username"'
);

code = code.replace(
  /'Sign in with your registered Librarian or Teacher email\/username to access the system'/,
  "'Sign in with your @podar.org email or username to access the system'"
);

fs.writeFileSync('src/components/LoginModal.tsx', code);

console.log("Updated LoginModal");
