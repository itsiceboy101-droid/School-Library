const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/IssueBook.tsx', 'utf8');

code = code.replace(
  "setSelectedBookId(b.id.toString());\n                        setBookSearch(b.title);",
  "setSelectedBookId(b.id.toString());\n                        setCopies(1);\n                        setBookSearch(b.title);"
);

fs.writeFileSync('src/components/librarian/IssueBook.tsx', code);
