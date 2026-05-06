// /src/utils/savedAgentMappingLoader.js

import { parseAgentMappingFile } from "./agentMappingParser";
import { savedAgentMappingFiles } from "../data/savedAgentMappings";

async function parseMappingUrl(config) {
  const response = await fetch(config.url);

  if (!response.ok) {
    throw new Error(`Could not load saved agent mapping: ${config.fileName}`);
  }

  const blob = await response.blob();

  const file = new File([blob], config.fileName, {
    type:
      blob.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return parseAgentMappingFile(file, config);
}

export async function loadSavedAgentMappings() {
  const reports = [];
  const errors = [];

  for (const config of savedAgentMappingFiles) {
    try {
      const report = await parseMappingUrl(config);
      reports.push(report);
    } catch (error) {
      errors.push(`${config.fileName} / ${config.sheetName}: ${error.message}`);
    }
  }

  return {
    reports,
    errors,
  };
}