const fs = require('fs');
const code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');
const start = code.indexOf('<td className="px-6 py-4 text-right">');
const end = code.indexOf('</td>', start) + 5;
console.log(code.substring(start, end));
