// /src/components/AgentDrilldown.jsx
import { useMemo, useState } from 'react';
import { exportCsv } from '../utils/exportUtils';
import { hours, percent } from '../utils/formatters';
import { STATUS_STYLES } from '../data/kpiRules';

export default function AgentDrilldown({ agentKPIs, siteKPIs, selectedSite, setSelectedSite }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => agentKPIs
    .filter((agent) => selectedSite === 'All' || agent.callCenter === selectedSite)
    .filter((agent) => agent.agent.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.utilization - b.utilization), [agentKPIs, selectedSite, search]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold">
          <option>All</option>
          {siteKPIs.map((site) => <option key={site.callCenter}>{site.callCenter}</option>)}
        </select>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search agent name..." className="rounded-xl border border-slate-200 px-3 py-3 text-sm md:col-span-1" />
        <button onClick={() => exportCsv('agent-detail.csv', filtered)} className="rounded-xl bg-hpNavy px-4 py-3 text-sm font-bold text-white no-print">Export Agent CSV</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {['Agent', 'Site', 'On Call', 'Available', 'Break', 'Offline', 'Logged', 'Utilization', 'Break %', 'Offline %', 'Status'].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((agent) => (
              <tr key={`${agent.callCenter}-${agent.agent}`} className={`hover:bg-sky-50 ${agent.status === 'Critical' ? 'bg-red-50/40' : agent.status === 'Needs Review' ? 'bg-amber-50/40' : 'bg-white'}`}>
                <td className="px-4 py-3 font-black text-hpNavy">{agent.agent}</td>
                <td className="px-4 py-3">{agent.callCenter}</td>
                <td className="px-4 py-3">{hours(agent.onCallHours)}</td>
                <td className="px-4 py-3">{hours(agent.availableHours)}</td>
                <td className="px-4 py-3">{hours(agent.breakHours)}</td>
                <td className="px-4 py-3">{hours(agent.offlineHours)}</td>
                <td className="px-4 py-3">{hours(agent.loggedHours)}</td>
                <td className="px-4 py-3 font-black">{percent(agent.utilization)}</td>
                <td className="px-4 py-3">{percent(agent.breakPct)}</td>
                <td className="px-4 py-3">{percent(agent.offlinePct)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${STATUS_STYLES[agent.status]}`}>{agent.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
