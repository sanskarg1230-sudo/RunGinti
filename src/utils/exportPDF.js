import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatOvers, calcSR, calcEconomy } from './cricketEngine';

export function exportMatchPDF(match) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const green = [22, 163, 74];
  const darkGray = [30, 30, 30];
  const lightGray = [245, 245, 245];

  let yPos = 15;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('🏏 RunGinti', 105, 13, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(match.name || 'Match Scorecard', 105, 22, { align: 'center' });
  yPos = 36;

  // ── Match Info ────────────────────────────────────────────────────────────
  doc.setTextColor(...darkGray);
  doc.setFillColor(...lightGray);
  doc.rect(10, yPos - 5, 190, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const infoLeft = [
    ['Match Type', match.matchType || 'Custom'],
    ['Date', new Date(match.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['Venue', match.venue || 'N/A'],
  ];
  const infoRight = [
    ['Toss', `${match.tossWinner} won & chose to ${match.electedTo}`],
    ['Total Overs', match.totalOvers],
    ['Result', match.result ? (match.result.winner ? `${match.result.winner} won by ${match.result.margin}` : match.result.margin) : 'In Progress'],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  infoLeft.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, yPos + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val), 45, yPos + i * 7);
  });
  infoRight.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 110, yPos + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val), 135, yPos + i * 7);
  });

  yPos += 35;

  // ── Innings Scorecards ────────────────────────────────────────────────────
  const innings = match.innings || [];
  innings.forEach((inn, inningsIdx) => {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    // Innings Header
    doc.setFillColor(...green);
    doc.rect(10, yPos - 4, 190, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      `${inn.battingTeam} — ${inn.runs}/${inn.wickets} (${formatOvers(inn.legalBalls)} Overs)`,
      105, yPos + 3, { align: 'center' }
    );
    yPos += 14;

    // Batting Table
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BATTING', 14, yPos);
    yPos += 3;

    const battingRows = (inn.batsmen || []).map(b => [
      b.name,
      b.isOut ? (b.dismissal || 'Out') + (b.dismissedBy ? ` b ${b.dismissedBy}` : '') : 'not out',
      b.runs,
      b.balls,
      b.fours,
      b.sixes,
      calcSR(b.runs, b.balls),
    ]);

    // Extras row
    const ext = inn.extras || {};
    const extTotal = (ext.wides || 0) + (ext.noBalls || 0) + (ext.byes || 0) + (ext.legByes || 0) + (ext.penalties || 0);
    battingRows.push([
      'Extras',
      `(w ${ext.wides || 0}, nb ${ext.noBalls || 0}, b ${ext.byes || 0}, lb ${ext.legByes || 0})`,
      extTotal, '', '', '', '',
    ]);
    battingRows.push([
      'TOTAL', `${inn.wickets} wickets, ${formatOvers(inn.legalBalls)} overs`,
      inn.runs, '', '', '', '',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Batsman', 'Dismissal', 'R', 'B', '4s', '6s', 'SR']],
      body: battingRows,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 60 }, 2: { cellWidth: 12 }, 3: { cellWidth: 12 }, 4: { cellWidth: 10 }, 5: { cellWidth: 10 }, 6: { cellWidth: 20 } },
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Bowling Table
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BOWLING', 14, yPos);
    yPos += 3;

    const bowlingRows = (inn.bowlers || []).map(b => [
      b.name,
      formatOvers(b.legalBalls),
      b.runs,
      b.wickets,
      b.maidens,
      calcEconomy(b.runs, b.legalBalls),
      `${b.wides || 0}/${b.noBalls || 0}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Bowler', 'O', 'R', 'W', 'M', 'Econ', 'Wd/Nb']],
      body: bowlingRows,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Generated by RunGinti   Page ${i} of ${pageCount}`, 105, 292, { align: 'center' });
  }

  doc.save(`${match.name || 'scorecard'}.pdf`);
}
