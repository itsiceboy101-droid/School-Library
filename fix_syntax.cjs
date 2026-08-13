const fs = require('fs');

for (const file of ['src/components/librarian/ReturnBook.tsx', 'src/components/librarian/ReportsManager.tsx']) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.endsWith('    </div>\n  );\n};')) {
    code = code.replace(/    <\/div>\n  \);\n};\s*$/, '      </div>\n    </div>\n  );\n};');
    fs.writeFileSync(file, code);
  }
}
