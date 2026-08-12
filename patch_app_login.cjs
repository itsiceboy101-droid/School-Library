const fs = require('fs');
let code = fs.readFileSync('src/routes/auth.ts', 'utf8');

code = code.replace(
  "      message: 'Login successful',\n      user: {",
  "      message: 'Login successful',\n      userType: 'librarian',\n      user: {"
);

fs.writeFileSync('src/routes/auth.ts', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "      if (res.ok && data.user) {\n        setUserType('librarian');",
  "      if (res.ok && data.user) {\n        setUserType(data.userType || 'librarian');"
);
fs.writeFileSync('src/App.tsx', appCode);
