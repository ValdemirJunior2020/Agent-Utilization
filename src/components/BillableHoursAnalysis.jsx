// /src/components/BillableHoursAnalysis.jsx

import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Headphones,
  ShieldAlert,
  X,
  Users,
  DatabaseZap,
} from "lucide-react";
import { calculateBillableAnalysis } from "../utils/billableHoursEngine";
import { hours } from "../utils/formatters";

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function statusClass(status) {
  if (status === "Healthy") {
    return "bg-green-50 text-green-700 ring-green-100 hover:bg-green-100";
  }

  if (status === "Needs Review") {
    return "bg-amber-50 text-amber-700 ring-amber-100 hover:bg-amber-100";
  }

  if (status === "Needs Validation") {
    return "bg-orange-50 text-orange-700 ring-orange-100 hover:bg-orange-100";
  }

  if (status === "Data Coverage / Accuracy Risk") {
    return "bg-red-50 text-red-700 ring-red-100 hover:bg-red-100";
  }

  if (status === "No Utilization" || status === "No Overlap") {
    return "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200";
}

function MetricCard({ title, value, detail, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-hpBlue",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    navy: "bg-slate-100 text-hpNavy",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-hpNavy">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>

        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function getRiskReasons(site) {
  const reasons = [];

  if (!site.hasUtilization) {
    reasons.push({
      title: "No utilization data loaded",
      detail:
        "The schedule denominator exists, but there is no Tableau utilization numerator loaded for this site. Phone utilization cannot be calculated until utilization reports are loaded.",
    });
  }

  if (site.overlapDateCount <= 0) {
    reasons.push({
      title: "No valid date overlap",
      detail:
        "The schedule file and utilization file do not currently share comparable dates. The system protects the analysis by not comparing a full-month utilization file against a partial or mismatched schedule period.",
    });
  }

  if (site.missingScheduledAgentCount > 0) {
    reasons.push({
      title: "Scheduled agents may be missing from Tableau",
      detail:
        "Some agents exist in the schedule denominator but do not appear in the Tableau utilization numerator. If agents are missing from Tableau, phone hours will be incomplete and the utilization percentage may look artificially low.",
    });
  }

  if (site.matchRate < 80 && site.scheduleAgentCount > 0) {
    reasons.push({
      title: "Low schedule-to-utilization match rate",
      detail:
        "The schedule and utilization report do not appear to have strong agent coverage alignment. This may be due to missing Tableau agents, different agent IDs, different naming conventions, or agents manually needing to be added by the reporting team.",
    });
  }

  if (site.phoneUtilization < 35 && site.hasUtilization && site.billableHours > 0) {
    reasons.push({
      title: "Low phone-time conversion",
      detail:
        "Phone utilization is below 35%. This is a risk signal, but it should not be used as a final vendor performance conclusion until missing agents, schedule coverage, and Tableau bucket logic are validated.",
    });
  }

  if (site.scheduleAdherence < 70 && site.hasUtilization && site.billableHours > 0) {
    reasons.push({
      title: "Low schedule adherence against billable hours",
      detail:
        "Logged/status hours are far below scheduled billable hours. This could mean agents did not log in for the full scheduled period, but it could also mean the utilization report is missing agents or not aligned with the schedule file.",
    });
  }

  reasons.push({
    title: "Hourly bucket distortion risk",
    detail:
      "Tableau hourly bucket logic may overstate AUX statuses. For example, if an agent goes on Break for only part of an hour and the break crosses into the next hour, Tableau may show the agent as being on Break for that full hour. This can distort Break, Available, Offline, and Phone utilization metrics.",
  });

  return reasons;
}

function getExecutiveExplanation(site) {
  if (!site) return "";

  if (!site.hasUtilization) {
    return `${site.callCenter} is not ready for final billable-hour analysis because schedule data is loaded but Tableau utilization data is not loaded for this site. This is not a vendor performance conclusion yet. The next step is to load the utilization report and validate that scheduled agents are present in Tableau.`;
  }

  return `${site.callCenter} is marked as ${site.status} because the billable-hours view is showing ${percent(
    site.phoneUtilization
  )} Phone Hours / Billable Hours during the available overlap period (${
    site.overlapDateRange
  }). The dashboard found ${hours(site.billableHours)} billable hours, ${hours(
    site.phoneHours
  )} phone hours, and ${hours(site.loggedHours)} logged/status hours. It also identified ${
    site.missingScheduledAgentCount
  } scheduled agent(s) that may be missing from Tableau and ${hours(
    site.unaccountedHours
  )} unaccounted hours. This should be treated as a data coverage and accuracy control issue before being treated as a vendor productivity conclusion.`;
}

function StatusExplanationModal({ site, onClose }) {
  if (!site) return null;

  const reasons = getRiskReasons(site);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-hpNavy/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-red-50 p-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-hpBlue">
              Enterprise Data Confidence Explanation
            </p>
            <h2 className="mt-1 text-2xl font-black text-hpNavy sm:text-3xl">
              Why {site.callCenter} is marked {site.status}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This explanation is written for leadership review, vendor accountability,
              Tableau coverage validation, and operational decision-making.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100"
            aria-label="Close explanation"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-3xl bg-gradient-to-br from-hpNavy via-slate-900 to-hpBlue p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Executive Summary
            </p>
            <p className="mt-3 text-sm leading-7 sm:text-base">
              {getExecutiveExplanation(site)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Billable Hours
              </p>
              <p className="mt-2 text-2xl font-black text-hpNavy">
                {hours(site.billableHours)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Denominator from schedule file
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Phone Hours
              </p>
              <p className="mt-2 text-2xl font-black text-hpNavy">
                {hours(site.phoneHours)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Numerator from On Call minutes
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-red-700">
                Phone Utilization
              </p>
              <p className="mt-2 text-2xl font-black text-red-800">
                {percent(site.phoneUtilization)}
              </p>
              <p className="mt-1 text-sm text-red-700">
                Phone Hours ÷ Billable Hours
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                Missing Agents
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800">
                {site.missingScheduledAgentCount}
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Scheduled but possibly not in Tableau
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                Unaccounted Hours
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800">
                {hours(site.unaccountedHours)}
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Billable minus logged/status hours
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <DatabaseZap className="mt-1 shrink-0 text-amber-700" />
              <div>
                <p className="font-black text-amber-900">
                  Data Accuracy Notice
                </p>
                <p className="mt-2 text-sm leading-7 text-amber-800">
                  This analysis is directional. Tableau hourly bucket logic may
                  overstate AUX statuses when an agent changes status inside the hour.
                  For example, if Break crosses into a new hour, the report may show
                  the agent as on Break for the full hour. Before making billing,
                  staffing, or vendor performance decisions, validate raw interval-level
                  status data and confirm all scheduled agents are present in Tableau.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Why this needs validation
            </p>

            <div className="mt-4 space-y-3">
              {reasons.map((reason) => (
                <div
                  key={reason.title}
                  className="rounded-2xl border border-red-100 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-1 shrink-0 text-red-700" />
                    <div>
                      <p className="font-black text-red-900">{reason.title}</p>
                      <p className="mt-1 text-sm leading-7 text-red-800">
                        {reason.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Data Confidence Controls
              </p>
              <h3 className="mt-1 text-xl font-black text-hpNavy">
                What must be validated before escalation
              </h3>

              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <p>
                  <span className="font-black text-hpNavy">1. Missing agents:</span>{" "}
                  Identify scheduled agents who do not appear in Tableau and send them
                  to the reporting owner to manually add or map them.
                </p>
                <p>
                  <span className="font-black text-hpNavy">2. Agent ID mapping:</span>{" "}
                  Confirm whether schedule IDs, HP IDs, EDS IDs, and agent names match
                  across files.
                </p>
                <p>
                  <span className="font-black text-hpNavy">3. Date overlap:</span>{" "}
                  Confirm only matching dates are included in the comparison.
                </p>
                <p>
                  <span className="font-black text-hpNavy">4. Hourly bucket logic:</span>{" "}
                  Validate whether Tableau is assigning a full hour to Break, Available,
                  Offline, or On Call when status changes inside the hour.
                </p>
                <p>
                  <span className="font-black text-hpNavy">5. Raw interval data:</span>{" "}
                  Request interval-level or status-duration data for final billing or
                  vendor accountability decisions.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Leadership Action
              </p>
              <h3 className="mt-1 text-xl font-black text-hpNavy">
                Recommended next step
              </h3>

              <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-700">
                <p>
                  Treat this as a data coverage and accuracy review first. Ask the
                  vendor and reporting owner to confirm missing agents, schedule coverage,
                  date alignment, and Tableau hourly bucket logic. Once the missing agents
                  are corrected and bucket behavior is understood, rerun the billable-hours
                  calculation.
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-hpNavy p-4 text-sm leading-7 text-white">
                <p className="font-black">Message to leadership:</p>
                <p className="mt-1">
                  The dashboard is identifying a risk signal, not a final conclusion.
                  The current result may be affected by missing Tableau agents and hourly
                  bucket distortion. We should validate the data first, then use the
                  corrected report for vendor performance or billing decisions.
                </p>
              </div>
            </div>
          </div>

          {!!site.missingScheduledAgents?.length && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Users className="mt-1 text-hpBlue" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                    Missing Agent Sample
                  </p>
                  <h3 className="text-xl font-black text-hpNavy">
                    Scheduled agents potentially missing from Tableau
                  </h3>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {site.missingScheduledAgents.slice(0, 30).map((agent) => (
                  <span
                    key={agent}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-100"
                  >
                    {agent}
                  </span>
                ))}
              </div>

              {site.missingScheduledAgents.length > 30 && (
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Showing first 30 of {site.missingScheduledAgents.length} missing agents.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-2xl bg-hpBlue px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-sky-500"
            >
              Close Explanation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillableHoursAnalysis({
  utilizationRows = [],
  scheduleReports = [],
}) {
  const [selectedStatusSite, setSelectedStatusSite] = useState(null);

  const analysis = calculateBillableAnalysis({
    utilizationRows,
    scheduleReports,
  });

  const { totals, siteRows } = analysis;
  const hasSchedules = scheduleReports.length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-green-700 via-hpNavy to-hpBlue p-5 text-white sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-green-100">
          Billable Hours Analysis
        </p>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          Phone Time / Billable Hours
        </h2>

        <p className="mt-2 max-w-5xl text-sm leading-7 text-green-50 sm:text-base">
          This section uses schedule files as the denominator and utilization reports
          as the numerator. The result is directional until missing Tableau agents,
          date coverage, and hourly bucket behavior are validated.
        </p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-7">
          <p>
            <span className="font-black">Equation: </span>
            Phone Utilization % = Phone Hours ÷ Billable Hours
          </p>
          <p>
            The dashboard only compares dates where both utilization and schedule data
            exist. Current schedule files are partial, so date overlap control is required.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <DatabaseZap className="mt-1 text-amber-700" />
          <div>
            <p className="font-black text-amber-900">
              Data Accuracy Notice
            </p>
            <p className="mt-1 text-sm leading-7 text-amber-800">
              This analysis is directional. Tableau hourly bucket logic may overstate
              AUX statuses when an agent changes status inside the hour. If Break,
              Available, Offline, or On Call crosses into another hour, Tableau may
              show that status for the full hour. Validate raw interval-level status data
              and missing agents before making billing, staffing, or vendor accountability
              decisions.
            </p>
          </div>
        </div>
      </div>

      {!hasSchedules && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 text-amber-700" />
            <div>
              <p className="font-black text-amber-900">
                Schedule files are required for billable hours.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Load the saved Buwelo and WNS schedules to calculate Phone Time /
                Billable Hours.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Billable Hours"
          value={hours(totals.billableHours)}
          detail="From schedule files"
          icon={Banknote}
          tone="green"
        />

        <MetricCard
          title="Phone Hours"
          value={hours(totals.phoneHours)}
          detail="On Call hours from utilization"
          icon={Headphones}
          tone="blue"
        />

        <MetricCard
          title="Phone Utilization"
          value={percent(totals.phoneUtilization)}
          detail="Phone Hours ÷ Billable Hours"
          icon={CheckCircle2}
          tone={
            totals.phoneUtilization < 35
              ? "red"
              : totals.phoneUtilization < 50
              ? "amber"
              : "green"
          }
        />

        <MetricCard
          title="Schedule Adherence"
          value={percent(totals.scheduleAdherence)}
          detail="Logged Hours ÷ Billable Hours"
          icon={Clock}
          tone={
            totals.scheduleAdherence < 70
              ? "red"
              : totals.scheduleAdherence < 90
              ? "amber"
              : "green"
          }
        />

        <MetricCard
          title="Missing Agents"
          value={totals.missingScheduledAgentCount || 0}
          detail="Scheduled but possibly not in Tableau"
          icon={Users}
          tone={totals.missingScheduledAgentCount > 0 ? "red" : "green"}
        />
      </section>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 text-hpBlue" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Date Overlap + Data Coverage Control
            </p>
            <h3 className="text-2xl font-black text-hpNavy">
              Using only comparable dates and flagging missing agents
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This protects the dashboard from comparing partial schedules, missing
              Tableau agents, and hourly bucket distortions as if they were final truth.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1450px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Call Center</th>
                <th className="px-4 py-3">Schedule Dates</th>
                <th className="px-4 py-3">Utilization Dates</th>
                <th className="px-4 py-3">Compared Dates</th>
                <th className="px-4 py-3">Schedule Agents</th>
                <th className="px-4 py-3">Util Agents</th>
                <th className="px-4 py-3">Matched</th>
                <th className="px-4 py-3">Missing</th>
                <th className="px-4 py-3">Match Rate</th>
                <th className="px-4 py-3">Billable Hours</th>
                <th className="px-4 py-3">Phone Hours</th>
                <th className="px-4 py-3">Phone Util %</th>
                <th className="px-4 py-3">Adherence %</th>
                <th className="px-4 py-3">Unaccounted</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {siteRows.length ? (
                siteRows.map((site) => (
                  <tr key={site.callCenter} className="hover:bg-sky-50">
                    <td className="px-4 py-3 font-black text-hpNavy">
                      {site.callCenter}
                    </td>

                    <td className="px-4 py-3">{site.scheduleDateRange}</td>
                    <td className="px-4 py-3">{site.utilizationDateRange}</td>
                    <td className="px-4 py-3 font-bold text-green-700">
                      {site.overlapDateRange}
                    </td>
                    <td className="px-4 py-3">{site.scheduleAgentCount}</td>
                    <td className="px-4 py-3">{site.utilizationAgentCount}</td>
                    <td className="px-4 py-3">{site.matchedAgentCount}</td>
                    <td className="px-4 py-3 font-black text-red-700">
                      {site.missingScheduledAgentCount}
                    </td>
                    <td className="px-4 py-3">{percent(site.matchRate)}</td>
                    <td className="px-4 py-3">{hours(site.billableHours)}</td>
                    <td className="px-4 py-3">{hours(site.phoneHours)}</td>
                    <td className="px-4 py-3 font-black">
                      {percent(site.phoneUtilization)}
                    </td>
                    <td className="px-4 py-3">
                      {percent(site.scheduleAdherence)}
                    </td>
                    <td className="px-4 py-3">
                      {hours(site.unaccountedHours)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedStatusSite(site)}
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 transition ${statusClass(
                          site.status
                        )}`}
                        title={`Click to explain ${site.callCenter} status`}
                      >
                        {site.status}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan="15">
                    No Buwelo or WNS schedule comparison available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
        <p className="font-black text-hpNavy">What to tell leadership</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          We now separate phone time from billable scheduled time, but we are also
          adding controls for data reliability. The dashboard flags missing Tableau
          agents, date overlap coverage, and hourly bucket distortion risk before any
          result is used as a vendor performance conclusion.
        </p>
      </div>

      <StatusExplanationModal
        site={selectedStatusSite}
        onClose={() => setSelectedStatusSite(null)}
      />
    </div>
  );
}