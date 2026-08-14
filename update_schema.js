const fs = require('fs');
let code = fs.readFileSync('src/db/db.ts', 'utf8');
console.log('db.ts updated');
