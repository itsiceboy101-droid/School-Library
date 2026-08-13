const fs = require('fs');
let code = fs.readFileSync('src/components/librarian/ReturnBook.tsx', 'utf8');

const groupedIssuedBooksStr = `
  const groupedIssuedList = React.useMemo(() => {
    const groups: Record<string, any> = {};
    issuedList.forEach(item => {
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
  }, [issuedList]);
`;

code = code.replace(
  "const [savingEdit, setSavingEdit] = useState(false);",
  "const [savingEdit, setSavingEdit] = useState(false);" + groupedIssuedBooksStr
);

code = code.replace(
  "{issuedList.map((item) => {",
  "{groupedIssuedList.map((item) => {"
);

code = code.replace(
  "{issuedList.length === 0 ?",
  "{groupedIssuedList.length === 0 ?"
);

const oldTitleStr = `                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.book_title}</div>
                        <div className="text-[11px] text-slate-500">{item.book_author}</div>
                      </td>`;

const newTitleStr = `                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.book_title}</div>
                        <div className="text-[11px] text-slate-500">{item.book_author}</div>
                        {item.copies > 1 && (
                          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            {item.copies} Copies
                          </div>
                        )}
                      </td>`;

code = code.replace(oldTitleStr, newTitleStr);

const oldActionStr = `                        <button
                          onClick={() => handleReturn(item.id)}
                          disabled={returningId === item.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          {returningId === item.id ? 'Processing...' : 'Return'}
                        </button>`;

const newActionStr = `                        <button
                          onClick={() => handleReturn(item.copy_ids[0])}
                          disabled={returningId === item.copy_ids[0]}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          {returningId === item.copy_ids[0] ? 'Processing...' : 'Return'}
                        </button>`;

code = code.replace(oldActionStr, newActionStr);

fs.writeFileSync('src/components/librarian/ReturnBook.tsx', code);
