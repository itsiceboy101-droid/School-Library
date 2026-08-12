const fs = require('fs');

// Fix LibrariansManager
let lib = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');
if (!lib.includes("const [visiblePasswords")) {
  lib = lib.replace(
    "const [showAddModal, setShowAddModal] = useState(openAddModalInitially);",
    "const [showAddModal, setShowAddModal] = useState(openAddModalInitially);\n  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});\n  const toggleTablePassword = (id: number) => setVisiblePasswords(prev => ({...prev, [id]: !prev[id]}));"
  );
  fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', lib);
}

// Check TeachersManager TS errors
// Does TeachersManager need visiblePasswords fixed? I grepped it above and it matched "const [showAddModal, setShowAddModal] = useState(false);". So it might have already worked.
