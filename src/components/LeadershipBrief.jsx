// /src/components/LeadershipBrief.jsx

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LineChart,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { hours, percent } from "../utils/formatters";

function getBestSite(siteKPIs = []) {
  return [...siteKPIs].sort((a, b) => b.utilization - a.utilization)[0];
}

function getLowestSite(siteKPIs = []) {
  return [...siteKPIs].sort((a, b) => a.utilization - b.utilization)[0];
}

function getHighest(siteKPIs = [], key) {
  return [...siteKPIs].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0];
}

function getVendorAction(site) {
  if (!site) return "No vendor action available.";

  if (site.utilization >= 70 && site.breakPct <= 20 && site.offlinePct <= 10) {
    return "Use as benchmark. Review this site’s staffing model, AUX discipline, and agent behavior as a possible best-practice standard.";
  }

  if (site.utilization < 60) {
    return "Immediate vendor review required. Ask for staffing interval analysis, AUX reason-code detail, schedule adherence results, and explanation for low paid-time conversion.";
  }

  if (site.breakPct > 25) {
    return "Ask vendor to validate Break AUX mapping and compare actual break usage against paid break policy and schedules.";
  }

  if (site.offlinePct > 10) {
    return "Ask vendor to explain Offline / Not Ready time with meeting, coaching, system issue, and status reason-code detail.";
  }

  if (site.availablePct > 25) {
    return "Compare staffing intervals to call arrival volume. High Available time may mean overstaffing, low demand, or idle status behavior.";
  }

  return "Monitor weekly. Review agent-level outliers and compare utilization with QA, attendance, and call volume.";
}

function getDataQualityWarnings({ totals, siteKPIs, rows, history }) {
  const warnings = [];

  if (!history?.length) {
    warnings.push({
      title: "Mock or no uploaded file detected",
      detail:
        "Leadership reporting should only be finalized after real Tableau Excel reports are uploaded.",
    });
  }

  if (!totals?.reportDateRange || totals.reportDateRange === "Date not detected") {
    warnings.push({
      title: "Report period not detected",
      detail:
        "The dashboard could not detect the report date range. Validate the Tableau export structure before presenting final conclusions.",
    });
  }

  if (totals?.reportDateCount && totals.reportDateCount < 20) {
    warnings.push({
      title: "Possible partial month",
      detail: `Only ${totals.reportDateCount} report date(s) were detected. Confirm whether this is a full month or a partial export.`,
    });
  }

  if (rows?.some((row) => !row.agent || row.agent === "Unknown Agent")) {
    warnings.push({
      title: "Some agent names were not detected",
      detail:
        "Some rows may have missing or blank agent names. Tableau merged-style rows must carry the last agent name down correctly.",
    });
  }

  siteKPIs.forEach((site) => {
    if (site.loggedHours <= 0) {
      warnings.push({
        title: `${site.callCenter}: no logged hours`,
        detail:
          "This site has no detected logged hours. Validate that the Excel columns and Grand Total values were parsed correctly.",
      });
    }

    if (site.agentCount <= 2) {
      warnings.push({
        title: `${site.callCenter}: small sample size`,
        detail:
          "Small sites can look better or worse because low volume creates stronger percentage swings.",
      });
    }
  });

  return warnings;
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
    .sort((a, b) => {
      if (a.onCallHours <= 0.01 && b.onCallHours > 0.01) return -1;
      if (b.onCallHours <= 0.01 && a.onCallHours > 0.01) return 1;
      return a.utilization - b.utilization;
    })
    .slice(0, 10);
}

function SiteActionCard({ site }) {
  const isHealthy = site.status === "Healthy";
  const isCritical = site.status === "Critical";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-hpNavy">{site.callCenter}</p>
          <p className="mt-1 text-sm text-slate-500">
            {percent(site.utilization)} paid-time productivity
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isHealthy
              ? "bg-green-50 text-green-700"
              : isCritical
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {site.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-bold text-slate-500">Available</p>
          <p className="text-base font-black text-hpNavy">{percent(site.availablePct)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-bold text-slate-500">Break</p>
          <p className="text-base font-black text-hpNavy">{percent(site.breakPct)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-bold text-slate-500">Offline</p>
          <p className="text-base font-black text-hpNavy">{percent(site.offlinePct)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="font-bold text-slate-500">Agents</p>
          <p className="text-base font-black text-hpNavy">{site.agentCount}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-sky-50 p-3 text-sm leading-6 text-slate-700">
        <span className="font-black text-hpNavy">Action: </span>
        {getVendorAction(site)}
      </div>
    </div>
  );
}

export default function LeadershipBrief({
  summary,
  dashboard,
  redFlags,
  recommendations,
  history,
  rows,
}) {
  const { totals, siteKPIs, agentKPIs } = dashboard;

  const bestSite = getBestSite(siteKPIs);
  const lowestSite = getLowestSite(siteKPIs);
  const highestBreak = getHighest(siteKPIs, "breakPct");
  const highestOffline = getHighest(siteKPIs, "offlinePct");
  const highestAvailable = getHighest(siteKPIs, "availablePct");
  const atRiskAgents = getTopAtRiskAgents(agentKPIs);
  const dataWarnings = getDataQualityWarnings({ totals, siteKPIs, rows, history });

  const nonCallPaidHours =
    Number(totals.availableHours || 0) +
    Number(totals.breakHours || 0) +
    Number(totals.offlineHours || 0);

  const nonCallPaidPct =
    totals.loggedHours > 0 ? (nonCallPaidHours / totals.loggedHours) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-hpNavy via-slate-900 to-hpBlue p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Executive Operations Review
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              April 2026 Agent Utilization Executive Review
            </h2>

            <p className="mt-2 max-w-5xl text-sm leading-7 text-sky-50 sm:text-base">
              Vendor productivity, AUX behavior, staffing risk, and paid-time conversion analysis.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sky-100">
              <CalendarDays size={18} />
              <p className="text-xs font-black uppercase tracking-widest">Report Period</p>
            </div>
            <p className="mt-2 text-xl font-black">
              {totals.reportDateRange || "Date not detected"}
            </p>
            <p className="text-sm text-sky-100">
              {totals.reportDateCount || 0} detected production day(s)
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-white sm:text-base">
          {summary}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
          <TrendingUp className="text-green-700" />
          <p className="mt-3 text-sm font-black uppercase tracking-widest text-green-700">
            Best Performer
          </p>
          <p className="mt-1 text-2xl font-black text-green-950">
            {bestSite?.callCenter || "N/A"}
          </p>
          <p className="mt-1 text-sm text-green-800">
            {percent(bestSite?.utilization || 0)} paid-time productivity
          </p>
        </div>

        <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
          <TrendingDown className="text-red-700" />
          <p className="mt-3 text-sm font-black uppercase tracking-widest text-red-700">
            Lowest Productivity
          </p>
          <p className="mt-1 text-2xl font-black text-red-950">
            {lowestSite?.callCenter || "N/A"}
          </p>
          <p className="mt-1 text-sm text-red-800">
            {percent(lowestSite?.utilization || 0)} paid-time productivity
          </p>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <Banknote className="text-amber-700" />
          <p className="mt-3 text-sm font-black uppercase tracking-widest text-amber-700">
            Paid Time Not On Calls
          </p>
          <p className="mt-1 text-2xl font-black text-amber-950">
            {hours(nonCallPaidHours)}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {nonCallPaidPct.toFixed(1)}% of logged time
          </p>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
          <ShieldAlert className="text-hpBlue" />
          <p className="mt-3 text-sm font-black uppercase tracking-widest text-hpBlue">
            Risk Signals
          </p>
          <p className="mt-1 text-2xl font-black text-hpNavy">{redFlags.length}</p>
          <p className="mt-1 text-sm text-slate-600">
            {redFlags.filter((flag) => flag.severity === "Critical").length} critical issue(s)
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <Target className="mt-1 text-hpBlue" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Leadership Story
            </p>
            <h3 className="mt-1 text-2xl font-black text-hpNavy">
              What the reports are telling us
            </h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            <p className="font-black text-hpNavy">Main message for leadership</p>
            <p className="mt-2">
              The key question is not only whether agents are logged in. The real executive
              question is how much paid time is converting into customer handling time.
              Low On Call percentage can represent staffing inefficiency, low call volume,
              AUX misuse, schedule adherence issues, or incorrect Tableau status mapping.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            <p className="font-black text-hpNavy">AUX interpretation</p>
            <p className="mt-2">
              High Available can indicate overstaffing or low volume. High Break can indicate
              AUX abuse, adherence gaps, or mapping issues. High Offline can represent meetings,
              coaching, system issues, or status misuse. These should be reviewed before making
              staffing decisions.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-black text-slate-500">Highest Break Risk</p>
            <p className="mt-1 text-xl font-black text-hpNavy">
              {highestBreak?.callCenter || "N/A"}
            </p>
            <p className="text-sm text-slate-600">{percent(highestBreak?.breakPct || 0)}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-black text-slate-500">Highest Offline Risk</p>
            <p className="mt-1 text-xl font-black text-hpNavy">
              {highestOffline?.callCenter || "N/A"}
            </p>
            <p className="text-sm text-slate-600">{percent(highestOffline?.offlinePct || 0)}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-black text-slate-500">Highest Available / Idle</p>
            <p className="mt-1 text-xl font-black text-hpNavy">
              {highestAvailable?.callCenter || "N/A"}
            </p>
            <p className="text-sm text-slate-600">
              {percent(highestAvailable?.availablePct || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-hpBlue" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Vendor Action Required
            </p>
            <h3 className="text-2xl font-black text-hpNavy">
              Site-by-site leadership actions
            </h3>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {siteKPIs.map((site) => (
            <SiteActionCard key={site.callCenter} site={site} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <Users className="text-hpBlue" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Agent-Level Coaching Opportunities
              </p>
              <h3 className="text-2xl font-black text-hpNavy">
                Top 10 agents requiring review
              </h3>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-3 py-3">Agent</th>
                  <th className="px-3 py-3">Site</th>
                  <th className="px-3 py-3">Utilization</th>
                  <th className="px-3 py-3">Break</th>
                  <th className="px-3 py-3">Offline</th>
                  <th className="px-3 py-3">Reason</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {atRiskAgents.length ? (
                  atRiskAgents.map((agent) => {
                    const reason =
                      agent.onCallHours <= 0.01
                        ? "Zero On Call"
                        : agent.utilization < 60
                        ? "Low utilization"
                        : agent.breakPct > 25
                        ? "High Break"
                        : agent.offlinePct > 10
                        ? "High Offline"
                        : "Review";

                    return (
                      <tr key={`${agent.callCenter}-${agent.agent}`}>
                        <td className="px-3 py-3 font-black text-hpNavy">{agent.agent}</td>
                        <td className="px-3 py-3">{agent.callCenter}</td>
                        <td className="px-3 py-3">{percent(agent.utilization)}</td>
                        <td className="px-3 py-3">{percent(agent.breakPct)}</td>
                        <td className="px-3 py-3">{percent(agent.offlinePct)}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                            {reason}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan="6">
                      No agent-level risks detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Data Quality Protection
              </p>
              <h3 className="text-2xl font-black text-hpNavy">
                Validate before final decisions
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {dataWarnings.length ? (
              dataWarnings.map((warning) => (
                <div
                  key={warning.title}
                  className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
                >
                  <p className="font-black text-amber-900">{warning.title}</p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">{warning.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-700" />
                  <p className="font-black text-green-900">No major data quality warnings</p>
                </div>
                <p className="mt-1 text-sm text-green-800">
                  Dates and logged hours were detected. Still validate with Tableau before final
                  vendor escalation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <LineChart className="text-hpBlue" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Recommended Next Steps
            </p>
            <h3 className="text-2xl font-black text-hpNavy">
              What leadership should ask each vendor
            </h3>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[
            "Ask each vendor to validate AUX mapping.",
            "Compare staffing schedule against call arrival volume.",
            "Review agents with zero or very low On Call time.",
            "Validate whether Available time means low volume or overstaffing.",
            "Require vendor explanation for Break and Offline percentages.",
            "Use the strongest site as the productivity benchmark.",
            "Repeat this review weekly instead of waiting until month-end.",
            "Compare utilization against QA scores, attendance, and handle time.",
          ].map((step, index) => (
            <div
              key={step}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hpBlue text-sm font-black text-white">
                {index + 1}
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-700">{step}</p>
            </div>
          ))}
        </div>

        {!!recommendations.length && (
          <div className="mt-5 rounded-2xl bg-hpNavy p-4 text-white">
            <p className="font-black">System-generated recommendation</p>
            <p className="mt-1 text-sm leading-6 text-sky-50">
              {recommendations[0].title}: {recommendations[0].detail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}