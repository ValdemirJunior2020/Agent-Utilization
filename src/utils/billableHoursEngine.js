// /src/utils/billableHoursEngine.js

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

function normalizeAgentName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function buildCoverageAudit({ scheduleRows, utilizationRows }) {
  const scheduledAgents = unique(
    scheduleRows.map((row) => row.agentName || row.employeeId)
  );

  const utilizationAgents = unique(utilizationRows.map((row) => row.agent));

  const normalizedUtilAgents = new Set(
    utilizationAgents.map((agent) => normalizeAgentName(agent))
  );

  const missingScheduledAgents = scheduledAgents.filter((agent) => {
    const normalized = normalizeAgentName(agent);
    return normalized && !normalizedUtilAgents.has(normalized);
  });

  const normalizedScheduleAgents = new Set(
    scheduledAgents.map((agent) => normalizeAgentName(agent))
  );

  const extraUtilizationAgents = utilizationAgents.filter((agent) => {
    const normalized = normalizeAgentName(agent);
    return normalized && !normalizedScheduleAgents.has(normalized);
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

  const billableHours = sum(overlapScheduleRows, "billableHours");
  const phoneHours = sum(overlapUtilizationRows, "onCallHours");
  const loggedHours = sum(overlapUtilizationRows, "loggedHours");
  const availableHours = sum(overlapUtilizationRows, "availableHours");
  const breakHours = sum(overlapUtilizationRows, "breakHours");
  const offlineHours = sum(overlapUtilizationRows, "offlineHours");

  const coverageAudit = buildCoverageAudit({
    scheduleRows: overlapScheduleRows.length ? overlapScheduleRows : scheduleRows,
    utilizationRows: overlapUtilizationRows.length
      ? overlapUtilizationRows
      : utilizationRows,
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
    phoneHours,
    loggedHours,
    availableHours,
    breakHours,
    offlineHours,

    nonPhoneBillableHours: Math.max(billableHours - phoneHours, 0),
    unaccountedHours: billableHours - loggedHours,

    phoneUtilization: safeDivide(phoneHours, billableHours),
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
  ]).filter((callCenter) => ["Buwelo", "WNS"].includes(callCenter));

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
  totals.scheduleAdherence = safeDivide(totals.loggedHours, totals.billableHours);

  return {
    totals,
    siteRows,
    scheduleRows,
  };
}