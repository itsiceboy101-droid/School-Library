const fs = require('fs');
const code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');
const start = code.indexOf('<tbody>');
const end = code.indexOf('</tbody>');
console.log(code.substring(start, end));
