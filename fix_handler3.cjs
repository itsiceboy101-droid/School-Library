const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

const start = code.indexOf('const handleSaveStudent =');
const end = code.indexOf('const filteredStudents =');

console.log('start', start, 'end', end);
