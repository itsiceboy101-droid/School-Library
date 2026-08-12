const fs = require('fs');

// Fix types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/  password\?: string;\n  password\?: string;/g, "  password?: string;");
fs.writeFileSync('src/types.ts', types);

// Fix LibrarianDashboard.tsx
let code = fs.readFileSync('src/components/LibrarianDashboard.tsx', 'utf8');
code = code.replace(
  "type TabType = 'search' | 'issue' | 'return' | 'teachers' | 'students' | 'books' | 'reports';",
  "type TabType = 'search' | 'desk' | 'teachers' | 'students' | 'books' | 'reports';"
);
if (!code.includes("ArrowLeftRight")) {
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

