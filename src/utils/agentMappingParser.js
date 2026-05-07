// /src/utils/agentMappingParser.js

import * as XLSX from "xlsx";

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeText(value) {
  return cleanText(value).toLowerCase();
}

function normalizeHpId(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, "");
}

function columnLetterToIndex(letter) {
  let index = 0;
  const normalized = String(letter || "").toUpperCase().trim();

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
  if (text === "first name") return true;
  if (text === "last name") return true;
  if (text === "full name") return true;
  if (text.includes("grand total")) return true;
  if (text === "total") return true;
  if (text === "null") return true;
  if (text === "undefined") return true;

  return false;
}

function isValidHpId(value) {
  const text = normalizeHpId(value);

  if (!text) return false;
  if (text === "-") return false;
  if (text === "hpid") return false;
  if (text === "hp id") return false;
  if (text === "id") return false;
  if (text === "id*") return false;
  if (text === "tp id") return false;
  if (text === "tp id number") return false;
  if (text === "tp id on tableau") return false;
  if (text === "n/a") return false;
  if (text === "na") return false;
  if (text === "null") return false;
  if (text.length < 3) return false;

  return true;
}

function getAgentName(row, config) {
  if (config.fullNameColumn) {
    const fullNameIndex = columnLetterToIndex(config.fullNameColumn);
    return cleanText(row[fullNameIndex]);
  }

  const firstNameIndex = columnLetterToIndex(config.firstNameColumn);
  const lastNameIndex = columnLetterToIndex(config.lastNameColumn);

  const firstName = cleanText(row[firstNameIndex]);
  const lastName = cleanText(row[lastNameIndex]);

  return cleanText(`${firstName} ${lastName}`);
}

function getBillableValue(row, config) {
  if (!config.billableColumn) return "";
  const billableIndex = columnLetterToIndex(config.billableColumn);
  return cleanText(row[billableIndex]);
}

function getIdColumns(config) {
  if (Array.isArray(config.hpIdColumns) && config.hpIdColumns.length) {
    return config.hpIdColumns;
  }

  if (config.hpIdColumn) {
    return [config.hpIdColumn];
  }

  return [];
}

function buildHpIdAliases(hpIdOriginal) {
  const raw = normalizeHpId(hpIdOriginal);
  const aliases = new Set();

  if (!raw) return [];

  aliases.add(raw);

  if (raw.startsWith("hp")) {
    aliases.add(raw.replace(/^hp/, ""));
  } else if (/^\d+$/.test(raw)) {
    aliases.add(`hp${raw}`);
  }

  if (raw.startsWith("tes")) {
    aliases.add(raw.replace(/^tes/, ""));
  } else if (/^\d+$/.test(raw)) {
    aliases.add(`tes${raw}`);
  }

  if (raw.startsWith("tp")) {
    aliases.add(raw.replace(/^tp/, ""));
  } else if (/^\d+$/.test(raw)) {
    aliases.add(`tp${raw}`);
  }

  return [...aliases];
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

  const idColumns = getIdColumns(config);
  const rows = [];
  const map = {};
  const seen = new Set();

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];

    if (!Array.isArray(row)) continue;

    const agentName = getAgentName(row, config);
    const billable = getBillableValue(row, config);

    if (isBadName(agentName)) continue;

    for (const idColumn of idColumns) {
      const idIndex = columnLetterToIndex(idColumn);
      const hpIdOriginal = cleanText(row[idIndex]);
      const hpId = normalizeHpId(hpIdOriginal);

      if (!isValidHpId(hpIdOriginal)) continue;

      const uniqueKey = `${config.callCenter}-${config.sheetName}-${idColumn}-${hpId}`;

      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      const record = {
        id: uniqueKey,
        callCenter: config.callCenter,
        sourceLabel: config.sourceLabel || config.sheetName,
        hpId,
        hpIdOriginal,
        idColumn,
        agentName,
        billable,
        rowNumber: rowIndex + 1,
        sourceFile: file.name,
        sourceSheet: sheetName,
      };

      rows.push(record);

      for (const alias of buildHpIdAliases(hpIdOriginal)) {
        map[alias] = record;
      }
    }
  }

  if (!rows.length) {
    throw new Error(
      `No agent mapping rows found in ${file.name}. Check tab "${sheetName}", name columns, and ID columns ${idColumns.join(
        ", "
      )}.`
    );
  }

  return {
    fileName: file.name,
    callCenter: config.callCenter,
    sourceLabel: config.sourceLabel || sheetName,
    sheetName,
    uploadedAt: new Date().toLocaleString(),
    rowCount: rows.length,
    mappingCount: rows.length,
    rows,
    map,
  };
}

function buildAgentMappingIndex(mappingReports = []) {
  const index = {};

  for (const report of mappingReports) {
    const callCenter = report.callCenter;

    if (!index[callCenter]) {
      index[callCenter] = {};
    }

    for (const row of report.rows || []) {
      for (const alias of buildHpIdAliases(row.hpIdOriginal || row.hpId)) {
        index[callCenter][alias] = row;
      }
    }
  }

  return index;
}

function buildTelusIndexFromOperations(operationsReports = []) {
  const index = {};

  const serviceRows = operationsReports
    .flatMap((report) => report.rows || [])
    .filter((row) => row.reportType === "telusServiceAgents");

  for (const row of serviceRows) {
    const agentId = cleanText(row.agentId);
    const agentName = cleanText(row.agentName);

    if (!agentId || !agentName) continue;

    const record = {
      callCenter: "Telus",
      sourceLabel: "TUS Service Agents",
      hpId: normalizeHpId(agentId),
      hpIdOriginal: agentId,
      agentName,
      billable: "",
      rowNumber: 0,
      sourceFile: row.fileName || "TUS Service Agents.xlsx",
      sourceSheet: row.sourceSheet || "",
      idColumn: "Agent ID",
    };

    for (const alias of buildHpIdAliases(agentId)) {
      index[alias] = record;
    }
  }

  return index;
}

export function applyAgentMappings(
  rows = [],
  mappingReports = [],
  operationsReports = []
) {
  const mappingIndex = buildAgentMappingIndex(mappingReports);
  const telusIndex = buildTelusIndexFromOperations(operationsReports);

  return rows.map((row) => {
    const callCenter = row.callCenter;
    const rawAgent = cleanText(row.agent || row.agentId || row.agentName);
    const normalizedAgent = normalizeHpId(rawAgent);

    let mapping = mappingIndex[callCenter]?.[normalizedAgent];

    if (!mapping && callCenter === "Telus") {
      mapping = telusIndex[normalizedAgent];
    }

    if (!mapping) {
      return {
        ...row,
        agentOriginal: rawAgent,
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
      agentMappingSource: mapping.sourceLabel,
      agentMappingColumn: mapping.idColumn,
      agentBillable: mapping.billable,
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

  const fileNames = [
    ...new Set(mappingReports.map((report) => report.fileName).filter(Boolean)),
  ];

  const sources = mappingReports.map((report) => ({
    callCenter: report.callCenter,
    fileName: report.fileName,
    sheetName: report.sheetName,
    sourceLabel: report.sourceLabel,
    mappingCount: report.mappingCount || 0,
  }));

  return {
    totalMappings,
    callCenters,
    fileNames,
    sources,
  };
}