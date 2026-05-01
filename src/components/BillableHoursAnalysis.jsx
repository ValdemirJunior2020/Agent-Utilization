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
} from "lucide-react";
import { calculateBillableAnalysis } from "../utils/billableHoursEngine";
import { hours } from "../utils/formatters";

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function statusClass(status) {
  if (status === "Healthy") return "bg-green-50 text-green-700 ring-green-100 hover:bg-green-100";
  if (status === "Needs Review") return "bg-amber-50 text-amber-700 ring-amber-100 hover:bg-amber-100";
  if (status === "Critical") return "bg-red-50 text-red-700 ring-red-100 hover:bg-red-100";
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

function getCriticalReasons(site) {
  const reasons = [];

  if (site.overlapDateCount <= 0) {
    reasons.push({
      title: "No valid date overlap",
      detail:
        "This site has schedule data and utilization data, but the system cannot find enough matching dates between both files. Without overlap, the billable-hours equation cannot be trusted for leadership action.",
    });
  }

  if (site.phoneUtilization < 35) {
    reasons.push({
      title: "Low phone-time conversion",
      detail:
        "Phone utilization is below the critical threshold of 35%. This means a low percentage of scheduled billable hours is converting into actual customer phone time. For a large-scale operation, this can indicate overstaffing, low call volume, schedule mismatch, missing agent mapping, or status/login behavior that needs vendor explanation.",
    });
  }

  if (site.scheduleAdherence < 70) {
    reasons.push({
      title: "Low schedule adherence against billable hours",
      detail:
        "Logged/status time is far below scheduled billable hours. This can indicate that scheduled hours are not fully represented in the utilization file, agents did not log in for the full scheduled period, or the schedule and utilization reports are not aligned by date, timezone, or agent identity.",
    });
  }

  if (site.unaccountedHours > 0) {
    reasons.push({
      title: "Large unaccounted billable hours",
      detail:
        "Billable scheduled hours are higher than the logged/status hours found in the utilization report. This gap represents time that must be explained before the company can make staffing, billing, or vendor performance decisions.",
    });
  }

  if (site.scheduleAgentCount !== site.utilizationAgentCount) {
    reasons.push({
      title: "Agent count mismatch",
      detail:
        "The schedule file and utilization file do not have the same number of agents. This may be normal if the schedule covers a different population, but it must be validated because it can distort billable-hour utilization and vendor comparisons.",
    });
  }

  return reasons;
}

function getExecutiveExplanation(site) {
  if (!site) return "";

  return `${site.callCenter} is marked Critical because the billable-hours view is showing that only ${percent(
    site.phoneUtilization
  )} of scheduled billable hours converted into phone time during the available overlap period (${site.overlapDateRange}). The dashboard found ${hours(
    site.billableHours
  )} billable hours, but only ${hours(
    site.phoneHours
  )} phone hours and ${hours(
    site.loggedHours
  )} logged/status hours. This leaves ${hours(
    site.unaccountedHours
  )} unaccounted hours. For an enterprise operation, this should not be treated as an agent-blame result. It should be treated as a controlled operational risk that requires validation of schedule coverage, timezone alignment, agent mapping, Tableau status mapping, and vendor staffing behavior.`;
}

function StatusExplanationModal({ site, onClose }) {
  if (!site) return null;

  const reasons = getCriticalReasons(site);
  const isCritical = site.status === "Critical";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-hpNavy/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div
          className={`sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 ${
            isCritical ? "bg-red-50" : "bg-slate-50"
          }`}
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-hpBlue">
              Enterprise Risk Explanation
            </p>
            <h2 className="mt-1 text-2xl font-black text-hpNavy sm:text-3xl">
              Why {site.callCenter} is marked {site.status}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This explanation is written for leadership review, vendor accountability,
              and operational decision-making.
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Why this is operationally critical
            </p>

            <div className="mt-4 space-y-3">
              {reasons.length ? (
                reasons.map((reason) => (
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
                ))
              ) : (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="font-black text-green-900">
                    No critical rule triggered.
                  </p>
                  <p className="mt-1 text-sm leading-7 text-green-800">
                    This site is not currently triggering the critical risk thresholds.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Data Control Check
              </p>
              <h3 className="mt-1 text-xl font-black text-hpNavy">
                What must be validated before escalation
              </h3>

              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <p>
                  <span className="font-black text-hpNavy">1. Schedule coverage:</span>{" "}
                  Confirm the schedule file covers the same operational dates as the
                  utilization report.
                </p>
                <p>
                  <span className="font-black text-hpNavy">2. Timezone alignment:</span>{" "}
                  Confirm that schedule dates and utilization dates are aligned to the
                  correct business timezone.
                </p>
                <p>
                  <span className="font-black text-hpNavy">3. Agent mapping:</span>{" "}
                  Confirm schedule agent IDs/names match the utilization agent IDs/names.
                </p>
                <p>
                  <span className="font-black text-hpNavy">4. Status mapping:</span>{" "}
                  Confirm On Call, Available, Break, and Offline statuses are mapped
                  correctly from Tableau.
                </p>
                <p>
                  <span className="font-black text-hpNavy">5. Vendor explanation:</span>{" "}
                  Ask the vendor to explain any billable hours that are not converting
                  into logged or phone time.
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
                  Request a vendor response explaining the difference between scheduled
                  billable hours, logged/status hours, and On Call hours for the overlap
                  period. The vendor should provide staffing interval detail, agent-level
                  exceptions, schedule adherence results, and confirmation of whether any
                  agents were scheduled but not active in the utilization platform.
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-hpNavy p-4 text-sm leading-7 text-white">
                <p className="font-black">Message to leadership:</p>
                <p className="mt-1">
                  This is critical because the company may be paying for scheduled labor
                  that is not fully converting into customer handling time. Before making
                  a financial or staffing decision, we need to validate whether this is a
                  true productivity issue, a schedule coverage issue, or a data alignment
                  issue.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Business Meaning</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-black text-hpNavy">
                    Compared Dates
                  </td>
                  <td className="px-4 py-3">{site.overlapDateRange}</td>
                  <td className="px-4 py-3">
                    Only dates available in both files are being compared.
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-black text-hpNavy">
                    Schedule Agents
                  </td>
                  <td className="px-4 py-3">{site.scheduleAgentCount}</td>
                  <td className="px-4 py-3">
                    Agents found in the schedule denominator.
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-black text-hpNavy">
                    Utilization Agents
                  </td>
                  <td className="px-4 py-3">{site.utilizationAgentCount}</td>
                  <td className="px-4 py-3">
                    Agents found in the utilization numerator/status file.
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-black text-hpNavy">
                    Schedule Adherence
                  </td>
                  <td className="px-4 py-3">{percent(site.scheduleAdherence)}</td>
                  <td className="px-4 py-3">
                    Logged/status hours divided by scheduled billable hours.
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-black text-hpNavy">
                    Unaccounted Hours
                  </td>
                  <td className="px-4 py-3">{hours(site.unaccountedHours)}</td>
                  <td className="px-4 py-3">
                    Scheduled billable time not explained by utilization statuses.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
          This section uses the schedule files as the denominator. It compares
          actual phone hours from the utilization reports against scheduled
          billable hours from Buwelo and WNS schedules.
        </p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-7">
          <p>
            <span className="font-black">Equation: </span>
            Phone Utilization % = Phone Hours ÷ Billable Hours
          </p>
          <p>
            The dashboard only compares dates where both utilization and
            schedule data exist. For April, Buwelo starts on Apr 26 and WNS
            starts on Apr 27.
          </p>
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
                Upload the Buwelo Partner_Voice schedule and WNS schedule to
                calculate Phone Time / Billable Hours.
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
          title="Unaccounted Hours"
          value={hours(totals.unaccountedHours)}
          detail="Billable minus logged/status time"
          icon={ShieldAlert}
          tone={totals.unaccountedHours > 0 ? "amber" : "green"}
        />
      </section>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 text-hpBlue" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Date Overlap Control
            </p>
            <h3 className="text-2xl font-black text-hpNavy">
              Using only the dates available in both files
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This protects the dashboard from comparing a full-month
              utilization report against a partial-month schedule.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Call Center</th>
                <th className="px-4 py-3">Schedule Dates</th>
                <th className="px-4 py-3">Utilization Dates</th>
                <th className="px-4 py-3">Compared Dates</th>
                <th className="px-4 py-3">Schedule Agents</th>
                <th className="px-4 py-3">Util Agents</th>
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
                        title={`Click to explain why ${site.callCenter} is ${site.status}`}
                      >
                        {site.status}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan="12">
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
          We now separate phone time from billable scheduled time. The
          utilization files provide phone minutes. The schedule files provide
          the billable-hour denominator. For now, Buwelo and WNS are calculated
          only on the dates where both reports overlap, so the comparison is
          controlled and fair.
        </p>
      </div>

      <StatusExplanationModal
        site={selectedStatusSite}
        onClose={() => setSelectedStatusSite(null)}
      />
    </div>
  );
}