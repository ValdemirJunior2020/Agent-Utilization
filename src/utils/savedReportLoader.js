// /src/utils/savedReportLoader.js

import { parseExcelFile } from "./excelParser";
import { savedReportFiles } from "../data/savedReports";

async function parseReportUrl(url, fileName) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load saved report: ${fileName}`);
  }

  const blob = await response.blob();

  const file = new File([blob], fileName, {
    type:
      blob.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return parseExcelFile(file);
}

export async function loadSavedReportFiles() {
  const reports = [];
  const errors = [];

  for (const savedFile of savedReportFiles) {
    try {
      const report = await parseReportUrl(savedFile.url, savedFile.fileName);

      reports.push({
        ...report,
        description: savedFile.description,
        loadedAutomatically: true,
      });
    } catch (error) {
      errors.push(`${savedFile.fileName}: ${error.message}`);
    }
  }

  return {
    reports,
    errors,
  };
}