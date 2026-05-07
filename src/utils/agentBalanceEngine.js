// /src/utils/agentBalanceEngine.js

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

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function number(value) {
  return Number(value || 0);
}

function getAgentKey(row) {
  return `${row.callCenter || "Unknown"}-${row.agent || row.agentDisplayName || row.agentHpId || "Unknown"}`;
}

function getAgentName(row) {
  return row.agentDisplayName || row.agentName || row.agent || row.agentHpId || "Unknown Agent";
}

function getRiskLevel(score) {
  if (score >= 80) return "Critical";
  if (score >= 55) return "High Risk";
  if (score >= 30) return "Needs Review";
  return "Healthy";
}

function getRiskClass(level) {
  if (level === "Critical") return "critical";
  if (level === "High Risk") return "high";
  if (level === "Needs Review") return "review";
  return "healthy";
}

function calculateRiskReasons(agent) {
  const reasons = [];
  let score = 0;

  if (agent.breakPct >= 20 || agent.breakHours > 1.3) {
    reasons.push(
      `Break time is high: ${agent.breakHours.toFixed(1)}h (${agent.breakPct.toFixed(1)}% of logged time).`
    );
    score += 25;
  }

  if (agent.availablePct >= 35 || agent.availableHours > 2) {
    reasons.push(
      `Available time is high: ${agent.availableHours.toFixed(1)}h (${agent.availablePct.toFixed(1)}% of logged time).`
    );
    score += 25;
  }

  if (agent.offlinePct >= 15 || agent.offlineHours > 1) {
    reasons.push(
      `Offline time is high: ${agent.offlineHours.toFixed(1)}h (${agent.offlinePct.toFixed(1)}% of logged time).`
    );
    score += 20;
  }

  if (agent.phonePct < 35 && agent.loggedHours > 0) {
    reasons.push(
      `On Call time is low: ${agent.phonePct.toFixed(1)}% of logged time.`
    );
    score += 25;
  }

  if (agent.availableHours > 1 && agent.abandonedCallsDuringAgentDates > 0) {
    reasons.push(
      `Agent had Available time while abandoned calls existed on the same reporting dates. This may indicate routing, queue assignment, skill setup, or Tableau bucket logic issue.`
    );
    score += 20;
  }

  if (!agent.agentMapped) {
    reasons.push(
      "Agent is not mapped to a real name. This should be validated before coaching or escalation."
    );
    score += 10;
  }

  if (!reasons.length) {
    reasons.push("No major balance issue detected based on the current thresholds.");
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}

function buildAbandonedByDate(operationsReports = []) {
  const abandonedRows = operationsReports
    .flatMap((report) => report.rows || [])
    .filter((row) => row.reportType === "abandonedCalls");

  return abandonedRows.reduce((acc, row) => {
    const date = row.date;

    if (!date) return acc;

    if (!acc[date]) {
      acc[date] = {
        date,
        abandonedCalls: 0,
        hours: {},
      };
    }

    const abandonedCalls = number(row.abandonedCalls);
    const hour = Number(row.hour);

    acc[date].abandonedCalls += abandonedCalls;

    if (Number.isFinite(hour)) {
      acc[date].hours[hour] = (acc[date].hours[hour] || 0) + abandonedCalls;
    }

    return acc;
  }, {});
}

function buildHourlyPressure(operationsReports = []) {
  const abandonedRows = operationsReports
    .flatMap((report) => report.rows || [])
    .filter((row) => row.reportType === "abandonedCalls");

  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    abandonedCalls: 0,
  }));

  for (const row of abandonedRows) {
    const hour = Number(row.hour);

    if (hour >= 0 && hour <= 23) {
      byHour[hour].abandonedCalls += number(row.abandonedCalls);
    }
  }

  return byHour
    .filter((row) => row.abandonedCalls > 0)
    .sort((a, b) => b.abandonedCalls - a.abandonedCalls);
}

function buildTelusProductionIndex(operationsReports = []) {
  const serviceRows = operationsReports
    .flatMap((report) => report.rows || [])
    .filter((row) => row.reportType === "telusServiceAgents");

  const index = {};

  for (const row of serviceRows) {
    const keys = [
      normalizeText(row.agentName),
      normalizeText(row.agentId),
    ].filter(Boolean);

    for (const key of keys) {
      if (!index[key]) {
        index[key] = {
          totalAnsweredCalls: 0,
          serviceAnsweredCalls: 0,
          outboundAnsweredCalls: 0,
          weightedTalkMinutes: 0,
        };
      }

      index[key].totalAnsweredCalls += number(row.totalAnsweredCalls);
      index[key].serviceAnsweredCalls += number(row.serviceAnsweredCalls);
      index[key].outboundAnsweredCalls += number(row.outboundAnsweredCalls);
      index[key].weightedTalkMinutes += number(row.weightedTalkMinutes);
    }
  }

  return index;
}

export function calculateAgentBalanceQueueRisk({
  utilizationRows = [],
  operationsReports = [],
}) {
  const abandonedByDate = buildAbandonedByDate(operationsReports);
  const hourlyPressure = buildHourlyPressure(operationsReports);
  const telusProductionIndex = buildTelusProductionIndex(operationsReports);

  const agentMap = {};

  for (const row of utilizationRows) {
    const key = getAgentKey(row);

    if (!agentMap[key]) {
      agentMap[key] = {
        callCenter: row.callCenter || "Unknown",
        agent: getAgentName(row),
        agentOriginal: row.agentOriginal || row.agent || "",
        agentHpId: row.agentHpId || "",
        agentMapped: Boolean(row.agentMapped),
        dates: new Set(),
        onCallHours: 0,
        availableHours: 0,
        breakHours: 0,
        offlineHours: 0,
        loggedHours: 0,
        abandonedCallsDuringAgentDates: 0,
      };
    }

    const agent = agentMap[key];

    agent.dates.add(row.date);

    agent.onCallHours += number(row.onCallHours);
    agent.availableHours += number(row.availableHours);
    agent.breakHours += number(row.breakHours);
    agent.offlineHours += number(row.offlineHours);
    agent.loggedHours += number(row.loggedHours);
  }

  const agentRows = Object.values(agentMap).map((agent) => {
    const dates = [...agent.dates].filter(Boolean);

    const abandonedCallsDuringAgentDates = dates.reduce((total, date) => {
      return total + number(abandonedByDate[date]?.abandonedCalls);
    }, 0);

    const phonePct = safeDivide(agent.onCallHours, agent.loggedHours);
    const availablePct = safeDivide(agent.availableHours, agent.loggedHours);
    const breakPct = safeDivide(agent.breakHours, agent.loggedHours);
    const offlinePct = safeDivide(agent.offlineHours, agent.loggedHours);

    const production =
      telusProductionIndex[normalizeText(agent.agent)] ||
      telusProductionIndex[normalizeText(agent.agentHpId)] ||
      null;

    const totalAnsweredCalls = production?.totalAnsweredCalls || 0;
    const callsPerOnCallHour =
      agent.onCallHours > 0 ? totalAnsweredCalls / agent.onCallHours : 0;

    const enrichedAgent = {
      ...agent,
      dateCount: dates.length,
      dates,
      abandonedCallsDuringAgentDates,
      phonePct,
      availablePct,
      breakPct,
      offlinePct,
      totalAnsweredCalls,
      callsPerOnCallHour,
    };

    const risk = calculateRiskReasons(enrichedAgent);

    return {
      ...enrichedAgent,
      riskScore: risk.score,
      riskLevel: getRiskLevel(risk.score),
      riskClass: getRiskClass(getRiskLevel(risk.score)),
      riskReasons: risk.reasons,
    };
  });

  agentRows.sort((a, b) => b.riskScore - a.riskScore);

  const totals = {
    agentCount: agentRows.length,
    criticalCount: agentRows.filter((agent) => agent.riskLevel === "Critical").length,
    highRiskCount: agentRows.filter((agent) => agent.riskLevel === "High Risk").length,
    needsReviewCount: agentRows.filter((agent) => agent.riskLevel === "Needs Review").length,
    healthyCount: agentRows.filter((agent) => agent.riskLevel === "Healthy").length,
    totalAvailableHours: sum(agentRows, "availableHours"),
    totalBreakHours: sum(agentRows, "breakHours"),
    totalOfflineHours: sum(agentRows, "offlineHours"),
    totalOnCallHours: sum(agentRows, "onCallHours"),
    totalAbandonedCalls: Object.values(abandonedByDate).reduce(
      (total, row) => total + number(row.abandonedCalls),
      0
    ),
    callCenters: unique(agentRows.map((agent) => agent.callCenter)),
  };

  return {
    totals,
    agentRows,
    hourlyPressure,
    abandonedByDate: Object.values(abandonedByDate).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    ),
  };
}