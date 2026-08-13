const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/ReportsManager.tsx', 'utf8');

const groupedOverdueStr = `
  const groupedOverdueList = React.useMemo(() => {
    const groups: Record<string, any> = {};
    overdueList.forEach(item => {
      const isTeacher = item.student_name && item.student_name.includes('(Teacher)');
      if (isTeacher) {
        const key = \`\${item.student_name}-\${item.book_id}-\${item.issue_date}-\${item.due_date}\`;
        if (!groups[key]) {
          groups[key] = { ...item, copies: 1, copy_ids: [item.id] };
        } else {
          groups[key].copies += 1;
          groups[key].copy_ids.push(item.id);
        }
      } else {
        groups[\`\${item.id}\`] = { ...item, copies: 1, copy_ids: [item.id] };
      }
    });
    return Object.values(groups);
  }, [overdueList]);
`;

code = code.replace(
  "const [savingEdit, setSavingEdit] = useState(false);",
  "const [savingEdit, setSavingEdit] = useState(false);" + groupedOverdueStr
);

code = code.replace(
  "{overdueList.map((item) => (",
  "{groupedOverdueList.map((item) => ("
);

code = code.replace(
  "Overdue Books Audit List ({overdueList.length})",
  "Overdue Books Audit List ({groupedOverdueList.length})"
);

code = code.replace(
  "{overdueList.length === 0 ?",
  "{groupedOverdueList.length === 0 ?"
);

const oldTitleStr = `                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.book_title}
                    </td>`;

const newTitleStr = `                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.book_title}
                      {item.copies > 1 && (
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                          {item.copies} Copies
                        </div>
                      )}
                    </td>`;

code = code.replace(oldTitleStr, newTitleStr);

fs.writeFileSync('src/components/librarian/ReportsManager.tsx', code);
