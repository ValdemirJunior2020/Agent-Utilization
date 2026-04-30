// src/utils/excelParser.js

import * as XLSX from "xlsx";
import { normalizeRows, detectCallCenter, detectReportDates } from "./normalizeData";

function buildReportPeriod(reportDates) {
  const cleanDates = [...new Set(reportDates.filter(Boolean))]
    .filter((date) => date !== "Unknown Date")
    .sort();

  if (!cleanDates.length) {
    return {
      startDate: "Date not detected",
      endDate: "Date not detected",
      label: "Date not detected",
      dateCount: 0,
    };
  }

  const startDate = cleanDates[0];
  const endDate = cleanDates[cleanDates.length - 1];

  return {
    startDate,
    endDate,
    label: startDate === endDate ? startDate : `${startDate} to ${endDate}`,
    dateCount: cleanDates.length,
  };
}

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("No sheet found in workbook.");
  }

  const sheet = workbook.Sheets[sheetName];

  const rawMatrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const callCenter = detectCallCenter(file.name);
  const rows = normalizeRows(rawMatrix, file.name);
  const reportDates = detectReportDates(rows, rawMatrix);
  const reportPeriod = buildReportPeriod(reportDates);

  const rowsWithReportDates = rows.map((row) => ({
    ...row,
    reportStartDate: reportPeriod.startDate,
    reportEndDate: reportPeriod.endDate,
    reportDateRange: reportPeriod.label,
    reportDateCount: reportPeriod.dateCount,
  }));

  return {
    fileName: file.name,
    sheetName,
    callCenter,
    reportStartDate: reportPeriod.startDate,
    reportEndDate: reportPeriod.endDate,
    reportDateRange: reportPeriod.label,
    reportDateCount: reportPeriod.dateCount,
    reportDates,
    rowCount: rowsWithReportDates.length,
    uploadedAt: new Date().toLocaleString(),
    rows: rowsWithReportDates,
  };
}

export async function parseExcelUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load ${url}`);
  }

  const blob = await response.blob();
  const name = decodeURIComponent(url.split("/").pop());

  const file = new File([blob], name, {
    type:
      blob.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return parseExcelFile(file);
}