// /src/utils/savedOperationsLoader.js

import { parseOperationsFile } from "./operationsInsightsParser";
import { savedOperationsFiles } from "../data/savedOperationsFiles";

async function parseOperationsUrl(savedFile) {
  const response = await fetch(savedFile.url);

  if (!response.ok) {
    throw new Error(`Could not load saved operations file: ${savedFile.fileName}`);
  }

  const blob = await response.blob();

  const file = new File([blob], savedFile.fileName, {
    type:
      blob.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const report = await parseOperationsFile(file, savedFile.type);

  return {
    ...report,
    callCenter: savedFile.callCenter,
    description: savedFile.description,
    loadedAutomatically: true,
  };
}

export async function loadSavedOperationsFiles() {
  const reports = [];
  const errors = [];

  for (const savedFile of savedOperationsFiles) {
    try {
      const report = await parseOperationsUrl(savedFile);
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