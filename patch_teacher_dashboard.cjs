const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Update activeTab state
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'class' | 'catalog'>('class');",
  "const [activeTab, setActiveTab] = useState<'class' | 'catalog' | 'myBooks' | 'history'>('class');"
);

// Add imports
code = code.replace(
  "import { CatalogSearch } from './student/CatalogSearch';",
  "import { CatalogSearch } from './student/CatalogSearch';\nimport { BookMarked, History } from 'lucide-react';"
);

// Add tabs
const newTabs = `
        <button
          onClick={() => setActiveTab('myBooks')}
          className={\`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 \${
            activeTab === 'myBooks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }\`}
        >
          <BookMarked className="w-4 h-4" />
          My Borrowed Books
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={\`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 \${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }\`}
        >
          <History className="w-4 h-4" />
          Borrowing History
        </button>
      </nav>
`;

code = code.replace(
  / *<\/button>\s*<\/nav>/,
  "        </button>\n" + newTabs
);

// Add empty sections for those tabs at the bottom
code = code.replace(
  "      {activeTab === 'catalog' && (\n        <CatalogSearch />\n      )}",
  `      {activeTab === 'catalog' && (
        <CatalogSearch />
      )}
      {activeTab === 'myBooks' && (
        <div className="bg-white rounded-2xl p-8 border border-blue-200 text-center text-slate-500 shadow-sm">
          <BookMarked className="w-12 h-12 mx-auto text-blue-200 mb-4" />
          <p className="font-semibold">No books borrowed yet.</p>
        </div>
      )}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-8 border border-blue-200 text-center text-slate-500 shadow-sm">
          <History className="w-12 h-12 mx-auto text-blue-200 mb-4" />
          <p className="font-semibold">No borrowing history available.</p>
        </div>
      )}`
);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
