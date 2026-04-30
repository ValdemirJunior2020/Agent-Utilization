// /src/utils/normalizeData.js

const STATUS_KEYS = {
  "on call": "onCallHours",
  oncall: "onCallHours",
  "talk time": "onCallHours",
  talking: "onCallHours",
  call: "onCallHours",
  calls: "onCallHours",

  available: "availableHours",
  idle: "availableHours",
  ready: "availableHours",

  break: "breakHours",
  lunch: "breakHours",
  meal: "breakHours",

  offline: "offlineHours",
  "not ready": "offlineHours",
  notready: "offlineHours",
  unavailable: "offlineHours",
  training: "offlineHours",
  meeting: "offlineHours",
  coaching: "offlineHours",
};

const INVALID_AGENT_VALUES = new Set([
  "agent",
  "agent name",
  "name",
  "user",
  "status",
  "date",
  "day",
  "summary_date",
  "grand total",
  "total",
  "null",
  "undefined",
  "break",
  "available",
  "offline",
  "on call",
  "not ready",
]);

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace("%", "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function looksLikeDate(value) {
  if (!hasValue(value)) return false;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;

  const text = cleanText(value);

  if (
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
      text
    )
  ) {
    return true;
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) return true;
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(text)) return true;

  return false;
}

function formatDate(value) {
  if (!hasValue(value)) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = cleanText(value);

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function getStatusKey(value) {
  const text = normalizeText(value);

  if (STATUS_KEYS[text]) return STATUS_KEYS[text];

  if (text.includes("on call")) return "onCallHours";
  if (text.includes("talk")) return "onCallHours";
  if (text.includes("available")) return "availableHours";
  if (text.includes("idle")) return "availableHours";
  if (text.includes("break")) return "breakHours";
  if (text.includes("lunch")) return "breakHours";
  if (text.includes("offline")) return "offlineHours";
  if (text.includes("not ready")) return "offlineHours";
  if (text.includes("training")) return "offlineHours";
  if (text.includes("meeting")) return "offlineHours";
  if (text.includes("coaching")) return "offlineHours";

  return null;
}

function isAgentValue(value) {
  const text = cleanText(value);
  const normalized = normalizeText(value);

  if (!text) return false;
  if (INVALID_AGENT_VALUES.has(normalized)) return false;
  if (looksLikeDate(value)) return false;
  if (getStatusKey(value)) return false;
  if (/^\d+$/.test(text) && text.length < 4) return false;

  return true;
}

function findGrandTotalIndex(rawMatrix) {
  for (const row of rawMatrix) {
    if (!Array.isArray(row)) continue;

    for (let index = 0; index < row.length; index += 1) {
      if (normalizeText(row[index]) === "grand total") {
        return index;
      }
    }
  }

  return -1;
}

function findStatusIndex(row) {
  const searchLimit = Math.min(row.length, 10);

  for (let index = 0; index < searchLimit; index += 1) {
    if (getStatusKey(row[index])) {
      return index;
    }
  }

  return -1;
}

function findDateBeforeStatus(row, statusIndex) {
  const end = statusIndex >= 0 ? statusIndex : Math.min(row.length, 6);

  for (let index = 0; index < end; index += 1) {
    if (looksLikeDate(row[index])) {
      return formatDate(row[index]);
    }
  }

  return "";
}

function findAgentBeforeStatus(row, statusIndex) {
  const end = statusIndex >= 0 ? statusIndex : Math.min(row.length, 6);

  for (let index = 0; index < end; index += 1) {
    const value = row[index];

    if (isAgentValue(value)) {
      return cleanText(value);
    }
  }

  return "";
}

function tableauMinutesToHours(value) {
  const minutes = toNumber(value);

  if (!Number.isFinite(minutes) || minutes <= 0) return 0;

  return minutes / 60;
}

function getHoursFromRow(row, statusIndex, grandTotalIndex) {
  if (
    grandTotalIndex >= 0 &&
    grandTotalIndex < row.length &&
    toNumber(row[grandTotalIndex]) > 0
  ) {
    return tableauMinutesToHours(row[grandTotalIndex]);
  }

  let totalMinutes = 0;

  for (let index = statusIndex + 1; index < row.length; index += 1) {
    const value = row[index];

    if (!hasValue(value)) continue;
    if (normalizeText(value) === "grand total") continue;

    totalMinutes += toNumber(value);
  }

  return tableauMinutesToHours(totalMinutes);
}

export function detectCallCenter(fileName = "") {
  const name = fileName.toLowerCase();

  if (name.includes("wns")) return "WNS";
  if (name.includes("tep")) return "TEP";
  if (name.includes("telus")) return "Telus";
  if (name.includes("concentrix")) return "Concentrix";
  if (name.includes("buwelo")) return "Buwelo";

  return (
    fileName
      .replace(/\.(xlsx|xls|csv)$/i, "")
      .replace(/service|utilization|report/gi, "")
      .trim() || "Unknown"
  );
}

export function detectReportDates(rows = [], rawMatrix = []) {
  const rowDates = rows.map((row) => row.date).filter(Boolean);

  const rawDates = rawMatrix
    .flat()
    .filter((cell) => looksLikeDate(cell))
    .map((cell) => formatDate(cell))
    .filter(Boolean);

  return [...new Set([...rowDates, ...rawDates])]
    .filter((date) => date !== "Unknown Date")
    .sort();
}

export function normalizeRows(rawMatrix = [], fileName = "") {
  const callCenter = detectCallCenter(fileName);
  const grandTotalIndex = findGrandTotalIndex(rawMatrix);
  const normalizedRows = [];

  let currentDate = "";
  let currentAgent = "";

  rawMatrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) return;

    const statusIndex = findStatusIndex(row);

    if (statusIndex === -1) {
      const dateFromHeaderRow = findDateBeforeStatus(row, -1);
      const agentFromHeaderRow = findAgentBeforeStatus(row, -1);

      if (dateFromHeaderRow) currentDate = dateFromHeaderRow;
      if (agentFromHeaderRow) currentAgent = agentFromHeaderRow;

      return;
    }

    const dateFromRow = findDateBeforeStatus(row, statusIndex);
    const agentFromRow = findAgentBeforeStatus(row, statusIndex);

    if (dateFromRow) currentDate = dateFromRow;
    if (agentFromRow) currentAgent = agentFromRow;

    if (!currentAgent || !isAgentValue(currentAgent)) return;

    const status = cleanText(row[statusIndex]);
    const statusKey = getStatusKey(status);

    if (!statusKey) return;

    const hours = getHoursFromRow(row, statusIndex, grandTotalIndex);

    if (hours <= 0) return;

    const normalized = {
      id: `${callCenter}-${currentDate || "Unknown Date"}-${currentAgent}-${status}-${rowIndex}`,
      fileName,
      callCenter,
      date: currentDate || "Unknown Date",
      agent: currentAgent,
      status,

      onCallHours: 0,
      availableHours: 0,
      breakHours: 0,
      offlineHours: 0,
      loggedHours: 0,

      rawRowIndex: rowIndex + 1,
    };

    normalized[statusKey] = hours;
    normalized.loggedHours =
      normalized.onCallHours +
      normalized.availableHours +
      normalized.breakHours +
      normalized.offlineHours;

    normalizedRows.push(normalized);
  });

  return normalizedRows;
}