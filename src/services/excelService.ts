import * as XLSX from 'xlsx';

export function exportReportsToExcel(reports: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(reports.map(r => ({
    'Tanggal': r.tanggal,
    'Nama User': r.userName,
    'Tim': r.teamName,
    'Kategori': r.activityName,
    'Nama Kegiatan': r.subActivityName,
    'Jam': r.jam,
    'Penjelasan': r.penjelasan,
    'Link PDF': r.pdf_link,
    'Link Bukti': r.attachment_link
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kegiatan');

  // For frontend usage, we usually write a buffer or use XLSX.writeFile
  // In a real browser environment:
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return excelBuffer;
}
