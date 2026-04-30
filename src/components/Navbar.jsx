// /src/components/Navbar.jsx

import { Download, Menu, RotateCcw } from "lucide-react";
import { trackEvent } from "../utils/tracking";

export default function Navbar({ onReset, onExport, onMenu }) {
  const handleExport = async () => {
    await trackEvent("export_summary_click");
    onExport?.();
  };

  const handleReset = async () => {
    await trackEvent("reset_dashboard_click");
    onReset?.();
  };

  const handleMenu = async () => {
    await trackEvent("mobile_menu_click");
    onMenu?.();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={handleMenu}
            className="rounded-xl bg-slate-100 p-2 text-hpNavy lg:hidden"
          >
            <Menu size={22} />
          </button>

          <img
            src="/logao.png"
            alt="HotelPlanner Operations View"
            className="h-12 w-auto object-contain sm:h-14"
          />

          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-hpNavy">
              Operations View
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Agent Utilization Command Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-hpBlue px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-sky-500"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export Summary</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}