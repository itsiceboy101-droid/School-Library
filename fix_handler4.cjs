const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

const start = code.indexOf('const handleSaveStudent =');
const end = code.indexOf('const filteredStudents =');

if (start !== -1 && end !== -1) {
    // go back to the previous line indentation if possible
    const actualStart = code.lastIndexOf('  ', start);
    
    const before = code.substring(0, actualStart !== -1 ? actualStart : start);
    const after = code.substring(end - 2); // get the space before const filteredStudents
    
    const cleanHandler = `
  const handleSaveStudent = async (e: React.FormEvent) => {
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
  };

  `;
    
    fs.writeFileSync('src/components/TeacherDashboard.tsx', before + cleanHandler + after);
    console.log('Fixed handler successfully');
}
