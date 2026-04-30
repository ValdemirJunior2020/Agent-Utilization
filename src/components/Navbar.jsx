// /src/components/Navbar.jsx
import { Download, Menu, RotateCcw } from 'lucide-react';

export default function Navbar({ onReset, onExport, onMenu }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-hpNavy text-white shadow-lg no-print">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenu} className="lg:hidden rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-hpBlue font-black shadow-lg shrink-0">HP</div>
          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-xl font-black tracking-tight">HotelPlanner Operations View</h1>
            <p className="hidden sm:block text-xs text-sky-100">Agent utilization, AUX behavior, and vendor productivity intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExport} className="inline-flex items-center gap-2 rounded-xl bg-hpBlue px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold hover:bg-sky-500 transition">
            <Download size={16} />
            <span className="hidden sm:inline">Export Summary</span>
          </button>
          <button onClick={onReset} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold hover:bg-white/20 transition">
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
