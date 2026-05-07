// /src/components/Sidebar.jsx

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  Gauge,
  Lightbulb,
  Scale,
  ShieldAlert,
  Table2,
  Users,
  X,
} from "lucide-react";

const items = [
  { label: "Leadership Brief", icon: BriefcaseBusiness, accent: "from-blue-500 to-cyan-500" },
  { label: "Billable Hours", icon: CalendarClock, accent: "from-emerald-500 to-green-500" },
  { label: "Agent Balance & Queue Risk", icon: Scale, accent: "from-rose-500 to-red-500" },
  { label: "Operations Intelligence", icon: Activity, accent: "from-violet-500 to-purple-500" },
  { label: "Executive Summary", icon: ClipboardList, accent: "from-indigo-500 to-blue-500" },
  { label: "Site Comparison", icon: BarChart3, accent: "from-sky-500 to-cyan-500" },
  { label: "Agent Utilization", icon: Users, accent: "from-orange-500 to-amber-500" },
  { label: "AUX Breakdown", icon: Gauge, accent: "from-pink-500 to-rose-500" },
  { label: "Red Flags", icon: ShieldAlert, accent: "from-red-500 to-orange-500" },
  { label: "Recommendations", icon: Lightbulb, accent: "from-yellow-500 to-amber-500" },
  { label: "Raw Data", icon: Table2, accent: "from-slate-500 to-slate-700" },
];

function SidebarContent({ activeSection, setActiveSection, onClose }) {
  return (
    <div className="h-full rounded-none border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-sky-50 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.12)] lg:rounded-3xl">
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <p className="font-black text-hpNavy">Dashboard Menu</p>

        <button
          onClick={onClose}
          className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-4 rounded-2xl bg-gradient-to-r from-hpNavy via-sky-700 to-hpBlue p-4 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-100">
          Navigation
        </p>
        <h3 className="mt-1 text-lg font-black">Operations View</h3>
        <p className="mt-2 text-sm leading-6 text-sky-50">
          Stronger visibility for leadership, utilization, balance, and queue risk.
        </p>
      </div>

      <nav className="space-y-2">
        {items.map(({ label, icon: Icon, accent }) => {
          const isActive = activeSection === label;

          return (
            <button
              key={label}
              onClick={() => {
                setActiveSection(label);
                onClose?.();
                document
                  .getElementById("active-section")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition-all duration-200 ${
                isActive
                  ? "bg-hpNavy text-white shadow-xl ring-2 ring-sky-200"
                  : "bg-white/85 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:-translate-y-[1px] hover:bg-white hover:text-hpNavy hover:shadow-md"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${accent} ${
                  isActive ? "text-white shadow-md" : "text-white opacity-95"
                }`}
              >
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate">{label}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 p-4 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-100">
          Manager Lens
        </p>
        <p className="mt-2 text-sm leading-6">
          Review billable hours, agent balance, mapping coverage, and abandoned-call
          pressure together.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
          New Control
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Available is only a red flag when it is excessive or when queue pressure exists.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-amber-700">
          Visibility Upgrade
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Use the colored menu to switch faster between Balance Risk, Utilization, AUX,
          and Executive Summary.
        </p>
      </div>
    </div>
  );
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  return (
    <>
      <aside className="no-print sticky top-24 hidden h-[calc(100vh-7rem)] w-80 shrink-0 lg:block">
        <SidebarContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </aside>

      {mobileSidebarOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-hpNavy/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="h-full w-[88vw] max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <SidebarContent
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}