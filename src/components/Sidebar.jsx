// /src/components/Sidebar.jsx

import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  Gauge,
  Lightbulb,
  ShieldAlert,
  Table2,
  Users,
  X,
} from "lucide-react";

const items = [
  { label: "Leadership Brief", icon: BriefcaseBusiness },
  { label: "Billable Hours", icon: CalendarClock },
  { label: "Executive Summary", icon: ClipboardList },
  { label: "Site Comparison", icon: BarChart3 },
  { label: "Agent Utilization", icon: Users },
  { label: "AUX Breakdown", icon: Gauge },
  { label: "Red Flags", icon: ShieldAlert },
  { label: "Recommendations", icon: Lightbulb },
  { label: "Raw Data", icon: Table2 },
];

function SidebarContent({ activeSection, setActiveSection, onClose }) {
  return (
    <div className="h-full rounded-none border border-slate-100 bg-white p-4 shadow-executive lg:rounded-3xl">
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <p className="font-black text-hpNavy">Dashboard Menu</p>

        <button onClick={onClose} className="rounded-xl bg-slate-100 p-2">
          <X size={18} />
        </button>
      </div>

      <nav className="space-y-2">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => {
              setActiveSection(label);
              onClose?.();
              document
                .getElementById("active-section")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
              activeSection === label
                ? "bg-hpNavy text-white shadow-lg"
                : "text-slate-600 hover:bg-slate-100 hover:text-hpNavy"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-hpNavy to-hpBlue p-4 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-100">
          Manager Lens
        </p>

        <p className="mt-2 text-sm leading-6">
          Use billable hours as the denominator. Phone time alone is only the numerator.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-green-700">
          New Equation
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Phone Utilization = Phone Hours ÷ Billable Hours
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
      <aside className="no-print sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 lg:block">
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
            className="h-full w-[86vw] max-w-sm"
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