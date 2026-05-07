// /src/components/KpiCards.jsx

import {
  AlertTriangle,
  Clock3,
  Headphones,
  TimerOff,
  Users,
  UserCheck,
} from "lucide-react";

function number(value) {
  return Number(value || 0).toLocaleString();
}

function hours(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })}h`;
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getRosterAgentTotal(googleAgentCounts = []) {
  return googleAgentCounts.reduce((total, item) => {
    return total + Number(item.activeAgents || item.agents || 0);
  }, 0);
}

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}) {
  const tones = {
    blue: {
      icon: "bg-sky-50 text-hpBlue",
      border: "border-slate-100",
    },
    green: {
      icon: "bg-green-50 text-green-700",
      border: "border-green-100",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      border: "border-amber-100",
    },
    red: {
      icon: "bg-red-50 text-red-700",
      border: "border-red-100",
    },
    navy: {
      icon: "bg-slate-100 text-hpNavy",
      border: "border-slate-100",
    },
  };

  const style = tones[tone] || tones.blue;

  return (
    <div
      className={`rounded-3xl border ${style.border} bg-white p-4 shadow-sm sm:p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black leading-none text-hpNavy">
            {value}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {detail}
          </p>
        </div>

        <div className={`shrink-0 rounded-2xl p-3 ${style.icon}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export default function KpiCards({
  totals = {},
  redFlags = [],
  googleAgentCounts = [],
}) {
  const rosterAgentTotal = getRosterAgentTotal(googleAgentCounts);

  const utilizationAgentTotal = Number(totals.agentCount || 0);
  const callCenterCount = Number(totals.callCenterCount || 0);

  const loggedHours = Number(totals.loggedHours || 0);
  const onCallHours = Number(totals.onCallHours || totals.phoneHours || 0);
  const availableHours = Number(totals.availableHours || 0);
  const breakHours = Number(totals.breakHours || 0);
  const offlineHours = Number(totals.offlineHours || 0);

  const productivity =
    loggedHours > 0 ? (onCallHours / loggedHours) * 100 : 0;

  const paidTimeNotOnCalls = availableHours + breakHours + offlineHours;

  const criticalRisks = redFlags.filter((flag) => {
    const severity = String(flag.severity || flag.status || "").toLowerCase();
    return severity.includes("critical") || severity.includes("high");
  }).length;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <KpiCard
        title="Roster Agents"
        value={rosterAgentTotal ? number(rosterAgentTotal) : number(utilizationAgentTotal)}
        detail={
          rosterAgentTotal
            ? "From Google Sheet Agents_Master"
            : "Google Sheet roster not loaded"
        }
        icon={Users}
        tone={rosterAgentTotal ? "green" : "amber"}
      />

      <KpiCard
        title="Utilization Agents"
        value={number(utilizationAgentTotal)}
        detail={`${number(callCenterCount)} call center(s) in Tableau reports`}
        icon={UserCheck}
        tone="blue"
      />

      <KpiCard
        title="Logged Hours"
        value={hours(loggedHours)}
        detail={`${hours(onCallHours)} on call`}
        icon={Clock3}
        tone="green"
      />

      <KpiCard
        title="Paid-Time Productivity"
        value={percent(productivity)}
        detail="On Call ÷ Logged Time"
        icon={Headphones}
        tone={productivity >= 70 ? "green" : productivity >= 45 ? "amber" : "red"}
      />

      <KpiCard
        title="Paid Time Not On Calls"
        value={hours(paidTimeNotOnCalls)}
        detail="Available + Break + Offline"
        icon={TimerOff}
        tone={paidTimeNotOnCalls > onCallHours ? "red" : "amber"}
      />

      <KpiCard
        title="Operational Risks"
        value={number(redFlags.length)}
        detail={`${number(criticalRisks)} critical / high`}
        icon={AlertTriangle}
        tone={criticalRisks > 0 ? "red" : redFlags.length > 0 ? "amber" : "green"}
      />
    </section>
  );
}