// src/utils/calculateKPIs.js

import { KPI_RULES } from "../data/kpiRules";
import { safeDivide } from "./formatters";

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    const group = row[key] || "Unknown";
    acc[group] = acc[group] || [];
    acc[group].push(row);
    return acc;
  }, {});
}

function cleanDates(rows) {
  return [...new Set(rows.map((row) => row.date).filter(Boolean))]
    .filter((date) => date !== "Unknown Date")
    .sort();
}

function buildDateRange(rows) {
  const dates = cleanDates(rows);

  if (!dates.length) {
    const fallbackStart = rows.find((row) => row.reportStartDate)?.reportStartDate;
    const fallbackEnd = rows.find((row) => row.reportEndDate)?.reportEndDate;
    const fallbackRange = rows.find((row) => row.reportDateRange)?.reportDateRange;

    return {
      reportStartDate: fallbackStart || "Date not detected",
      reportEndDate: fallbackEnd || "Date not detected",
      reportDateRange: fallbackRange || "Date not detected",
      reportDateCount: 0,
    };
  }

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  return {
    reportStartDate: startDate,
    reportEndDate: endDate,
    reportDateRange: startDate === endDate ? startDate : `${startDate} to ${endDate}`,
    reportDateCount: dates.length,
  };
}

function siteStatus(site) {
  if (
    site.utilization < KPI_RULES.utilizationCritical ||
    site.breakPct > KPI_RULES.breakCritical ||
    site.offlinePct > KPI_RULES.offlineRisk
  ) {
    return "Critical";
  }

  if (
    site.utilization < KPI_RULES.utilizationReview ||
    site.availablePct > KPI_RULES.availableRisk ||
    site.onCallPct < KPI_RULES.onCallLoggedRisk
  ) {
    return "Needs Review";
  }

  return "Healthy";
}

export function calculateAgentKPIs(rows) {
  return Object.entries(groupBy(rows, "agent")).map(([agent, agentRows]) => {
    const dateInfo = buildDateRange(agentRows);

    const onCallHours = sum(agentRows, "onCallHours");
    const availableHours = sum(agentRows, "availableHours");
    const breakHours = sum(agentRows, "breakHours");
    const offlineHours = sum(agentRows, "offlineHours");
    const loggedHours =
      sum(agentRows, "loggedHours") ||
      onCallHours + availableHours + breakHours + offlineHours;

    const utilization = safeDivide(onCallHours, loggedHours);

    const item = {
      agent,
      callCenter: agentRows[0]?.callCenter || "Unknown",
      rows: agentRows.length,

      reportStartDate: dateInfo.reportStartDate,
      reportEndDate: dateInfo.reportEndDate,
      reportDateRange: dateInfo.reportDateRange,
      reportDateCount: dateInfo.reportDateCount,

      onCallHours,
      availableHours,
      breakHours,
      offlineHours,
      loggedHours,
      utilization,
      onCallPct: safeDivide(onCallHours, loggedHours),
      availablePct: safeDivide(availableHours, loggedHours),
      breakPct: safeDivide(breakHours, loggedHours),
      offlinePct: safeDivide(offlineHours, loggedHours),
    };

    item.status = siteStatus(item);

    return item;
  });
}

export function calculateSiteKPIs(rows) {
  return Object.entries(groupBy(rows, "callCenter"))
    .map(([callCenter, siteRows]) => {
      const dateInfo = buildDateRange(siteRows);
      const agents = calculateAgentKPIs(siteRows);

      const onCallHours = sum(siteRows, "onCallHours");
      const availableHours = sum(siteRows, "availableHours");
      const breakHours = sum(siteRows, "breakHours");
      const offlineHours = sum(siteRows, "offlineHours");
      const loggedHours =
        sum(siteRows, "loggedHours") ||
        onCallHours + availableHours + breakHours + offlineHours;

      const site = {
        callCenter,

        reportStartDate: dateInfo.reportStartDate,
        reportEndDate: dateInfo.reportEndDate,
        reportDateRange: dateInfo.reportDateRange,
        reportDateCount: dateInfo.reportDateCount,

        agentCount: new Set(siteRows.map((row) => row.agent)).size,
        rows: siteRows.length,
        onCallHours,
        availableHours,
        breakHours,
        offlineHours,
        loggedHours,
        utilization: safeDivide(onCallHours, loggedHours),
        onCallPct: safeDivide(onCallHours, loggedHours),
        availablePct: safeDivide(availableHours, loggedHours),
        breakPct: safeDivide(breakHours, loggedHours),
        offlinePct: safeDivide(offlineHours, loggedHours),
        averageOnCallPerAgent: agents.length ? onCallHours / agents.length : 0,
        averageLoggedPerAgent: agents.length ? loggedHours / agents.length : 0,
        zeroOnCallAgents: agents.filter((agent) => agent.onCallHours <= 0.01).length,
        belowUtilizationTarget: agents.filter(
          (agent) => agent.utilization < KPI_RULES.utilizationCritical
        ).length,
        highBreakAgents: agents.filter(
          (agent) => agent.breakPct > KPI_RULES.breakReview
        ).length,
        highOfflineAgents: agents.filter(
          (agent) => agent.offlinePct > KPI_RULES.offlineRisk
        ).length,
        agents,
      };

      site.status = siteStatus(site);

      return site;
    })
    .sort((a, b) => b.utilization - a.utilization);
}

export function calculateDailyTrend(rows) {
  const byDayAndSite = rows.reduce((acc, row) => {
    const date = row.date || "Unknown Date";
    const key = `${date}|${row.callCenter}`;

    acc[key] = acc[key] || {
      date,
      callCenter: row.callCenter,
      onCallHours: 0,
      loggedHours: 0,
    };

    acc[key].onCallHours += Number(row.onCallHours || 0);
    acc[key].loggedHours += Number(row.loggedHours || 0);

    return acc;
  }, {});

  return Object.values(byDayAndSite)
    .map((item) => ({
      ...item,
      utilization: safeDivide(item.onCallHours, item.loggedHours),
    }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function calculateDashboard(rows) {
  const dateInfo = buildDateRange(rows);

  const siteKPIs = calculateSiteKPIs(rows);
  const agentKPIs = calculateAgentKPIs(rows);

  const totals = {
    reportStartDate: dateInfo.reportStartDate,
    reportEndDate: dateInfo.reportEndDate,
    reportDateRange: dateInfo.reportDateRange,
    reportDateCount: dateInfo.reportDateCount,

    agentCount: new Set(rows.map((row) => `${row.callCenter}-${row.agent}`)).size,
    callCenterCount: siteKPIs.length,
    onCallHours: sum(rows, "onCallHours"),
    availableHours: sum(rows, "availableHours"),
    breakHours: sum(rows, "breakHours"),
    offlineHours: sum(rows, "offlineHours"),
    loggedHours: sum(rows, "loggedHours"),
  };

  totals.utilization = safeDivide(totals.onCallHours, totals.loggedHours);
  totals.onCallPct = safeDivide(totals.onCallHours, totals.loggedHours);
  totals.availablePct = safeDivide(totals.availableHours, totals.loggedHours);
  totals.breakPct = safeDivide(totals.breakHours, totals.loggedHours);
  totals.offlinePct = safeDivide(totals.offlineHours, totals.loggedHours);

  return {
    totals,
    siteKPIs,
    agentKPIs,
    dailyTrend: calculateDailyTrend(rows),
  };
}