const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/LibrariansManager.tsx', 'utf8');

if (!code.includes("const [editingLibrarian")) {
  code = code.replace(
    "const [deletingLibrarian, setDeletingLibrarian] = useState<LibrarianAccount | null>(null);",
    "const [deletingLibrarian, setDeletingLibrarian] = useState<LibrarianAccount | null>(null);\n  const [editingLibrarian, setEditingLibrarian] = useState<LibrarianAccount | null>(null);\n  const [editName, setEditName] = useState('');\n  const [editEmail, setEditEmail] = useState('');\n  const [editPassword, setEditPassword] = useState('');"
  );
  
  // Also add imports: Edit, Eye, EyeOff if not present
  if (!code.includes("import { Shield")) {
    // it probably does, let's just use string replace on lucide-react import
  }
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      ['Edit2', 'Eye', 'EyeOff', 'Save', 'X'].forEach(i => {
        if (!imports.includes(i)) imports.push(i);
      });
      return `import { ${imports.join(', ')} } from 'lucide-react';`;
    }
  );

  const editLogic = `
  const handleEditClick = (lib: LibrarianAccount) => {
    setEditingLibrarian(lib);
    setEditName(lib.name);
    setEditEmail(lib.email);
    setEditPassword(lib.password || '');
  };

  const handleSaveEdit = async () => {
    if (!editingLibrarian) return;
    try {
      const res = await fetch(\`/api/librarians/\${editingLibrarian.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast('Librarian info updated');
        setEditingLibrarian(null);
        fetchLibrarians();
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating librarian');
    }
  };
`;
  code = code.replace(
    "const handleDeleteClick = (lib: LibrarianAccount) => {",
    editLogic + "\n  const handleDeleteClick = (lib: LibrarianAccount) => {"
  );

  // Update TR to handle editing mode
  code = code.replace(
    /<tr key=\{lib\.id\} className="hover:bg-blue-50\/50 transition">([\s\S]*?)<\/tr>/g,
    (match) => {
      // We will replace the entire map return inside JSX... actually regex replacing inside React is tricky.
      return match;
    }
  );
  
  fs.writeFileSync('src/components/librarian/LibrariansManager.tsx', code);
}
