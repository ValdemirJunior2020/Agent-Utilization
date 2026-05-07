// /src/components/AgentBalanceQueueRisk.jsx

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  DatabaseZap,
  Headphones,
  PhoneMissed,
  Search,
  ShieldAlert,
  TimerOff,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { calculateAgentBalanceQueueRisk } from "../utils/agentBalanceEngine";
import { hours } from "../utils/formatters";

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function oneDecimal(value) {
  return Number(value || 0).toFixed(1);
}

function hourLabel(hour) {
  const value = Number(hour || 0);
  const suffix = value >= 12 ? "PM" : "AM";
  const display = value % 12 === 0 ? 12 : value % 12;
  return `${display}:00 ${suffix}`;
}

function riskBadgeClass(level) {
  if (level === "Critical") return "bg-red-50 text-red-700 ring-red-100";
  if (level === "High Risk") return "bg-orange-50 text-orange-700 ring-orange-100";
  if (level === "Needs Review") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-green-50 text-green-700 ring-green-100";
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

function AgentRiskModal({ agent, onClose }) {
  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-hpNavy/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-red-50 p-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-700">
              Agent Balance Risk Explanation
            </p>
            <h2 className="mt-1 text-2xl font-black text-hpNavy sm:text-3xl">
              {agent.agent}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This explains why the agent was flagged for Break, Available, Offline,
              On Call, abandoned-call pressure, or mapping risk.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-3xl bg-gradient-to-br from-hpNavy via-slate-900 to-hpBlue p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
              Executive Explanation
            </p>
            <p className="mt-3 text-sm leading-7 sm:text-base">
              {agent.agent} is marked as {agent.riskLevel} because the agent balance
              score is {agent.riskScore}/100. The current view shows {hours(agent.onCallHours)}
              on call, {hours(agent.availableHours)} available, {hours(agent.breakHours)}
              on break, and {hours(agent.offlineHours)} offline across {agent.dateCount}
              reporting date(s). This is a coaching and data-validation signal, not a
              final disciplinary conclusion.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Risk Score"
              value={`${agent.riskScore}/100`}
              detail={agent.riskLevel}
              icon={ShieldAlert}
              tone={agent.riskScore >= 55 ? "red" : "green"}
            />

            <MetricCard
              title="On Call"
              value={hours(agent.onCallHours)}
              detail={percent(agent.phonePct)}
              icon={Headphones}
              tone="green"
            />

            <MetricCard
              title="Available"
              value={hours(agent.availableHours)}
              detail={percent(agent.availablePct)}
              icon={UserCheck}
              tone={agent.availablePct >= 35 ? "red" : "blue"}
            />

            <MetricCard
              title="Break"
              value={hours(agent.breakHours)}
              detail={percent(agent.breakPct)}
              icon={Clock}
              tone={agent.breakPct >= 20 ? "red" : "amber"}
            />

            <MetricCard
              title="Offline"
              value={hours(agent.offlineHours)}
              detail={percent(agent.offlinePct)}
              icon={TimerOff}
              tone={agent.offlinePct >= 15 ? "red" : "navy"}
            />
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
            <p className="font-black text-red-900">Why this agent was flagged</p>

            <div className="mt-3 space-y-3">
              {agent.riskReasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-2xl bg-white p-4 text-sm leading-7 text-red-800"
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <p className="font-black text-amber-900">Leadership-safe note</p>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              Available time is not automatically bad. It becomes a stronger risk when
              abandoned calls exist during the same period or when On Call time is low.
              Break and Offline flags should also be validated against schedule rules,
              exceptions, coaching notes, and Tableau hourly-bucket behavior.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-2xl bg-hpBlue px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-sky-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentBalanceQueueRisk({
  utilizationRows = [],
  operationsReports = [],
}) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  const analysis = useMemo(
    () =>
      calculateAgentBalanceQueueRisk({
        utilizationRows,
        operationsReports,
      }),
    [utilizationRows, operationsReports]
  );

  const { totals, agentRows, hourlyPressure } = analysis;

  const filteredAgents = agentRows.filter((agent) => {
    const matchesSearch =
      !search ||
      agent.agent.toLowerCase().includes(search.toLowerCase()) ||
      agent.callCenter.toLowerCase().includes(search.toLowerCase()) ||
      String(agent.agentHpId || "").toLowerCase().includes(search.toLowerCase());

    const matchesRisk = riskFilter === "All" || agent.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-red-700 via-hpNavy to-slate-950 p-5 text-white sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-100">
          Agent Balance & Queue Risk
        </p>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          Break + Available + Offline + Abandoned Call Pressure
        </h2>

        <p className="mt-2 max-w-5xl text-sm leading-7 text-red-50 sm:text-base">
          This section identifies agents with too much Break time, too much Available
          time, too much Offline time, low On Call time, and possible queue/routing risk
          when abandoned calls exist.
        </p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-7">
          <p>
            <span className="font-black">Important:</span> Available time is not
            automatically bad. Available becomes a stronger red flag when abandoned calls
            are happening, because it may indicate routing, skill assignment, queue setup,
            or Tableau bucket issues.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <DatabaseZap className="mt-1 shrink-0 text-amber-700" />
          <div>
            <p className="font-black text-amber-900">Data confidence warning</p>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              This is a risk signal, not a final conclusion. Tableau hourly bucket logic
              may overstate statuses when an agent changes status inside the hour. For
              final decisions, validate raw interval-level status data, schedule exceptions,
              and routing/skill setup.
            </p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Agents Reviewed"
          value={number(totals.agentCount)}
          detail={totals.callCenters.join(", ") || "All call centers"}
          icon={Users}
          tone="blue"
        />

        <MetricCard
          title="Critical / High"
          value={number(totals.criticalCount + totals.highRiskCount)}
          detail={`${number(totals.criticalCount)} critical / ${number(
            totals.highRiskCount
          )} high`}
          icon={ShieldAlert}
          tone="red"
        />

        <MetricCard
          title="Available Hours"
          value={hours(totals.totalAvailableHours)}
          detail="Potential idle/routing signal"
          icon={UserCheck}
          tone="amber"
        />

        <MetricCard
          title="Break Hours"
          value={hours(totals.totalBreakHours)}
          detail="Break balance review"
          icon={Clock}
          tone="amber"
        />

        <MetricCard
          title="Abandoned Calls"
          value={number(totals.totalAbandonedCalls)}
          detail="Queue pressure signal"
          icon={PhoneMissed}
          tone="red"
        />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Agent Risk Table
              </p>
              <h3 className="text-2xl font-black text-hpNavy">
                Who needs balance review?
              </h3>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search agent..."
                  className="min-h-11 rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-hpBlue"
                />
              </div>

              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-hpBlue"
              >
                <option>All</option>
                <option>Critical</option>
                <option>High Risk</option>
                <option>Needs Review</option>
                <option>Healthy</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Call Center</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">On Call</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Break</th>
                  <th className="px-4 py-3">Offline</th>
                  <th className="px-4 py-3">Phone %</th>
                  <th className="px-4 py-3">Available %</th>
                  <th className="px-4 py-3">Break %</th>
                  <th className="px-4 py-3">Abandoned on Dates</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAgents.slice(0, 80).map((agent) => (
                  <tr
                    key={`${agent.callCenter}-${agent.agent}-${agent.agentHpId}`}
                    className="hover:bg-sky-50"
                  >
                    <td className="px-4 py-3 font-black text-hpNavy">
                      {agent.agent}
                      {!agent.agentMapped && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                          Unmapped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{agent.callCenter}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${riskBadgeClass(
                          agent.riskLevel
                        )}`}
                      >
                        {agent.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">{hours(agent.onCallHours)}</td>
                    <td className="px-4 py-3">{hours(agent.availableHours)}</td>
                    <td className="px-4 py-3">{hours(agent.breakHours)}</td>
                    <td className="px-4 py-3">{hours(agent.offlineHours)}</td>
                    <td className="px-4 py-3">{percent(agent.phonePct)}</td>
                    <td className="px-4 py-3">{percent(agent.availablePct)}</td>
                    <td className="px-4 py-3">{percent(agent.breakPct)}</td>
                    <td className="px-4 py-3">
                      {number(agent.abandonedCallsDuringAgentDates)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedAgent(agent)}
                        className="rounded-2xl bg-hpBlue px-3 py-2 text-xs font-black text-white hover:bg-sky-500"
                      >
                        Explain
                      </button>
                    </td>
                  </tr>
                ))}

                {!filteredAgents.length && (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan="12">
                      No agents match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
            Peak Abandoned Hours
          </p>
          <h3 className="text-2xl font-black text-hpNavy">
            Queue pressure window
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Use these hours to check if staffing and routing match demand.
          </p>

          <div className="mt-5 space-y-3">
            {hourlyPressure.slice(0, 10).map((row, index) => (
              <div
                key={row.hour}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-hpNavy">
                    #{index + 1} · {hourLabel(row.hour)}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      index === 0
                        ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                    }`}
                  >
                    {number(row.abandonedCalls)} abandoned
                  </span>
                </div>
              </div>
            ))}

            {!hourlyPressure.length && (
              <p className="text-sm text-slate-500">
                No abandoned-call pressure data loaded.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
        <p className="font-black text-hpNavy">What to tell leadership</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          We are now reviewing agent balance, not just total utilization. The tool
          identifies agents with excessive Break, Available, or Offline time, and it
          compares those signals against abandoned-call pressure. This helps separate
          agent behavior, routing issues, staffing gaps, and data-quality problems.
        </p>
      </div>

      <AgentRiskModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}