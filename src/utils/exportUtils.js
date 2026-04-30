// /src/utils/exportUtils.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatNumber(value) {
  return Number(value || 0).toFixed(1);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getBestSite(siteKPIs = []) {
  return [...siteKPIs].sort((a, b) => b.utilization - a.utilization)[0];
}

function getLowestSite(siteKPIs = []) {
  return [...siteKPIs].sort((a, b) => a.utilization - b.utilization)[0];
}

function getHighest(siteKPIs = [], key) {
  return [...siteKPIs].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0];
}

function getTopAtRiskAgents(agentKPIs = []) {
  return [...agentKPIs]
    .filter(
      (agent) =>
        agent.utilization < 60 ||
        agent.breakPct > 25 ||
        agent.offlinePct > 10 ||
        agent.onCallHours <= 0.01
    )
    .sort((a, b) => a.utilization - b.utilization)
    .slice(0, 15);
}

export function exportCsv(fileName, rows) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");

  saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
}

export function exportSummaryPdf({
  summary,
  totals,
  siteKPIs,
  agentKPIs = [],
  redFlags,
  recommendations,
}) {
  const doc = new jsPDF({ orientation: "landscape" });
  const date = new Date().toLocaleString();

  const bestSite = getBestSite(siteKPIs);
  const lowestSite = getLowestSite(siteKPIs);
  const highestBreak = getHighest(siteKPIs, "breakPct");
  const highestOffline = getHighest(siteKPIs, "offlinePct");
  const highestAvailable = getHighest(siteKPIs, "availablePct");
  const atRiskAgents = getTopAtRiskAgents(agentKPIs);

  const nonCallPaidHours =
    Number(totals.availableHours || 0) +
    Number(totals.breakHours || 0) +
    Number(totals.offlineHours || 0);

  const nonCallPaidPct =
    totals.loggedHours > 0 ? (nonCallPaidHours / totals.loggedHours) * 100 : 0;

  doc.setFontSize(18);
  doc.text("April 2026 Agent Utilization Executive Review", 14, 16);

  doc.setFontSize(10);
  doc.text("Vendor productivity, AUX behavior, staffing risk, and paid-time conversion analysis", 14, 23);
  doc.text(`Generated: ${date}`, 14, 29);
  doc.text(`Report Period: ${totals.reportDateRange || "Date not detected"}`, 14, 35);

  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(summary, 265);
  doc.text(summaryLines, 14, 45);

  autoTable(doc, {
    startY: 62,
    head: [["Executive KPI", "Value", "Leadership Meaning"]],
    body: [
      [
        "Report Period",
        totals.reportDateRange || "Date not detected",
        `${totals.reportDateCount || 0} detected production day(s)`,
      ],
      [
        "Call Centers",
        totals.callCenterCount,
        "Number of vendor/site reports included",
      ],
      [
        "Agents",
        totals.agentCount,
        "Unique agent count across uploaded reports",
      ],
      [
        "Logged Hours",
        formatNumber(totals.loggedHours),
        "Total paid/logged time detected",
      ],
      [
        "On Call Hours",
        formatNumber(totals.onCallHours),
        "Time converted into customer handling",
      ],
      [
        "Paid-Time Productivity",
        formatPercent(totals.utilization),
        "On Call Hours divided by Logged Hours",
      ],
      [
        "Paid Time Not On Calls",
        formatNumber(nonCallPaidHours),
        `${nonCallPaidPct.toFixed(1)}% of logged time in Available, Break, or Offline`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [7, 26, 45] },
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Leadership Signal", "Site", "Result"]],
    body: [
      ["Best performer", bestSite?.callCenter || "N/A", formatPercent(bestSite?.utilization)],
      ["Lowest productivity", lowestSite?.callCenter || "N/A", formatPercent(lowestSite?.utilization)],
      ["Highest Break risk", highestBreak?.callCenter || "N/A", formatPercent(highestBreak?.breakPct)],
      ["Highest Offline risk", highestOffline?.callCenter || "N/A", formatPercent(highestOffline?.offlinePct)],
      [
        "Highest Available / Idle",
        highestAvailable?.callCenter || "N/A",
        formatPercent(highestAvailable?.availablePct),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 119, 200] },
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [
      [
        "Call Center",
        "Period",
        "Agents",
        "On Call",
        "Available",
        "Break",
        "Offline",
        "Logged",
        "Paid-Time Productivity",
        "Status",
      ],
    ],
    body: siteKPIs.map((site) => [
      site.callCenter,
      site.reportDateRange || totals.reportDateRange || "N/A",
      site.agentCount,
      formatNumber(site.onCallHours),
      formatNumber(site.availableHours),
      formatNumber(site.breakHours),
      formatNumber(site.offlineHours),
      formatNumber(site.loggedHours),
      formatPercent(site.utilization),
      site.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: [0, 119, 200] },
    styles: { fontSize: 7 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Severity", "Site", "Issue", "Suggested Action"]],
    body: redFlags
      .slice(0, 12)
      .map((flag) => [flag.severity, flag.site, flag.title, flag.action]),
    theme: "grid",
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 7 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Agent", "Site", "Utilization", "Break", "Offline", "On Call Hours"]],
    body: atRiskAgents.map((agent) => [
      agent.agent,
      agent.callCenter,
      formatPercent(agent.utilization),
      formatPercent(agent.breakPct),
      formatPercent(agent.offlinePct),
      formatNumber(agent.onCallHours),
    ]),
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11] },
    styles: { fontSize: 7 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Recommended Next Step", "Reason"]],
    body: [
      ["Ask each vendor to validate AUX mapping.", "Break, Offline, and Available statuses can distort productivity if mapped incorrectly."],
      ["Compare staffing schedule against call arrival volume.", "High Available may be overstaffing or low demand."],
      ["Review agents with zero or very low On Call time.", "Logged time without call handling must be explained."],
      ["Require vendor explanation for Break and Offline percentages.", "These statuses directly impact paid-time conversion."],
      ["Repeat this review weekly.", "Weekly review prevents month-end surprises."],
      ...recommendations.slice(0, 6).map((item) => [item.title, item.detail]),
    ],
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74] },
    styles: { fontSize: 7 },
  });

  doc.save("hotelplanner-operations-executive-review.pdf");
}