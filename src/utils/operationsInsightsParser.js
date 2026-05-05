// /src/utils/operationsInsightsParser.js

import * as XLSX from "xlsx";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && value > 30000 && value < 60000) {
    return excelSerialToDate(value);
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return cleanText(value);
}

function getAgentGroup(agentName) {
  const value = cleanText(agentName).toLowerCase();

  if (value.includes("(tus)")) return "TUS";
  if (value.includes("(tel)")) return "TEL";

  return "Telus";
}

function parseTelusServiceAgents(workbook, fileName) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const rows = [];
  let currentDate = "";

  for (let index = 0; index < matrix.length; index += 1) {
    const row = matrix[index];

    if (!Array.isArray(row)) continue;

    const rowText = row.map((cell) => normalizeText(cell)).join(" ");

    if (
      rowText.includes("agent") &&
      rowText.includes("answered") &&
      rowText.includes("talk")
    ) {
      continue;
    }

    const possibleDate = row[0];

    if (possibleDate && normalizeText(possibleDate) !== "grand total") {
      const detectedDate = normalizeDate(possibleDate);
      if (detectedDate) currentDate = detectedDate;
    }

    if (normalizeText(row[0]) === "grand total") continue;

    const agentName = cleanText(row[1]);
    const callCenterId = cleanText(row[2]);
    const agentId = cleanText(row[3]);

    if (!agentName || normalizeText(agentName) === "total") continue;
    if (!agentId || normalizeText(agentId) === "total") continue;

    const serviceAnsweredCalls = toNumber(row[4]);
    const serviceAvgTalkTime = toNumber(row[5]);
    const outboundAnsweredCalls = toNumber(row[6]);
    const outboundAvgTalkTime = toNumber(row[7]);
    const totalAnsweredCalls = toNumber(row[8]);
    const totalAvgTalkTime = toNumber(row[9]);

    if (
      serviceAnsweredCalls <= 0 &&
      outboundAnsweredCalls <= 0 &&
      totalAnsweredCalls <= 0
    ) {
      continue;
    }

    rows.push({
      id: `telus-service-${agentId}-${currentDate}-${index}`,
      reportType: "telusServiceAgents",
      fileName,
      sourceSheet: sheetName,
      callCenter: "Telus",
      agentGroup: getAgentGroup(agentName),
      date: currentDate || "Unknown Date",
      agentName,
      agentId,
      callCenterId,
      serviceAnsweredCalls,
      serviceAvgTalkTime,
      outboundAnsweredCalls,
      outboundAvgTalkTime,
      totalAnsweredCalls,
      totalAvgTalkTime,
      weightedTalkMinutes:
        totalAnsweredCalls > 0 ? totalAnsweredCalls * totalAvgTalkTime : 0,
    });
  }

  return rows;
}

function parseAbandonedCallsByHour(workbook, fileName) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const headerRow = matrix[0] || [];
  const rows = [];

  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];

    if (!Array.isArray(row)) continue;

    const date = normalizeDate(row[1] || row[0]);
    const weekday = cleanText(row[2] || row[1]);

    if (!date || date === "Unknown Date") continue;

    for (let colIndex = 3; colIndex < headerRow.length; colIndex += 1) {
      const hour = toNumber(headerRow[colIndex]);
      const abandonedCalls = toNumber(row[colIndex]);

      if (hour < 0 || hour > 23) continue;

      rows.push({
        id: `abandoned-${date}-${hour}`,
        reportType: "abandonedCalls",
        fileName,
        sourceSheet: sheetName,
        callCenter: "Network",
        date,
        weekday,
        hour,
        abandonedCalls,
      });
    }
  }

  return rows;
}

function buildDateRange(rows, key = "date") {
  const dates = [...new Set(rows.map((row) => row[key]).filter(Boolean))]
    .filter((date) => date !== "Unknown Date")
    .sort();

  if (!dates.length) {
    return {
      startDate: "Date not detected",
      endDate: "Date not detected",
      dateRange: "Date not detected",
      dateCount: 0,
    };
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    dateRange:
      dates[0] === dates[dates.length - 1]
        ? dates[0]
        : `${dates[0]} to ${dates[dates.length - 1]}`,
    dateCount: dates.length,
  };
}

export async function parseOperationsFile(file, typeOverride = "") {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  let reportType = typeOverride;

  if (!reportType) {
    if (lowerName.includes("abandoned")) reportType = "abandonedCalls";
    if (lowerName.includes("tus") || lowerName.includes("telus")) {
      reportType = "telusServiceAgents";
    }
  }

  let rows = [];

  if (reportType === "telusServiceAgents") {
    rows = parseTelusServiceAgents(workbook, fileName);
  }

  if (reportType === "abandonedCalls") {
    rows = parseAbandonedCallsByHour(workbook, fileName);
  }

  if (!rows.length) {
    throw new Error(`No operational rows could be parsed from ${fileName}.`);
  }

  const dateInfo = buildDateRange(rows);

  return {
    fileName,
    reportType,
    uploadedAt: new Date().toLocaleString(),
    rowCount: rows.length,
    ...dateInfo,
    rows,
  };
}

export function calculateOperationsInsights(operationsReports = []) {
  const allRows = operationsReports.flatMap((report) => report.rows || []);

  const serviceRows = allRows.filter(
    (row) => row.reportType === "telusServiceAgents"
  );

  const abandonedRows = allRows.filter(
    (row) => row.reportType === "abandonedCalls"
  );

  const serviceAgentIds = [
    ...new Set(serviceRows.map((row) => row.agentId).filter(Boolean)),
  ];

  const totalServiceCalls = serviceRows.reduce(
    (total, row) => total + Number(row.serviceAnsweredCalls || 0),
    0
  );

  const totalOutboundCalls = serviceRows.reduce(
    (total, row) => total + Number(row.outboundAnsweredCalls || 0),
    0
  );

  const totalAnsweredCalls = serviceRows.reduce(
    (total, row) => total + Number(row.totalAnsweredCalls || 0),
    0
  );

  const totalWeightedTalkMinutes = serviceRows.reduce(
    (total, row) => total + Number(row.weightedTalkMinutes || 0),
    0
  );

  const weightedAvgTalkTime =
    totalAnsweredCalls > 0 ? totalWeightedTalkMinutes / totalAnsweredCalls : 0;

  const serviceByAgentMap = serviceRows.reduce((acc, row) => {
    const key = row.agentId || row.agentName;

    if (!acc[key]) {
      acc[key] = {
        agentName: row.agentName,
        agentId: row.agentId,
        agentGroup: row.agentGroup,
        totalAnsweredCalls: 0,
        serviceAnsweredCalls: 0,
        outboundAnsweredCalls: 0,
        weightedTalkMinutes: 0,
      };
    }

    acc[key].totalAnsweredCalls += Number(row.totalAnsweredCalls || 0);
    acc[key].serviceAnsweredCalls += Number(row.serviceAnsweredCalls || 0);
    acc[key].outboundAnsweredCalls += Number(row.outboundAnsweredCalls || 0);
    acc[key].weightedTalkMinutes += Number(row.weightedTalkMinutes || 0);

    return acc;
  }, {});

  const topServiceAgents = Object.values(serviceByAgentMap)
    .map((agent) => ({
      ...agent,
      avgTalkTime:
        agent.totalAnsweredCalls > 0
          ? agent.weightedTalkMinutes / agent.totalAnsweredCalls
          : 0,
    }))
    .sort((a, b) => b.totalAnsweredCalls - a.totalAnsweredCalls)
    .slice(0, 15);

  const totalAbandonedCalls = abandonedRows.reduce(
    (total, row) => total + Number(row.abandonedCalls || 0),
    0
  );

  const abandonedByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourRows = abandonedRows.filter((row) => Number(row.hour) === hour);
    const total = hourRows.reduce(
      (sum, row) => sum + Number(row.abandonedCalls || 0),
      0
    );

    return {
      hour,
      abandonedCalls: total,
    };
  });

  const peakHour =
    [...abandonedByHour].sort(
      (a, b) => b.abandonedCalls - a.abandonedCalls
    )[0] || null;

  const abandonedByDateMap = abandonedRows.reduce((acc, row) => {
    const key = row.date;

    if (!acc[key]) {
      acc[key] = {
        date: row.date,
        weekday: row.weekday,
        abandonedCalls: 0,
      };
    }

    acc[key].abandonedCalls += Number(row.abandonedCalls || 0);

    return acc;
  }, {});

  const abandonedByDate = Object.values(abandonedByDateMap).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  const peakDay =
    [...abandonedByDate].sort(
      (a, b) => b.abandonedCalls - a.abandonedCalls
    )[0] || null;

  const abandonedDateInfo = buildDateRange(abandonedRows);
  const serviceDateInfo = buildDateRange(serviceRows);

  return {
    service: {
      dateRange: serviceDateInfo.dateRange,
      dateCount: serviceDateInfo.dateCount,
      agentCount: serviceAgentIds.length,
      totalServiceCalls,
      totalOutboundCalls,
      totalAnsweredCalls,
      weightedAvgTalkTime,
      topServiceAgents,
    },

    abandoned: {
      dateRange: abandonedDateInfo.dateRange,
      dateCount: abandonedDateInfo.dateCount,
      totalAbandonedCalls,
      peakHour,
      peakDay,
      abandonedByHour,
      abandonedByDate,
    },
  };
}