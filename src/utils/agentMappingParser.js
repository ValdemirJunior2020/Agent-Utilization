// /src/utils/agentMappingParser.js

import * as XLSX from "xlsx";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeHpId(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, "");
}

function columnLetterToIndex(letter) {
  let index = 0;
  const normalized = String(letter || "").toUpperCase();

  for (let i = 0; i < normalized.length; i += 1) {
    index = index * 26 + normalized.charCodeAt(i) - 64;
  }

  return index - 1;
}

function isBadName(value) {
  const text = normalizeText(value);

  if (!text) return true;
  if (text === "agent") return true;
  if (text === "agent name") return true;
  if (text === "name") return true;
  if (text.includes("grand total")) return true;
  if (text === "total") return true;

  return false;
}

function isValidHpId(value) {
  const text = normalizeHpId(value);

  if (!text) return false;
  if (text === "hpid") return false;
  if (text === "hp id") return false;
  if (text === "hp") return false;
  if (text.length < 3) return false;

  return true;
}

export async function parseAgentMappingFile(file, config) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const sheetName = config.sheetName;

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(
      `${file.name} must include the "${sheetName}" tab for ${config.callCenter}.`
    );
  }

  const sheet = workbook.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const hpIdIndex = columnLetterToIndex(config.hpIdColumn);
  const nameIndex = columnLetterToIndex(config.nameColumn);

  const rows = [];
  const map = {};

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];

    if (!Array.isArray(row)) continue;

    const agentName = cleanText(row[nameIndex]);
    const hpIdRaw = cleanText(row[hpIdIndex]);
    const hpId = normalizeHpId(hpIdRaw);

    if (isBadName(agentName)) continue;
    if (!isValidHpId(hpId)) continue;

    const record = {
      id: `${config.callCenter}-${hpId}`,
      callCenter: config.callCenter,
      hpId,
      hpIdOriginal: hpIdRaw,
      agentName,
      rowNumber: rowIndex + 1,
      sourceFile: file.name,
      sourceSheet: sheetName,
    };

    rows.push(record);
    map[hpId] = record;
  }

  if (!rows.length) {
    throw new Error(
      `No agent mapping rows found in ${file.name}. Check tab "${sheetName}", name column ${config.nameColumn}, and HP ID column ${config.hpIdColumn}.`
    );
  }

  return {
    fileName: file.name,
    callCenter: config.callCenter,
    sheetName,
    uploadedAt: new Date().toLocaleString(),
    rowCount: rows.length,
    mappingCount: rows.length,
    rows,
    map,
  };
}

export function buildAgentMappingIndex(mappingReports = []) {
  const index = {};

  for (const report of mappingReports) {
    const callCenter = report.callCenter;

    if (!index[callCenter]) {
      index[callCenter] = {};
    }

    for (const row of report.rows || []) {
      index[callCenter][normalizeHpId(row.hpId)] = row;
      index[callCenter][normalizeHpId(row.hpIdOriginal)] = row;
    }
  }

  return index;
}

export function applyAgentMappings(rows = [], mappingReports = []) {
  const mappingIndex = buildAgentMappingIndex(mappingReports);

  return rows.map((row) => {
    const callCenter = row.callCenter;
    const rawAgent = cleanText(row.agent || row.agentId || row.agentName);
    const normalizedAgent = normalizeHpId(rawAgent);
    const mapping = mappingIndex[callCenter]?.[normalizedAgent];

    if (!mapping) {
      return {
        ...row,
        agentHpId: rawAgent,
        agentDisplayName: rawAgent,
        agentMapped: false,
      };
    }

    return {
      ...row,
      agentOriginal: rawAgent,
      agentHpId: mapping.hpIdOriginal || rawAgent,
      agentName: mapping.agentName,
      agentDisplayName: mapping.agentName,
      agentMapped: true,

      // This makes charts/tables show the real name instead of hp ID.
      agent: mapping.agentName,
    };
  });
}

export function getAgentMappingSummary(mappingReports = []) {
  const totalMappings = mappingReports.reduce(
    (total, report) => total + Number(report.mappingCount || 0),
    0
  );

  const callCenters = [
    ...new Set(mappingReports.map((report) => report.callCenter).filter(Boolean)),
  ];

  return {
    totalMappings,
    callCenters,
    fileNames: mappingReports.map((report) => report.fileName),
  };
}