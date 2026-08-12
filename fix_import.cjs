const fs = require('fs');
let code = fs.readFileSync('src/components/LibrarianDashboard.tsx', 'utf8');

if (!code.includes("ArrowLeftRight,")) {
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      if (!imports.includes('ArrowLeftRight')) imports.push('ArrowLeftRight');
      return `import { ${imports.join(', ')} } from 'lucide-react';`;
    }
  );
}
fs.writeFileSync('src/components/LibrarianDashboard.tsx', code);
