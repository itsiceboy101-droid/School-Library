const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

code = code.replace(
  "import { School, UserPlus, Users, Search, AlertCircle, BookOpen, Key, Eye, EyeOff, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';",
  "import { School, UserPlus, Users, Search, AlertCircle, BookOpen, Key, Eye, EyeOff, ShieldAlert, CheckCircle2, RefreshCw, Pencil, Trash2, X } from 'lucide-react';"
);

// Add editingStudent and deletingStudent states
const stateStr = `  const [error, setError] = useState<string | null>(null);`;
const newStateStr = `  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});`;
code = code.replace(stateStr, newStateStr);

// toggleTablePassword function
const fetchCode = `  const fetchClassStudents = async () => {`;
const toggleCode = `  const toggleTablePassword = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setRollNo('');
    setCardNo('');
    setPassword('');
    setError(null);
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setRollNo(student.roll_no);
    setCardNo(student.library_card_no);
    setPassword(student.password || '');
    setError(null);
    setShowAddModal(true);
  };
  
  const handleDeleteClick = (student: Student) => {
    setDeletingStudent(student);
  };

  const confirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      const res = await fetch(\`/api/students/\${deletingStudent.id}\`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        onSuccessToast(\`Student \${deletingStudent.name} removed\`);
        fetchClassStudents();
      } else {
        console.error(data.error || 'Could not delete student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingStudent(null);
    }
  };

  const fetchClassStudents = async () => {`;
code = code.replace(fetchCode, toggleCode);

// replace handleAddStudent with handleSaveStudent
const handleAddCode = `  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !rollNo.trim() || !cardNo.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Auto-pad single digit roll numbers with leading zero
    const finalRollNo = rollNo.trim().length === 1 ? '0' + rollNo.trim() : rollNo.trim();

    setAddLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: teacher.assigned_class,
          division: teacher.assigned_division,
          roll_no: finalRollNo,
          library_card_no: cardNo.trim().toUpperCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add student');
      } else {
        onSuccessToast(\`Student \${name} added to Class \${teacher.assigned_class}-\${teacher.assigned_division}!\`);
        setShowAddModal(false);
        setName('');
        setRollNo('');
        setCardNo('');
        setPassword('Pass@123');
        fetchClassStudents();
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setAddLoading(false);
    }
  };`;

const handleSaveCode = `  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !rollNo.trim() || !cardNo.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const finalRollNo = rollNo.trim().length === 1 ? '0' + rollNo.trim() : rollNo.trim();
    setAddLoading(true);

    try {
      const isEdit = !!editingStudent;
      const url = isEdit ? \`/api/students/\${editingStudent.id}\` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: teacher.assigned_class,
          division: teacher.assigned_division,
          roll_no: finalRollNo,
          library_card_no: cardNo.trim().toUpperCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || \`Failed to \${isEdit ? 'update' : 'add'} student\`);
      } else {
        onSuccessToast(\`Student \${name} \${isEdit ? 'updated' : 'added'} successfully!\`);
        setShowAddModal(false);
        setName('');
        setRollNo('');
        setCardNo('');
        setPassword('Pass@123');
        setEditingStudent(null);
        fetchClassStudents();
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setAddLoading(false);
    }
  };`;
code = code.replace(handleAddCode, handleSaveCode);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
console.log("Done phase 1");
