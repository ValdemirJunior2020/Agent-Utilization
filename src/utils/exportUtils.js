// /src/utils/exportUtils.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportCsv(fileName, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);
}

export function exportSummaryPdf({ summary, totals, siteKPIs, redFlags, recommendations }) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const date = new Date().toLocaleString();
  doc.setFontSize(18);
  doc.text('HotelPlanner Operations View', 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${date}`, 14, 23);
  doc.setFontSize(12);
  const summaryLines = doc.splitTextToSize(summary, 265);
  doc.text(summaryLines, 14, 34);

  autoTable(doc, {
    startY: 52,
    head: [['Metric', 'Value']],
    body: [
      ['Call Centers', totals.callCenterCount],
      ['Agents', totals.agentCount],
      ['Logged Hours', totals.loggedHours.toFixed(1)],
      ['On Call Hours', totals.onCallHours.toFixed(1)],
      ['Utilization %', `${totals.utilization.toFixed(1)}%`],
      ['Break %', `${totals.breakPct.toFixed(1)}%`],
      ['Offline %', `${totals.offlinePct.toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [7, 26, 45] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Call Center', 'Agents', 'On Call', 'Available', 'Break', 'Offline', 'Logged', 'Utilization', 'Status']],
    body: siteKPIs.map((site) => [site.callCenter, site.agentCount, site.onCallHours.toFixed(1), site.availableHours.toFixed(1), site.breakHours.toFixed(1), site.offlineHours.toFixed(1), site.loggedHours.toFixed(1), `${site.utilization.toFixed(1)}%`, site.status]),
    theme: 'striped',
    headStyles: { fillColor: [0, 119, 200] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Severity', 'Site', 'Issue', 'Suggested Action']],
    body: redFlags.slice(0, 12).map((flag) => [flag.severity, flag.site, flag.title, flag.action]),
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Recommendation', 'Detail']],
    body: recommendations.slice(0, 10).map((item) => [item.title, item.detail]),
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
  });

  doc.save('hotelplanner-operations-summary.pdf');
}
