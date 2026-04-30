// /src/utils/excelParser.js
import * as XLSX from 'xlsx';
import { normalizeRows, detectCallCenter, detectReportDates } from './normalizeData';

function buildReportPeriod(reportDates) {
  const cleanDates = [...new Set(reportDates.filter(Boolean))].sort();
  if (!cleanDates.length) return 'Date not detected';
  if (cleanDates.length === 1) return cleanDates[0];
  return `${cleanDates[0]} to ${cleanDates[cleanDates.length - 1]}`;
}

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheet found in workbook.');
  const sheet = workbook.Sheets[sheetName];
  const rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  const rows = normalizeRows(rawMatrix, file.name);
  const reportDates = detectReportDates(rows, rawMatrix);

  return {
    fileName: file.name,
    sheetName,
    callCenter: detectCallCenter(file.name),
    reportDate: buildReportPeriod(reportDates),
    reportDates,
    rowCount: rows.length,
    uploadedAt: new Date().toLocaleString(),
    rows,
  };
}

export async function parseExcelUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  const blob = await response.blob();
  const name = decodeURIComponent(url.split('/').pop());
  const file = new File([blob], name, { type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return parseExcelFile(file);
}
