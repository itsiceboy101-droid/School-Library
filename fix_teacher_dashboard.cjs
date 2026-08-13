const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

const groupedBorrowedBooksStr = `
  const groupedActiveBooks = React.useMemo(() => {
    const groups: Record<string, any> = {};
    borrowedBooks.filter(b => b.status !== 'returned').forEach(item => {
      const key = \`\${item.book_id}-\${item.issue_date}-\${item.due_date}\`;
      if (!groups[key]) {
        groups[key] = { ...item, copies: 1, copy_ids: [item.id] };
      } else {
        groups[key].copies += 1;
        groups[key].copy_ids.push(item.id);
      }
    });
    return Object.values(groups);
  }, [borrowedBooks]);
  
  const groupedReturnedBooks = React.useMemo(() => {
    const groups: Record<string, any> = {};
    borrowedBooks.filter(b => b.status === 'returned').forEach(item => {
      const key = \`\${item.book_id}-\${item.issue_date}-\${item.return_date}\`;
      if (!groups[key]) {
        groups[key] = { ...item, copies: 1, copy_ids: [item.id] };
      } else {
        groups[key].copies += 1;
        groups[key].copy_ids.push(item.id);
      }
    });
    return Object.values(groups);
  }, [borrowedBooks]);
`;

code = code.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);" + groupedBorrowedBooksStr
);

code = code.replace(
  "{borrowedBooks.filter(b => b.status !== 'returned').map((b) => (",
  "{groupedActiveBooks.map((b) => ("
);

code = code.replace(
  "{borrowedBooks.filter(b => b.status === 'returned').map((b) => (",
  "{groupedReturnedBooks.map((b) => ("
);

const oldTitleStr = `                      <td className="px-6 py-4 font-bold text-slate-900">
                        {b.book_title}
                        <div className="text-[11px] text-slate-500 font-normal">{b.book_author}</div>
                      </td>`;

const newTitleStr = `                      <td className="px-6 py-4 font-bold text-slate-900">
                        {b.book_title}
                        <div className="text-[11px] text-slate-500 font-normal">{b.book_author}</div>
                        {b.copies > 1 && (
                          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            {b.copies} Copies
                          </div>
                        )}
                      </td>`;

code = code.split(oldTitleStr).join(newTitleStr);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
