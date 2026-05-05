// /src/components/OperationsIntelligence.jsx

import {
  AlertTriangle,
  BarChart3,
  Clock,
  Headphones,
  PhoneMissed,
  Radar,
  Users,
} from "lucide-react";
import { calculateOperationsInsights } from "../utils/operationsInsightsParser";

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

export default function OperationsIntelligence({
  operationsReports = [],
  operationsLoadMessage = "",
}) {
  const insights = calculateOperationsInsights(operationsReports);
  const { service, abandoned } = insights;

  const hasOperationsData = operationsReports.length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-hpNavy to-hpBlue p-5 text-white sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
          CEO Operations Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          Telus Agent Production + Abandoned Call Pressure
        </h2>

        <p className="mt-2 max-w-5xl text-sm leading-7 text-sky-50 sm:text-base">
          This view combines Telus service-agent production with abandoned-call volume
          by hour. It helps identify staffing pressure, queue gaps, and hours where
          guests are leaving the queue.
        </p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-7">
          <p>
            <span className="font-black">Telus Service Agents:</span> answered
            calls, outbound calls, agent IDs, and average talk time.
          </p>
          <p>
            <span className="font-black">Abandoned Calls by Hour:</span> abandoned
            call volume by date, weekday, and hour.
          </p>
        </div>
      </div>

      {operationsLoadMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 shrink-0 text-red-700" />
            <div>
              <p className="font-black text-red-900">
                Auto-loaded operations files
              </p>
              <p className="mt-1">{operationsLoadMessage}</p>
            </div>
          </div>
        </div>
      )}

      {!hasOperationsData && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <p className="font-black text-amber-900">
            Operations intelligence files are not loaded yet.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Add the files to public/operations-insights and restart the app.
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Telus Agents"
          value={number(service.agentCount)}
          detail={`Service report dates: ${service.dateRange}`}
          icon={Users}
          tone="blue"
        />

        <MetricCard
          title="Answered Calls"
          value={number(service.totalAnsweredCalls)}
          detail={`${number(service.totalServiceCalls)} service / ${number(
            service.totalOutboundCalls
          )} outbound`}
          icon={Headphones}
          tone="green"
        />

        <MetricCard
          title="Avg Talk Time"
          value={`${oneDecimal(service.weightedAvgTalkTime)} min`}
          detail="Weighted by answered calls"
          icon={Clock}
          tone="navy"
        />

        <MetricCard
          title="Abandoned Calls"
          value={number(abandoned.totalAbandonedCalls)}
          detail={`Abandoned report dates: ${abandoned.dateRange}`}
          icon={PhoneMissed}
          tone="red"
        />

        <MetricCard
          title="Peak Abandoned Hour"
          value={abandoned.peakHour ? hourLabel(abandoned.peakHour.hour) : "N/A"}
          detail={
            abandoned.peakHour
              ? `${number(abandoned.peakHour.abandonedCalls)} abandoned calls`
              : "No abandoned data"
          }
          icon={Radar}
          tone="amber"
        />
      </section>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 shrink-0 text-amber-700" />
          <div>
            <p className="font-black text-amber-900">
              Operations accuracy warning
            </p>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              Abandoned call volume tells us when guests are leaving the queue, but
              it does not prove abandonment rate unless we also have total offered calls
              by hour. The next best data request is: Offered Calls by Hour, Answered
              Calls by Hour, Abandoned Calls by Hour, Average Speed of Answer, and
              Staffing by Hour.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-1 text-hpBlue" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Abandoned Calls by Hour
              </p>
              <h3 className="text-2xl font-black text-hpNavy">
                Queue pressure by hour of day
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Use this to identify where staffing coverage may not match demand.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Hour</th>
                  <th className="px-4 py-3">Abandoned Calls</th>
                  <th className="px-4 py-3">Risk Signal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {abandoned.abandonedByHour
                  .filter((row) => row.abandonedCalls > 0)
                  .sort((a, b) => b.abandonedCalls - a.abandonedCalls)
                  .slice(0, 12)
                  .map((row) => {
                    const isPeak =
                      abandoned.peakHour &&
                      row.hour === abandoned.peakHour.hour;

                    return (
                      <tr key={row.hour} className="hover:bg-sky-50">
                        <td className="px-4 py-3 font-black text-hpNavy">
                          {hourLabel(row.hour)}
                        </td>
                        <td className="px-4 py-3">
                          {number(row.abandonedCalls)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              isPeak
                                ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                            }`}
                          >
                            {isPeak ? "Peak Risk Hour" : "Monitor Staffing"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <Users className="mt-1 text-hpBlue" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                Telus Service Agents
              </p>
              <h3 className="text-2xl font-black text-hpNavy">
                Top agents by handled calls
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Use this to validate production, coverage, and high-volume contributors.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Agent ID</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Answered</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Outbound</th>
                  <th className="px-4 py-3">Avg Talk</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {service.topServiceAgents.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-sky-50">
                    <td className="px-4 py-3 font-black text-hpNavy">
                      {agent.agentName}
                    </td>
                    <td className="px-4 py-3">{agent.agentId}</td>
                    <td className="px-4 py-3">{agent.agentGroup}</td>
                    <td className="px-4 py-3">
                      {number(agent.totalAnsweredCalls)}
                    </td>
                    <td className="px-4 py-3">
                      {number(agent.serviceAnsweredCalls)}
                    </td>
                    <td className="px-4 py-3">
                      {number(agent.outboundAnsweredCalls)}
                    </td>
                    <td className="px-4 py-3">
                      {oneDecimal(agent.avgTalkTime)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
        <p className="font-black text-hpNavy">What to tell leadership</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          We are adding queue-pressure intelligence. The abandoned-call file shows
          where guests are leaving the queue by hour, and the Telus service-agent file
          shows who is handling calls and their average talk time. The next data request
          should be total offered calls by hour and staffing by hour so we can calculate
          true abandonment rate and staffing gap, not only abandoned volume.
        </p>
      </div>
    </div>
  );
}