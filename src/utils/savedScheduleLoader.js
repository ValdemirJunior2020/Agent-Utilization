// /src/utils/savedScheduleLoader.js

import { parseScheduleFile } from "./scheduleParser";
import { savedScheduleFiles } from "../data/savedSchedules";

async function parseScheduleUrl(url, fileName) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load saved schedule: ${fileName}`);
  }

  const blob = await response.blob();

  const file = new File([blob], fileName, {
    type:
      blob.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return parseScheduleFile(file);
}

export async function loadSavedScheduleReports() {
  const reports = [];
  const errors = [];

  for (const savedFile of savedScheduleFiles) {
    try {
      const report = await parseScheduleUrl(savedFile.url, savedFile.fileName);
      reports.push(report);
    } catch (error) {
      errors.push(`${savedFile.fileName}: ${error.message}`);
    }
  }

  return {
    reports,
    errors,
  };
}