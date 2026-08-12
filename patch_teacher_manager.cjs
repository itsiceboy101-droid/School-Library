const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/TeachersManager.tsx', 'utf8');

if (!code.includes("const [editingTeacher")) {
  code = code.replace(
    "const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);",
    "const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);\n  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);\n  const [editName, setEditName] = useState('');\n  const [editEmail, setEditEmail] = useState('');\n  const [editUsername, setEditUsername] = useState('');\n  const [editPassword, setEditPassword] = useState('');"
  );
  
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
  const handleEditClick = (t: Teacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditUsername(t.username);
    setEditPassword(t.password || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher) return;
    try {
      const res = await fetch(\`/api/teachers/\${editingTeacher.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          username: editUsername,
          password: editPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast('Teacher info updated');
        setEditingTeacher(null);
        fetchTeachers();
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating teacher');
    }
  };
`;
  code = code.replace(
    "const handleDeleteClick = (teacher: Teacher) => {",
    editLogic + "\n  const handleDeleteClick = (teacher: Teacher) => {"
  );

  fs.writeFileSync('src/components/librarian/TeachersManager.tsx', code);
}
