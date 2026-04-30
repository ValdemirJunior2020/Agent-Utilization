// /src/components/KpiCards.jsx

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  Clock,
  Headphones,
  Users,
} from "lucide-react";
import { hours, percent } from "../utils/formatters";

function Card({ title, value, detail, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-hpBlue",
    green: "bg-green-50 text-hpSuccess",
    amber: "bg-amber-50 text-hpWarning",
    red: "bg-red-50 text-hpDanger",
    navy: "bg-slate-100 text-hpNavy",
  };

  return (
    <div className="print-card rounded-3xl border border-slate-100 bg-white p-4 shadow-executive transition hover:-translate-y-1 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-hpMuted">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-black text-hpNavy sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-sm text-hpMuted">{detail}</p>
        </div>

        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function KpiCards({ totals, redFlags }) {
  const nonCallPaidHours =
    Number(totals.availableHours || 0) +
    Number(totals.breakHours || 0) +
    Number(totals.offlineHours || 0);

  const nonCallPaidPct =
    totals.loggedHours > 0 ? (nonCallPaidHours / totals.loggedHours) * 100 : 0;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:gap-5">
      <Card
        title="Report Period"
        value={totals.reportDateRange || "N/A"}
        detail={`${totals.reportDateCount || 0} detected day(s)`}
        icon={CalendarDays}
        tone="navy"
      />

      <Card
        title="Total Agents"
        value={totals.agentCount}
        detail={`${totals.callCenterCount} call center(s)`}
        icon={Users}
      />

      <Card
        title="Logged Hours"
        value={hours(totals.loggedHours)}
        detail={`${hours(totals.onCallHours)} on call`}
        icon={Clock}
        tone="green"
      />

      <Card
        title="Paid-Time Productivity"
        value={percent(totals.utilization)}
        detail="On Call ÷ Logged Time"
        icon={Headphones}
        tone={totals.utilization < 60 ? "red" : totals.utilization < 70 ? "amber" : "green"}
      />

      <Card
        title="Paid Time Not On Calls"
        value={hours(nonCallPaidHours)}
        detail={`${nonCallPaidPct.toFixed(1)}% Available / Break / Offline`}
        icon={Banknote}
        tone={nonCallPaidPct > 40 ? "red" : nonCallPaidPct > 30 ? "amber" : "green"}
      />

      <Card
        title="Operational Risks"
        value={redFlags.length}
        detail={`${redFlags.filter((flag) => flag.severity === "Critical").length} critical`}
        icon={AlertTriangle}
        tone={redFlags.some((flag) => flag.severity === "Critical") ? "red" : "amber"}
      />
    </section>
  );
}