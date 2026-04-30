// /src/components/Charts/ChartCard.jsx
export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="print-card rounded-3xl bg-white p-4 sm:p-5 shadow-executive border border-slate-100 min-h-[340px]">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-hpBlue">Analytics</p>
        <h3 className="text-lg sm:text-xl font-black text-hpNavy">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-hpMuted">{subtitle}</p>}
      </div>
      <div className="h-[260px] w-full">{children}</div>
    </div>
  );
}
