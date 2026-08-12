const fs = require('fs');
let code = fs.readFileSync('src/components/LibrarianDashboard.tsx', 'utf8');

// Replace TabType
code = code.replace(
  "type TabType = 'search' | 'issue' | 'return' | 'teachers' | 'students' | 'books' | 'reports';",
  "type TabType = 'search' | 'desk' | 'teachers' | 'students' | 'books' | 'reports';"
);

// Add state for desk sub-tab
code = code.replace(
  "const [activeTab, setActiveTab] = useState<TabType>('search');",
  "const [activeTab, setActiveTab] = useState<TabType>('search');\n  const [deskSubTab, setDeskSubTab] = useState<'issue' | 'return'>('issue');"
);

// Remove 'issue' and 'return' from navItems and add 'desk'
code = code.replace(
  "    { id: 'issue', label: 'Issue Book', icon: <BookPlus className=\"w-4 h-4\" /> },\n    { id: 'return', label: 'Return Book', icon: <ArrowDownLeft className=\"w-4 h-4\" /> },",
  "    { id: 'desk', label: 'Issue & Return Desk', icon: <ArrowLeftRight className=\"w-4 h-4\" /> },"
);

// Add ArrowLeftRight to lucide-react imports
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

// Replace tab content rendering
const oldTabsContent = `
        {activeTab === 'issue' && (
          <IssueBook
            preselectedStudent={preselectedStudent}
            onSuccessToast={onSuccessToast}
          />
        )}
        {activeTab === 'return' && <ReturnBook onSuccessToast={onSuccessToast} />}
`;

const newTabsContent = `
        {activeTab === 'desk' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 bg-white border border-blue-200 p-1.5 rounded-2xl max-w-sm mx-auto shadow-xs">
              <button
                onClick={() => setDeskSubTab('issue')}
                className={\`flex-1 py-2 rounded-xl text-xs font-bold transition \${
                  deskSubTab === 'issue'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <BookPlus className="w-4 h-4 inline-block mr-1" />
                Issue Book
              </button>
              <button
                onClick={() => setDeskSubTab('return')}
                className={\`flex-1 py-2 rounded-xl text-xs font-bold transition \${
                  deskSubTab === 'return'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <ArrowDownLeft className="w-4 h-4 inline-block mr-1" />
                Return Book
              </button>
            </div>
            {deskSubTab === 'issue' ? (
              <IssueBook
                preselectedStudent={preselectedStudent}
                onSuccessToast={onSuccessToast}
              />
            ) : (
              <ReturnBook onSuccessToast={onSuccessToast} />
            )}
          </div>
        )}
`;

code = code.replace(oldTabsContent.trim(), newTabsContent.trim());

fs.writeFileSync('src/components/LibrarianDashboard.tsx', code);
