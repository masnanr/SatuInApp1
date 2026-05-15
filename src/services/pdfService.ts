import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateReportPDF(data: any) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const fontSize = 12;

  // Header
  page.drawText('SATUINAPP - LAPORAN KEGIATAN HARIAN', {
    x: 50,
    y: height - 50,
    size: 20,
    font: timesRomanFont,
    color: rgb(0.12, 0.25, 0.69),
  });

  page.drawLine({
    start: { x: 50, y: height - 60 },
    end: { x: width - 50, y: height - 60 },
    thickness: 2,
    color: rgb(0.12, 0.25, 0.69),
  });

  // Content
  let yPos = height - 100;
  const labels = [
    { label: 'Nama Pegawai', value: data.userName },
    { label: 'Tim', value: data.teamName },
    { label: 'Kategori', value: data.activityName },
    { label: 'Nama Kegiatan', value: data.subActivityName },
    { label: 'Tanggal', value: data.tanggal },
    { label: 'Jam', value: data.jam },
  ];

  labels.forEach(({ label, value }) => {
    page.drawText(`${label}:`, { x: 50, y: yPos, size: fontSize, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`${value}`, { x: 200, y: yPos, size: fontSize, font: timesRomanFont });
    yPos -= 25;
  });

  yPos -= 10;
  page.drawText('Penjelasan:', { x: 50, y: yPos, size: fontSize, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
  yPos -= 20;

  // Simple text wrap for description
  const words = data.penjelasan.split(' ');
  let line = '';
  words.forEach((word: string) => {
    if ((line + word).length > 80) {
      page.drawText(line, { x: 50, y: yPos, size: 10, font: timesRomanFont });
      line = word + ' ';
      yPos -= 15;
    } else {
      line += word + ' ';
    }
  });
  page.drawText(line, { x: 50, y: yPos, size: 10, font: timesRomanFont });

  // Footer
  page.drawText('Dicetak Otomatis pada ' + new Date().toLocaleString(), {
    x: 50,
    y: 50,
    size: 8,
    font: timesRomanFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
