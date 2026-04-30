// /src/components/RedFlagsPanel.jsx
import { ShieldAlert } from 'lucide-react';
import { SEVERITY_STYLES } from '../data/kpiRules';

export default function RedFlagsPanel({ redFlags }) {
  if (!redFlags.length) return <div className="rounded-2xl bg-green-50 p-4 font-bold text-green-800">No red flags were detected from the current report set.</div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {redFlags.map((flag, index) => (
        <article key={`${flag.title}-${flag.site}-${index}`} className={`rounded-3xl border p-4 ${SEVERITY_STYLES[flag.severity] || SEVERITY_STYLES.Medium}`}>
          <div className="flex items-start gap-3">
            <ShieldAlert className="shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black">{flag.title}</h3>
                <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-black">{flag.site}</span>
                <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-black">{flag.severity}</span>
              </div>
              <p className="mt-2 text-sm leading-6"><strong>Meaning:</strong> {flag.meaning}</p>
              <p className="mt-1 text-sm leading-6"><strong>Action:</strong> {flag.action}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
