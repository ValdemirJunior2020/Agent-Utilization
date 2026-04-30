// /src/components/AuxBreakdown.jsx
import { hours, percent } from '../utils/formatters';

export default function AuxBreakdown({ siteKPIs }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {siteKPIs.map((site) => (
        <div key={site.callCenter} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-hpMuted">AUX Breakdown</p>
              <h3 className="text-xl font-black text-hpNavy">{site.callCenter}</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-hpBlue">{site.status}</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['On Call', site.onCallPct, site.onCallHours, 'bg-hpBlue'],
              ['Available', site.availablePct, site.availableHours, 'bg-hpSky'],
              ['Break', site.breakPct, site.breakHours, 'bg-hpWarning'],
              ['Offline', site.offlinePct, site.offlineHours, 'bg-hpDanger'],
            ].map(([label, pct, value, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm font-bold text-slate-700"><span>{label}</span><span>{percent(pct)} · {hours(value)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-white"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
