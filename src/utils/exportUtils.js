// /src/utils/exportUtils.js

import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import autoTableImport from "jspdf-autotable";

function runAutoTable(doc, options) {
  if (typeof autoTableImport === "function") {
    autoTableImport(doc, options);
    return;
  }

  if (typeof doc.autoTable === "function") {
    doc.autoTable(options);
    return;
  }

  throw new Error(
    "PDF table export failed because jspdf-autotable was not loaded correctly."
  );
}

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

function getFinalY(doc, fallback = 40) {
  return doc.lastAutoTable?.finalY || fallback;
}

function getBestSite(siteKPIs = []) {
  return [...siteKPIs].sort(
    (a, b) => Number(b.utilization || 0) - Number(a.utilization || 0)
  )[0];
}

function getLowestSite(siteKPIs = []) {
  return [...siteKPIs].sort(
    (a, b) => Number(a.utilization || 0) - Number(b.utilization || 0)
  )[0];
}

function getHighest(siteKPIs = [], key) {
  return [...siteKPIs].sort(
    (a, b) => Number(b[key] || 0) - Number(a[key] || 0)
  )[0];
}

function getTopAtRiskAgents(agentKPIs = []) {
  return [...agentKPIs]
    .filter(
      (agent) =>
        Number(agent.utilization || 0) < 60 ||
        Number(agent.breakPct || 0) > 25 ||
        Number(agent.offlinePct || 0) > 10 ||
        Number(agent.onCallHours || 0) <= 0.01
    )
    .sort((a, b) => Number(a.utilization || 0) - Number(b.utilization || 0))
    .slice(0, 15);
}

export function exportCsv(fileName, rows) {
  if (!rows || !rows.length) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(",")
    ),
  ].join("\n");

  saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
}

export function exportSummaryPdf({
  summary = "",
  totals = {},
  siteKPIs = [],
  agentKPIs = [],
  redFlags = [],
  recommendations = [],
  history = [],
}) {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const generatedDate = new Date().toLocaleString();

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
      Number(totals.loggedHours || 0) > 0
        ? (nonCallPaidHours / Number(totals.loggedHours || 0)) * 100
        : 0;

    doc.setFillColor(7, 26, 45);
    doc.rect(0, 0, 297, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("HotelPlanner Operations View", 14, 12);

    doc.setFontSize(10);
    doc.text("April 2026 Agent Utilization Executive Review", 14, 19);
    doc.text(`Generated: ${generatedDate}`, 230, 12);
    doc.text(
      `Report Period: ${totals.reportDateRange || "Date not detected"}`,
      230,
      19
    );

    doc.setTextColor(7, 26, 45);
    doc.setFontSize(13);
    doc.text("Executive Summary", 14, 38);

    doc.setFontSize(9);
    const summaryText =
      summary ||
      "No executive summary is available. Upload Tableau Excel reports to generate the executive review.";
    const summaryLines = doc.splitTextToSize(summaryText, 265);
    doc.text(summaryLines, 14, 45);

    runAutoTable(doc, {
      startY: 62,
      head: [["Executive KPI", "Value", "Leadership Meaning"]],
      body: [
        [
          "Report Period",
          totals.reportDateRange || "Date not detected",
          `${totals.reportDateCount || 0} detected production day(s)`,
        ],
        [
          "Uploaded Reports",
          history.length,
          "Number of Excel reports included in this review",
        ],
        [
          "Call Centers",
          totals.callCenterCount || siteKPIs.length || 0,
          "Number of vendor/site reports included",
        ],
        [
          "Agents",
          totals.agentCount || 0,
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
          `${nonCallPaidPct.toFixed(
            1
          )}% of logged time in Available, Break, or Offline`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [7, 26, 45], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    runAutoTable(doc, {
      startY: getFinalY(doc, 95) + 8,
      head: [["Leadership Signal", "Site", "Result"]],
      body: [
        [
          "Best performer",
          bestSite?.callCenter || "N/A",
          formatPercent(bestSite?.utilization),
        ],
        [
          "Lowest productivity",
          lowestSite?.callCenter || "N/A",
          formatPercent(lowestSite?.utilization),
        ],
        [
          "Highest Break risk",
          highestBreak?.callCenter || "N/A",
          formatPercent(highestBreak?.breakPct),
        ],
        [
          "Highest Offline risk",
          highestOffline?.callCenter || "N/A",
          formatPercent(highestOffline?.offlinePct),
        ],
        [
          "Highest Available / Idle",
          highestAvailable?.callCenter || "N/A",
          formatPercent(highestAvailable?.availablePct),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [0, 119, 200], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    runAutoTable(doc, {
      startY: getFinalY(doc, 125) + 8,
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
          "Productivity",
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
      headStyles: { fillColor: [0, 119, 200], textColor: [255, 255, 255] },
      styles: { fontSize: 7 },
    });

    runAutoTable(doc, {
      startY: getFinalY(doc, 160) + 8,
      head: [["Severity", "Site", "Issue", "Suggested Action"]],
      body: redFlags.length
        ? redFlags
            .slice(0, 12)
            .map((flag) => [
              flag.severity,
              flag.site || flag.callCenter || "N/A",
              flag.title,
              flag.action || flag.suggestedAction || "",
            ])
        : [["N/A", "N/A", "No red flags detected", "Continue monitoring weekly"]],
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      styles: { fontSize: 7 },
    });

    runAutoTable(doc, {
      startY: getFinalY(doc, 185) + 8,
      head: [["Agent", "Site", "Utilization", "Break", "Offline", "On Call Hours"]],
      body: atRiskAgents.length
        ? atRiskAgents.map((agent) => [
            agent.agent,
            agent.callCenter,
            formatPercent(agent.utilization),
            formatPercent(agent.breakPct),
            formatPercent(agent.offlinePct),
            formatNumber(agent.onCallHours),
          ])
        : [["N/A", "N/A", "N/A", "N/A", "N/A", "No agent risks detected"]],
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      styles: { fontSize: 7 },
    });

    runAutoTable(doc, {
      startY: getFinalY(doc, 205) + 8,
      head: [["Recommended Next Step", "Reason"]],
      body: [
        [
          "Ask each vendor to validate AUX mapping.",
          "Break, Offline, and Available statuses can distort productivity if mapped incorrectly.",
        ],
        [
          "Compare staffing schedule against call arrival volume.",
          "High Available may be overstaffing or low demand.",
        ],
        [
          "Review agents with zero or very low On Call time.",
          "Logged time without call handling must be explained.",
        ],
        [
          "Require vendor explanation for Break and Offline percentages.",
          "These statuses directly impact paid-time conversion.",
        ],
        [
          "Repeat this review weekly.",
          "Weekly review prevents month-end surprises.",
        ],
        ...recommendations
          .slice(0, 6)
          .map((item) => [item.title || "Recommendation", item.detail || ""]),
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] },
      styles: { fontSize: 7 },
    });

    doc.save("hotelplanner-operations-executive-review.pdf");
  } catch (error) {
    console.error("PDF export failed:", error);
    alert(`PDF export failed: ${error.message}`);
  }
}