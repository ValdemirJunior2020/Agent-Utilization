// /src/components/RawDataTable.jsx
import { useMemo, useState } from 'react';
import { hours, percent } from '../utils/formatters';

export default function RawDataTable({ rows }) {
  const [search, setSearch] = useState('');
  const [site, setSite] = useState('All');
  const [date, setDate] = useState('');
  const sites = useMemo(() => Array.from(new Set(rows.map((row) => row.callCenter))).sort(), [rows]);
  const filtered = useMemo(() => rows
    .filter((row) => site === 'All' || row.callCenter === site)
    .filter((row) => !date || String(row.date).includes(date))
    .filter((row) => `${row.agent} ${row.callCenter} ${row.sourceFile}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 500), [rows, site, date, search]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search raw rows..." className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
        <select value={site} onChange={(event) => setSite(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold">
          <option>All</option>
          {sites.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={date} onChange={(event) => setDate(event.target.value)} placeholder="Filter date..." className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {['Site', 'Agent', 'Date', 'On Call', 'Available', 'Break', 'Offline', 'Logged', 'Utilization', 'Source File'].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.id} className="bg-white hover:bg-sky-50">
                <td className="px-4 py-3 font-bold text-hpNavy">{row.callCenter}</td>
                <td className="px-4 py-3">{row.agent}</td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{hours(row.onCallHours)}</td>
                <td className="px-4 py-3">{hours(row.availableHours)}</td>
                <td className="px-4 py-3">{hours(row.breakHours)}</td>
                <td className="px-4 py-3">{hours(row.offlineHours)}</td>
                <td className="px-4 py-3">{hours(row.loggedHours)}</td>
                <td className="px-4 py-3 font-bold">{percent(row.utilization)}</td>
                <td className="px-4 py-3 max-w-[220px] truncate">{row.sourceFile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-hpMuted">Showing {filtered.length} of {rows.length} normalized rows.</p>
    </div>
  );
}
