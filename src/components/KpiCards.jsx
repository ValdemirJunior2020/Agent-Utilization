// /src/components/KpiCards.jsx
import { AlertTriangle, Clock, Headphones, Users } from 'lucide-react';
import { hours, percent } from '../utils/formatters';

function Card({ title, value, detail, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-hpBlue',
    green: 'bg-green-50 text-hpSuccess',
    amber: 'bg-amber-50 text-hpWarning',
    red: 'bg-red-50 text-hpDanger',
  };
  return (
    <div className="print-card rounded-3xl bg-white p-4 sm:p-5 shadow-executive border border-slate-100 hover:-translate-y-1 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-hpMuted">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-hpNavy">{value}</p>
          <p className="mt-1 text-sm text-hpMuted">{detail}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon size={22} /></div>
      </div>
    </div>
  );
}

export default function KpiCards({ totals, redFlags }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
      <Card title="Total Agents" value={totals.agentCount} detail={`${totals.callCenterCount} call center(s)`} icon={Users} />
      <Card title="Logged Hours" value={hours(totals.loggedHours)} detail={`${hours(totals.onCallHours)} on call`} icon={Clock} tone="green" />
      <Card title="Utilization" value={percent(totals.utilization)} detail={`${percent(totals.availablePct)} available / idle`} icon={Headphones} tone={totals.utilization < 60 ? 'red' : totals.utilization < 70 ? 'amber' : 'green'} />
      <Card title="Operational Risks" value={redFlags.length} detail={`${redFlags.filter((flag) => flag.severity === 'Critical').length} critical`} icon={AlertTriangle} tone={redFlags.some((flag) => flag.severity === 'Critical') ? 'red' : 'amber'} />
    </section>
  );
}
