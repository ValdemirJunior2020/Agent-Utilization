// /src/utils/normalizeData.js
import { clean } from './formatters';

const columnMap = {
  agent: ['agent name', 'agent', 'user', 'name', 'employee', 'representative', 'csr', 'associate'],
  date: ['date', 'day', 'interval date', 'report date', 'summary date'],
  status: ['status', 'aux', 'state', 'activity', 'reason', 'work state'],
  onCallHours: ['on call', 'oncall', 'talk time', 'talk', 'call time', 'handling time', 'active call', 'total talk time'],
  availableHours: ['available', 'idle', 'ready', 'waiting', 'avail'],
  breakHours: ['break', 'lunch', 'meal', 'bio break', 'restroom'],
  offlineHours: ['offline', 'not ready', 'notready', 'away', 'meeting', 'coaching', 'training'],
  loggedHours: ['logged time', 'total time', 'staffed time', 'login time', 'logged in', 'paid time', 'duration'],
  utilization: ['utilization', 'occupancy', 'productive %', 'productivity'],
};

const ignoredTerms = ['total', 'grand total', 'subtotal', 'null', 'undefined'];
const statusAliases = {
  onCallHours: ['on call', 'oncall', 'talk time', 'talk', 'call time', 'handling time', 'active call'],
  availableHours: ['available', 'idle', 'ready', 'waiting', 'avail'],
  breakHours: ['break', 'lunch', 'meal', 'bio break', 'restroom'],
  offlineHours: ['offline', 'not ready', 'notready', 'away', 'meeting', 'coaching', 'training'],
};

export function detectCallCenter(fileName = '') {
  const lower = fileName.toLowerCase();
  if (lower.includes('wns')) return 'WNS';
  if (lower.includes('tep')) return 'TEP';
  if (lower.includes('telus')) return 'Telus';
  if (lower.includes('concentrix')) return 'Concentrix';
  if (lower.includes('buwelo')) return 'Buwelo';
  return fileName.replace(/\.(xlsx|xls)$/i, '').replace(/[-_]/g, ' ').trim() || 'Unknown Site';
}

export function normalizeHeader(header) {
  return clean(header)
    .toLowerCase()
    .replace(/[\n\r]+/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 %]/g, '')
    .trim();
}

function bestColumn(headers, target) {
  const candidates = columnMap[target] || [];
  const normalized = headers.map((header) => normalizeHeader(header));
  for (const candidate of candidates) {
    const index = normalized.findIndex((header) => header === candidate || header.includes(candidate));
    if (index !== -1) return headers[index];
  }
  return null;
}

function excelDateToString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 25000 && value < 60000) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }
  const text = clean(value);
  if (!text) return '';
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text;
}

function timeToHours(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') {
    if (value > 1000) return value / 3600;
    if (value > 24) return value / 60;
    if (value > 0 && value < 1) return value * 24;
    return value;
  }
  const text = clean(value).toLowerCase().replace(/,/g, '');
  if (!text || text === '-') return 0;
  if (text.includes(':')) {
    const parts = text.split(':').map((part) => Number(part));
    if (parts.length === 3) return (parts[0] || 0) + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600;
    if (parts.length === 2) return (parts[0] || 0) + (parts[1] || 0) / 60;
  }
  const numeric = Number(text.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(numeric)) return 0;
  if (text.includes('%')) return 0;
  if (text.includes('sec')) return numeric / 3600;
  if (text.includes('min')) return numeric / 60;
  if (text.includes('hour') || text.includes('hr')) return numeric;
  if (numeric > 24) return numeric / 60;
  return numeric;
}

function percentValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value <= 1 ? value * 100 : value;
  const text = clean(value);
  const numeric = Number(text.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(numeric)) return 0;
  return numeric <= 1 && !text.includes('%') ? numeric * 100 : numeric;
}


function tableauMinutesToHours(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value / 60;
  const text = clean(value).toLowerCase().replace(/,/g, '');
  if (!text || text === '-') return 0;
  if (text.includes(':')) return timeToHours(text);
  const numeric = Number(text.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(numeric)) return 0;
  return numeric / 60;
}

function statusKey(status) {
  const normalized = normalizeHeader(status);
  for (const [key, aliases] of Object.entries(statusAliases)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) return key;
  }
  return null;
}

function isDateLike(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  const text = clean(value);
  if (!text) return false;
  const parsed = new Date(text);
  return !Number.isNaN(parsed.getTime()) && /\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(text);
}

function isTableauMatrix(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length < 3) return false;
  const row1 = rawRows[0] || [];
  const row2 = rawRows[1] || [];
  const hasSummaryDate = row1.some((cell) => normalizeHeader(cell).includes('summary date'));
  const hasGrandTotal = row2.some((cell) => normalizeHeader(cell) === 'grand total');
  const hasStatusRows = rawRows.slice(2, 30).some((row) => statusKey(row?.[2]));
  return hasSummaryDate && hasStatusRows && hasGrandTotal;
}

function normalizeTableauMatrix(rawRows, fileName) {
  const callCenter = detectCallCenter(fileName);
  const hourHeaderRow = rawRows[1] || [];
  const grandTotalIndex = hourHeaderRow.findIndex((cell) => normalizeHeader(cell) === 'grand total');
  const dataStartIndex = 3;
  const dataEndIndex = grandTotalIndex > dataStartIndex ? grandTotalIndex : hourHeaderRow.length;
  const grouped = new Map();
  let currentDate = '';
  let currentAgent = '';

  rawRows.slice(2).forEach((row, rowIndex) => {
    if (!Array.isArray(row)) return;
    if (isDateLike(row[0])) currentDate = excelDateToString(row[0]);
    if (clean(row[1])) currentAgent = clean(row[1]);

    const key = statusKey(row[2]);
    if (!key || !currentAgent || ignoredTerms.includes(currentAgent.toLowerCase())) return;

    const totalCell = grandTotalIndex >= 0 ? row[grandTotalIndex] : '';
    const statusHours = tableauMinutesToHours(totalCell) || row.slice(dataStartIndex, dataEndIndex).reduce((total, value) => total + tableauMinutesToHours(value), 0);
    if (!statusHours) return;

    const groupKey = `${callCenter}|${currentAgent}|${currentDate || 'Unknown Date'}`;
    const item = grouped.get(groupKey) || {
      id: `${callCenter}-${currentAgent}-${currentDate || 'Unknown Date'}-${rowIndex}`,
      callCenter,
      agent: currentAgent,
      date: currentDate || 'Unknown Date',
      onCallHours: 0,
      availableHours: 0,
      breakHours: 0,
      offlineHours: 0,
      loggedHours: 0,
      sourceFile: fileName,
    };
    item[key] += statusHours;
    grouped.set(groupKey, item);
  });

  return Array.from(grouped.values()).map((row) => {
    const loggedHours = row.onCallHours + row.availableHours + row.breakHours + row.offlineHours;
    return {
      ...row,
      loggedHours,
      utilization: loggedHours ? (row.onCallHours / loggedHours) * 100 : 0,
      onCallPct: loggedHours ? (row.onCallHours / loggedHours) * 100 : 0,
      availablePct: loggedHours ? (row.availableHours / loggedHours) * 100 : 0,
      breakPct: loggedHours ? (row.breakHours / loggedHours) * 100 : 0,
      offlinePct: loggedHours ? (row.offlineHours / loggedHours) * 100 : 0,
    };
  });
}

function rowsFromFlatObjects(rawRows) {
  if (!Array.isArray(rawRows) || !rawRows.length) return [];
  if (!Array.isArray(rawRows[0])) return rawRows;
  const headerIndex = rawRows.findIndex((row) => Array.isArray(row) && row.filter((cell) => clean(cell)).length >= 2);
  if (headerIndex === -1) return [];
  const headers = rawRows[headerIndex].map((header, index) => clean(header) || `Column ${index + 1}`);
  return rawRows.slice(headerIndex + 1).map((row) => headers.reduce((acc, header, index) => ({ ...acc, [header]: row[index] ?? '' }), {}));
}

function normalizeFlatRows(rawRows, fileName) {
  const callCenter = detectCallCenter(fileName);
  const rows = rowsFromFlatObjects(rawRows).filter(Boolean).filter((row) => Object.values(row).some((value) => clean(value) !== ''));
  if (!rows.length) return [];
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const columns = Object.keys(columnMap).reduce((acc, key) => ({ ...acc, [key]: bestColumn(headers, key) }), {});

  return rows
    .map((row, index) => {
      const agent = clean(row[columns.agent]) || clean(row.Agent) || clean(row.Name) || `Unknown Agent ${index + 1}`;
      if (!agent || ignoredTerms.includes(agent.toLowerCase())) return null;
      const onCallHours = timeToHours(row[columns.onCallHours]);
      const availableHours = timeToHours(row[columns.availableHours]);
      const breakHours = timeToHours(row[columns.breakHours]);
      const offlineHours = timeToHours(row[columns.offlineHours]);
      const calculatedLogged = onCallHours + availableHours + breakHours + offlineHours;
      const loggedHours = timeToHours(row[columns.loggedHours]) || calculatedLogged;
      const utilizationFromFile = percentValue(row[columns.utilization]);
      const utilization = utilizationFromFile || (loggedHours ? (onCallHours / loggedHours) * 100 : 0);
      return {
        id: `${callCenter}-${agent}-${index}`,
        callCenter,
        agent,
        date: excelDateToString(row[columns.date] || ''),
        onCallHours,
        availableHours,
        breakHours,
        offlineHours,
        loggedHours,
        utilization,
        onCallPct: loggedHours ? (onCallHours / loggedHours) * 100 : 0,
        availablePct: loggedHours ? (availableHours / loggedHours) * 100 : 0,
        breakPct: loggedHours ? (breakHours / loggedHours) * 100 : 0,
        offlinePct: loggedHours ? (offlineHours / loggedHours) * 100 : 0,
        sourceFile: fileName,
      };
    })
    .filter(Boolean);
}

export function normalizeRows(rawRows, fileName) {
  if (isTableauMatrix(rawRows)) return normalizeTableauMatrix(rawRows, fileName);
  return normalizeFlatRows(rawRows, fileName);
}

export function detectReportDates(rows = [], rawRows = []) {
  const datesFromRows = Array.from(new Set(rows.map((row) => row.date).filter(Boolean).filter((date) => date !== 'Unknown Date')));
  if (datesFromRows.length) return datesFromRows;
  const datesFromMatrix = [];
  rawRows.forEach((row) => {
    if (Array.isArray(row) && isDateLike(row[0])) datesFromMatrix.push(excelDateToString(row[0]));
  });
  return Array.from(new Set(datesFromMatrix));
}
