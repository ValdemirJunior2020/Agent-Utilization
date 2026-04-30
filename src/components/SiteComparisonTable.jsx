// /src/components/SiteComparisonTable.jsx
import { useMemo, useState } from 'react';
import { exportCsv } from '../utils/exportUtils';
import { hours, percent } from '../utils/formatters';
import { STATUS_STYLES } from '../data/kpiRules';

export default function SiteComparisonTable({ siteKPIs, selectedSite, setSelectedSite }) {
  const [sortKey, setSortKey] = useState('utilization');
  const rows = useMemo(() => [...siteKPIs].sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0)), [siteKPIs, sortKey]);
  const csvRows = rows.map((site) => ({
    CallCenter: site.callCenter,
    Agents: site.agentCount,
    OnCallHours: site.onCallHours.toFixed(2),
    AvailableHours: site.availableHours.toFixed(2),
    BreakHours: site.breakHours.toFixed(2),
    OfflineHours: site.offlineHours.toFixed(2),
    LoggedHours: site.loggedHours.toFixed(2),
    Utilization: site.utilization.toFixed(2),
    OnCallPct: site.onCallPct.toFixed(2),
    BreakPct: site.breakPct.toFixed(2),
    OfflinePct: site.offlinePct.toFixed(2),
    Status: site.status,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="utilization">Sort by Utilization</option>
          <option value="breakPct">Sort by Break %</option>
          <option value="offlinePct">Sort by Offline %</option>
          <option value="availablePct">Sort by Available %</option>
          <option value="loggedHours">Sort by Logged Hours</option>
        </select>
        <button onClick={() => exportCsv('site-comparison.csv', csvRows)} className="rounded-xl bg-hpNavy px-4 py-2 text-sm font-bold text-white no-print">Export Site CSV</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {['Call Center', 'Agents', 'On Call', 'Available', 'Break', 'Offline', 'Logged', 'Utilization', 'On Call %', 'Break %', 'Offline %', 'Status'].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((site) => (
              <tr key={site.callCenter} onClick={() => setSelectedSite(site.callCenter)} className={`cursor-pointer hover:bg-sky-50 ${selectedSite === site.callCenter ? 'bg-sky-50' : 'bg-white'}`}>
                <td className="px-4 py-3 font-black text-hpNavy">{site.callCenter}</td>
                <td className="px-4 py-3">{site.agentCount}</td>
                <td className="px-4 py-3">{hours(site.onCallHours)}</td>
                <td className="px-4 py-3">{hours(site.availableHours)}</td>
                <td className="px-4 py-3">{hours(site.breakHours)}</td>
                <td className="px-4 py-3">{hours(site.offlineHours)}</td>
                <td className="px-4 py-3">{hours(site.loggedHours)}</td>
                <td className="px-4 py-3 font-black">{percent(site.utilization)}</td>
                <td className="px-4 py-3">{percent(site.onCallPct)}</td>
                <td className="px-4 py-3">{percent(site.breakPct)}</td>
                <td className="px-4 py-3">{percent(site.offlinePct)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${STATUS_STYLES[site.status]}`}>{site.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
