// /src/utils/normalizeData.js

const STATUS_KEYS = {
  "on call": "onCallHours",
  oncall: "onCallHours",
  "talk time": "onCallHours",
  talking: "onCallHours",
  call: "onCallHours",

  available: "availableHours",
  idle: "availableHours",
  ready: "availableHours",

  break: "breakHours",
  lunch: "breakHours",

  offline: "offlineHours",
  "not ready": "offlineHours",
  notready: "offlineHours",
  unavailable: "offlineHours",
};

function isValidValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function isKnownStatus(value) {
  const text = normalizeText(value);
  return Boolean(STATUS_KEYS[text]);
}

function statusToKey(value) {
  const text = normalizeText(value);
  return STATUS_KEYS[text] || null;
}

function looksLikeDate(value) {
  if (!isValidValue(value)) return false;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return true;
  }

  const text = cleanText(value);

  if (!text) return false;

  if (
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
      text
    )
  ) {
    return true;
  }

  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(text)) {
    return true;
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    return true;
  }

  return false;
}

function formatDate(value) {
  if (!isValidValue(value)) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = cleanText(value);

  if (!text) return "";

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function isAgentValue(value) {
  const text = cleanText(value);

  if (!text) return false;
  if (isKnownStatus(text)) return false;
  if (looksLikeDate(text)) return false;
  if (normalizeText(text) === "grand total") return false;
  if (normalizeText(text) === "summary_date") return false;

  return true;
}

function toNumber(value) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace("%", "").trim();
    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function convertTableauMinutesToHours(value) {
  const number = toNumber(value);

  if (!Number.isFinite(number) || number <= 0) return 0;

  return number / 60;
}

function sumDurationCells(row, startIndex = 3) {
  let total = 0;

  for (let index = startIndex; index < row.length; index += 1) {
    const value = row[index];

    if (!isValidValue(value)) continue;

    const text = normalizeText(value);

    if (
      text === "grand total" ||
      text === "summary_date" ||
      text === "total" ||
      text === "null"
    ) {
      continue;
    }

    total += toNumber(value);
  }

  return convertTableauMinutesToHours(total);
}

export function detectCallCenter(fileName = "") {
  const name = fileName.toLowerCase();

  if (name.includes("wns")) return "WNS";
  if (name.includes("tep")) return "TEP";
  if (name.includes("telus")) return "Telus";
  if (name.includes("concentrix")) return "Concentrix";
  if (name.includes("buwelo")) return "Buwelo";

  return fileName
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/service|utilization|report/gi, "")
    .trim() || "Unknown";
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
  const normalizedRows = [];

  let currentDate = "";
  let currentAgent = "";

  rawMatrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) return;

    const firstCell = row[0];
    const secondCell = row[1];
    const thirdCell = row[2];

    if (looksLikeDate(firstCell)) {
      currentDate = formatDate(firstCell);
    }

    if (isAgentValue(secondCell)) {
      currentAgent = cleanText(secondCell);
    }

    const status = cleanText(thirdCell);
    const statusKey = statusToKey(status);

    if (!statusKey) return;
    if (!currentAgent) return;

    const hours = sumDurationCells(row, 3);

    if (hours <= 0) return;

    const normalized = {
      id: `${callCenter}-${currentDate}-${currentAgent}-${status}-${rowIndex}`,
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