export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  if (dateStr === 'No Limit') return 'No Limit';
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (year > 2030) return 'No Limit';
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}
