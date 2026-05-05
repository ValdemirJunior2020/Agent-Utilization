// src/utils/billableHoursEngine.js

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeDivide(numerator, denominator) {
  const top = Number(numerator || 0);
  const bottom = Number(denominator || 0);

  if (!bottom) return 0;

  return (top / bottom) * 100;
}

function normalizeAgentKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getScheduleAgentLabel(row) {
  if (row.employeeId && row.agentName) {
    return `${row.agentName} (${row.employeeId})`;
  }

  return row.agentName || row.employeeId || "";
}

function buildCoverageAudit({ scheduleRows, utilizationRows }) {
  const scheduledAgents = unique(
    scheduleRows.map((row) => getScheduleAgentLabel(row))
  );

  const scheduledAgentKeys = unique(
    scheduleRows.flatMap((row) => [
      normalizeAgentKey(row.agentName),
      normalizeAgentKey(row.employeeId),
      normalizeAgentKey(`${row.agentName}${row.employeeId}`),
    ])
  );

  const utilizationAgents = unique(
    utilizationRows.map((row) => row.agent || row.agentName || row.employeeId)
  );

  const utilizationAgentKeys = unique(
    utilizationRows.flatMap((row) => [
      normalizeAgentKey(row.agent),
      normalizeAgentKey(row.agentName),
      normalizeAgentKey(row.employeeId),
    ])
  );

  const utilizationKeySet = new Set(utilizationAgentKeys);
  const scheduleKeySet = new Set(scheduledAgentKeys);

  const missingScheduledAgents = scheduledAgents.filter((agentLabel) => {
    const normalized = normalizeAgentKey(agentLabel);
    const nameOnly = normalizeAgentKey(agentLabel.replace(/\(.*?\)/g, ""));

    return (
      normalized &&
      !utilizationKeySet.has(normalized) &&
      !utilizationKeySet.has(nameOnly)
    );
  });

  const extraUtilizationAgents = utilizationAgents.filter((agent) => {
    const normalized = normalizeAgentKey(agent);

    return normalized && !scheduleKeySet.has(normalized);
  });

  const matchedAgentCount = Math.max(
    Math.min(scheduledAgents.length, utilizationAgents.length) -
      missingScheduledAgents.length,
    0
  );

  const matchRate = safeDivide(matchedAgentCount, scheduledAgents.length);

  return {
    scheduledAgents,
    utilizationAgents,
    scheduledAgentCount: scheduledAgents.length,
    utilizationAgentCount: utilizationAgents.length,
    matchedAgentCount,
    missingScheduledAgents,
    extraUtilizationAgents,
    missingScheduledAgentCount: missingScheduledAgents.length,
    extraUtilizationAgentCount: extraUtilizationAgents.length,
    matchRate,
  };
}

function statusFor(row) {
  if (!row.hasSchedule) return "No Schedule";
  if (!row.hasUtilization) return "No Utilization";
  if (row.overlapDateCount <= 0) return "No Overlap";

  if (
    row.missingScheduledAgentCount > 0 ||
    row.matchRate < 80 ||
    row.utilizationAgentCount === 0
  ) {
    return "Data Coverage / Accuracy Risk";
  }

  if (row.phoneUtilization < 35 || row.scheduleAdherence < 70) {
    return "Needs Validation";
  }

  if (row.phoneUtilization < 50 || row.scheduleAdherence < 90) {
    return "Needs Review";
  }

  return "Healthy";
}

function buildSiteBillableRow({ callCenter, utilizationRows, scheduleRows }) {
  const scheduleDates = unique(
    scheduleRows.map((row) => row.scheduleDateEastern)
  ).sort();

  const utilizationDates = unique(utilizationRows.map((row) => row.date)).sort();

  const overlapDates = scheduleDates.filter((date) =>
    utilizationDates.includes(date)
  );

  const overlapScheduleRows = scheduleRows.filter((row) =>
    overlapDates.includes(row.scheduleDateEastern)
  );

  const overlapUtilizationRows = utilizationRows.filter((row) =>
    overlapDates.includes(row.date)
  );

  const finalScheduleRows = overlapScheduleRows.length
    ? overlapScheduleRows
    : scheduleRows;

  const finalUtilizationRows = overlapUtilizationRows.length
    ? overlapUtilizationRows
    : utilizationRows;

  const billableHours = sum(finalScheduleRows, "billableHours");
  const productiveScheduledHours = sum(finalScheduleRows, "productiveHours");

  const phoneHours = sum(finalUtilizationRows, "onCallHours");
  const loggedHours = sum(finalUtilizationRows, "loggedHours");
  const availableHours = sum(finalUtilizationRows, "availableHours");
  const breakHours = sum(finalUtilizationRows, "breakHours");
  const offlineHours = sum(finalUtilizationRows, "offlineHours");

  const coverageAudit = buildCoverageAudit({
    scheduleRows: finalScheduleRows,
    utilizationRows: finalUtilizationRows,
  });

  const result = {
    callCenter,

    scheduleDateRange:
      scheduleDates.length > 1
        ? `${scheduleDates[0]} to ${scheduleDates[scheduleDates.length - 1]}`
        : scheduleDates[0] || "No schedule",

    utilizationDateRange:
      utilizationDates.length > 1
        ? `${utilizationDates[0]} to ${
            utilizationDates[utilizationDates.length - 1]
          }`
        : utilizationDates[0] || "No utilization",

    overlapDateRange:
      overlapDates.length > 1
        ? `${overlapDates[0]} to ${overlapDates[overlapDates.length - 1]}`
        : overlapDates[0] || "No overlap",

    overlapDateCount: overlapDates.length,

    scheduleAgentCount: coverageAudit.scheduledAgentCount,
    utilizationAgentCount: coverageAudit.utilizationAgentCount,
    matchedAgentCount: coverageAudit.matchedAgentCount,
    missingScheduledAgentCount: coverageAudit.missingScheduledAgentCount,
    extraUtilizationAgentCount: coverageAudit.extraUtilizationAgentCount,
    missingScheduledAgents: coverageAudit.missingScheduledAgents,
    extraUtilizationAgents: coverageAudit.extraUtilizationAgents,
    matchRate: coverageAudit.matchRate,

    billableHours,
    productiveScheduledHours,

    phoneHours,
    loggedHours,
    availableHours,
    breakHours,
    offlineHours,

    nonPhoneBillableHours: Math.max(billableHours - phoneHours, 0),
    unaccountedHours: billableHours - loggedHours,

    phoneUtilization: safeDivide(phoneHours, billableHours),
    productivePhoneUtilization: safeDivide(phoneHours, productiveScheduledHours),
    scheduleAdherence: safeDivide(loggedHours, billableHours),
    availablePctOfBillable: safeDivide(availableHours, billableHours),
    breakPctOfBillable: safeDivide(breakHours, billableHours),
    offlinePctOfBillable: safeDivide(offlineHours, billableHours),

    hasSchedule: scheduleRows.length > 0,
    hasUtilization: utilizationRows.length > 0,

    hourlyBucketDistortionRisk: true,
    requiresManualValidation: true,
  };

  result.status = statusFor(result);

  return result;
}

export function calculateBillableAnalysis({
  utilizationRows = [],
  scheduleReports = [],
}) {
  const scheduleRows = scheduleReports.flatMap((report) => report.rows || []);

  const callCenters = unique([
    ...utilizationRows.map((row) => row.callCenter),
    ...scheduleRows.map((row) => row.callCenter),
  ]).filter(Boolean);

  const siteRows = callCenters.map((callCenter) =>
    buildSiteBillableRow({
      callCenter,
      utilizationRows: utilizationRows.filter(
        (row) => row.callCenter === callCenter
      ),
      scheduleRows: scheduleRows.filter((row) => row.callCenter === callCenter),
    })
  );

  const totals = {
    callCenterCount: siteRows.length,
    billableHours: sum(siteRows, "billableHours"),
    productiveScheduledHours: sum(siteRows, "productiveScheduledHours"),
    phoneHours: sum(siteRows, "phoneHours"),
    loggedHours: sum(siteRows, "loggedHours"),
    availableHours: sum(siteRows, "availableHours"),
    breakHours: sum(siteRows, "breakHours"),
    offlineHours: sum(siteRows, "offlineHours"),
    missingScheduledAgentCount: sum(siteRows, "missingScheduledAgentCount"),
    extraUtilizationAgentCount: sum(siteRows, "extraUtilizationAgentCount"),
  };

  totals.nonPhoneBillableHours = Math.max(
    totals.billableHours - totals.phoneHours,
    0
  );

  totals.unaccountedHours = totals.billableHours - totals.loggedHours;
  totals.phoneUtilization = safeDivide(totals.phoneHours, totals.billableHours);
  totals.productivePhoneUtilization = safeDivide(
    totals.phoneHours,
    totals.productiveScheduledHours
  );
  totals.scheduleAdherence = safeDivide(totals.loggedHours, totals.billableHours);

  return {
    totals,
    siteRows,
    scheduleRows,
  };
}