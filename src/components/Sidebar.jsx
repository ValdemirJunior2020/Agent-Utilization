// /src/components/Sidebar.jsx
import { BarChart3, ClipboardList, Gauge, Lightbulb, ShieldAlert, Table2, Users, X } from 'lucide-react';

const items = [
  { label: 'Executive Summary', icon: ClipboardList },
  { label: 'Site Comparison', icon: BarChart3 },
  { label: 'Agent Utilization', icon: Users },
  { label: 'AUX Breakdown', icon: Gauge },
  { label: 'Red Flags', icon: ShieldAlert },
  { label: 'Recommendations', icon: Lightbulb },
  { label: 'Raw Data', icon: Table2 },
];

function SidebarContent({ activeSection, setActiveSection, onClose }) {
  return (
    <div className="h-full rounded-none lg:rounded-3xl bg-white border border-slate-100 shadow-executive p-4">
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <p className="font-black text-hpNavy">Dashboard Menu</p>
        <button onClick={onClose} className="rounded-xl bg-slate-100 p-2"><X size={18} /></button>
      </div>
      <nav className="space-y-2">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => {
              setActiveSection(label);
              onClose?.();
              document.getElementById('active-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${activeSection === label ? 'bg-hpNavy text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100 hover:text-hpNavy'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-hpNavy to-hpBlue p-4 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-100">Manager Lens</p>
        <p className="mt-2 text-sm leading-6">Review utilization by paid-time productivity, not just activity. High AUX exposure can hide staffing and adherence problems.</p>
      </div>
    </div>
  );
}

export default function Sidebar({ activeSection, setActiveSection, mobileSidebarOpen, setMobileSidebarOpen }) {
  return (
    <>
      <aside className="hidden lg:block sticky top-24 h-[calc(100vh-7rem)] w-72 shrink-0 no-print">
        <SidebarContent activeSection={activeSection} setActiveSection={setActiveSection} />
      </aside>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-hpNavy/50 backdrop-blur-sm lg:hidden no-print" onClick={() => setMobileSidebarOpen(false)}>
          <div className="h-full w-[86vw] max-w-sm" onClick={(event) => event.stopPropagation()}>
            <SidebarContent activeSection={activeSection} setActiveSection={setActiveSection} onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
