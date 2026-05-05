// /src/utils/scheduleParser.js

import * as XLSX from "xlsx";

const WNS_SCHEDULE_TABS = ["Agent Sched", "Pavia", "Nesting Sched"];

const FULL_TIME_BILLABLE_HOURS_PER_DAY = 6.5;

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function detectCallCenter(fileName = "") {
  const name = fileName.toLowerCase();

  if (name.includes("buwelo")) return "Buwelo";
  if (name.includes("wns")) return "WNS";
  if (name.includes("concentrix")) return "Concentrix";
  if (name.includes("tep")) return "TEP";
  if (name.includes("telus")) return "Telus";

  return "Unknown";
}

function normalizeDate(value) {
  if (!value) return "";

  let parsed = null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    parsed = value;
  } else {
    parsed = new Date(value);
  }

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();

  if (year < 2020 || year > 2035) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function capFullTimeBillableHours(hours) {
  const value = Number(hours || 0);

  if (!Number.isFinite(value) || value <= 0) return 0;

  return Math.min(value, FULL_TIME_BILLABLE_HOURS_PER_DAY);
}

function scheduleValueToHours(value) {
  if (value === null || value === undefined || value === "") return 0;

  let rawHours = 0;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    rawHours = value.getHours() + value.getMinutes() / 60;
    return capFullTimeBillableHours(rawHours);
  }

  if (typeof value === "number") {
    if (value > 0 && value < 1) {
      rawHours = value * 24;
      return capFullTimeBillableHours(rawHours);
    }

    if (value >= 1 && value <= 24) {
      rawHours = value;
      return capFullTimeBillableHours(rawHours);
    }

    return 0;
  }

  const text = normalizeText(value);

  if (!text) return 0;

  const nonBillableValues = [
    "off",
    "free",
    "spsch",
    "pto",
    "vacation",
    "leave",
    "absent",
    "loa",
    "n/a",
    "#n/a",
    "null",
  ];

  if (nonBillableValues.includes(text)) return 0;

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})$/);

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    rawHours = hours + minutes / 60;
    return capFullTimeBillableHours(rawHours);
  }

  const numeric = Number(text);

  if (Number.isFinite(numeric)) {
    if (numeric > 0 && numeric < 1) {
      rawHours = numeric * 24;
      return capFullTimeBillableHours(rawHours);
    }

    if (numeric >= 1 && numeric <= 24) {
      rawHours = numeric;
      return capFullTimeBillableHours(rawHours);
    }
  }

  return 0;
}

function isBuweloAgentRow(row) {
  const employeeId = cleanText(row[0]);
  const agentName = cleanText(row[2]);

  if (!employeeId || !agentName) return false;

  const lowered = normalizeText(agentName);

  if (lowered.includes("fte")) return false;
  if (lowered.includes("agents off")) return false;
  if (lowered.includes("total")) return false;

  return true;
}

function parseBuweloPartnerVoice(rawMatrix, fileName) {
  const callCenter = "Buwelo";
  const sourceSheet = "Partner_Voice";
  const sourceTimezone = "America/Bogota";
  const targetTimezone = "America/New_York";

  const headerRow = rawMatrix[1] || rawMatrix[0] || [];
  const rows = [];

  for (let rowIndex = 2; rowIndex < rawMatrix.length; rowIndex += 1) {
    const row = rawMatrix[rowIndex];

    if (!Array.isArray(row)) continue;
    if (!isBuweloAgentRow(row)) continue;

    const employeeId = cleanText(row[0]);
    const teamLeader = cleanText(row[1]);
    const agentName = cleanText(row[2]);

    for (let colIndex = 3; colIndex < headerRow.length; colIndex += 1) {
      const scheduleDate = normalizeDate(headerRow[colIndex]);

      if (!scheduleDate) continue;

      const rawScheduleValue = row[colIndex];
      const billableHours = scheduleValueToHours(rawScheduleValue);

      rows.push({
        id: `${callCenter}-${employeeId}-${scheduleDate}-${colIndex}`,
        fileName,
        callCenter,
        sourceSheet,
        employeeId,
        teamLeader,
        agentName,
        sourceTimezone,
        targetTimezone,
        scheduleDateLocal: scheduleDate,
        scheduleDateEastern: scheduleDate,
        billableHours,
        rawScheduleValue: cleanText(rawScheduleValue),
        billableRule: "Capped at 6.5 hours per full-time agent per day",
      });
    }
  }

  return rows;
}

function isWnsAgentRow(row) {
  const employeeId = cleanText(row[0]);
  const agentName = cleanText(row[1]);

  if (!employeeId || !agentName) return false;

  const lowered = normalizeText(agentName);

  if (lowered.includes("total")) return false;
  if (lowered.includes("staffing")) return false;
  if (lowered.includes("schedule")) return false;

  return true;
}

function parseWnsScheduleSheet(rawMatrix, fileName, sourceSheet) {
  const callCenter = "WNS";
  const sourceTimezone = "America/New_York";
  const targetTimezone = "America/New_York";

  const dateRow = rawMatrix[2] || [];
  const rows = [];

  for (let rowIndex = 3; rowIndex < rawMatrix.length; rowIndex += 1) {
    const row = rawMatrix[rowIndex];

    if (!Array.isArray(row)) continue;
    if (!isWnsAgentRow(row)) continue;

    const employeeId = cleanText(row[0]);
    const agentName = cleanText(row[1]);

    for (let colIndex = 2; colIndex < dateRow.length; colIndex += 1) {
      const scheduleDate = normalizeDate(dateRow[colIndex]);

      if (!scheduleDate) continue;

      const rawScheduleValue = row[colIndex];
      const billableHours = scheduleValueToHours(rawScheduleValue);

      rows.push({
        id: `${callCenter}-${sourceSheet}-${employeeId}-${scheduleDate}-${colIndex}`,
        fileName,
        callCenter,
        sourceSheet,
        employeeId,
        teamLeader: "",
        agentName,
        sourceTimezone,
        targetTimezone,
        scheduleDateLocal: scheduleDate,
        scheduleDateEastern: scheduleDate,
        billableHours,
        rawScheduleValue: cleanText(rawScheduleValue),
        billableRule: "Capped at 6.5 hours per full-time agent per day",
      });
    }
  }

  return rows;
}

function buildScheduleSummary(rows) {
  const agentIds = new Set(rows.map((row) => row.employeeId).filter(Boolean));

  const dates = [
    ...new Set(rows.map((row) => row.scheduleDateEastern).filter(Boolean)),
  ].sort();

  const activeDates = [
    ...new Set(
      rows
        .filter((row) => Number(row.billableHours || 0) > 0)
        .map((row) => row.scheduleDateEastern)
        .filter(Boolean)
    ),
  ].sort();

  const totalBillableHours = rows.reduce(
    (total, row) => total + Number(row.billableHours || 0),
    0
  );

  return {
    agentCount: agentIds.size,
    scheduleStartDate: dates[0] || "Date not detected",
    scheduleEndDate: dates[dates.length - 1] || "Date not detected",
    scheduleDateRange:
      dates.length > 1
        ? `${dates[0]} to ${dates[dates.length - 1]}`
        : dates[0] || "Date not detected",
    scheduleDateCount: dates.length,
    activeScheduleStartDate: activeDates[0] || "Date not detected",
    activeScheduleEndDate:
      activeDates[activeDates.length - 1] || "Date not detected",
    totalBillableHours,
    billableRule: "Full-time agent billable day capped at 6.5 hours",
  };
}

export async function parseScheduleFile(file) {
  const callCenter = detectCallCenter(file.name);

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  let rows = [];
  let sheetsUsed = [];

  if (callCenter === "Buwelo") {
    const sheetName = "Partner_Voice";

    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error('Buwelo schedule must include the "Partner_Voice" tab.');
    }

    const sheet = workbook.Sheets[sheetName];

    const rawMatrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    rows = parseBuweloPartnerVoice(rawMatrix, file.name);
    sheetsUsed = [sheetName];
  }

  if (callCenter === "WNS") {
    const availableTabs = WNS_SCHEDULE_TABS.filter((sheetName) =>
      workbook.SheetNames.includes(sheetName)
    );

    if (!availableTabs.length) {
      throw new Error(
        'WNS schedule must include at least one of: "Agent Sched", "Pavia", "Nesting Sched".'
      );
    }

    rows = availableTabs.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];

      const rawMatrix = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: true,
      });

      return parseWnsScheduleSheet(rawMatrix, file.name, sheetName);
    });

    sheetsUsed = availableTabs;
  }

  if (!rows.length) {
    throw new Error(`No schedule rows could be parsed for ${callCenter}.`);
  }

  const summary = buildScheduleSummary(rows);

  return {
    fileName: file.name,
    callCenter,
    sheetName: sheetsUsed.join(", "),
    sheetsUsed,
    uploadedAt: new Date().toLocaleString(),
    ...summary,
    rows,
  };
}