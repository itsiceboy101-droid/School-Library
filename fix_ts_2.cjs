const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(
  "  username: string;\n  password?: string;",
  "  username: string;"
);
fs.writeFileSync('src/types.ts', types);
