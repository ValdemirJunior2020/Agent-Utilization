// /src/components/UsageStats.jsx

import { useEffect, useState } from "react";
import { Activity, BarChart3, Download, MousePointerClick, RefreshCw, UploadCloud } from "lucide-react";
import { getUsageStats, trackEvent } from "../utils/tracking";

function StatCard({ title, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-hpBlue",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    navy: "bg-slate-100 text-hpNavy",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-2xl font-black text-hpNavy">{value}</p>
        </div>

        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function UsageStats() {
  const [stats, setStats] = useState({
    visits: 0,
    clicks: 0,
    uploads: 0,
    exports: 0,
    totalEvents: 0,
    recentEvents: [],
  });

  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);

    try {
      const data = await getUsageStats();
      setStats(data);
    } catch (error) {
      console.warn("Usage stats failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const refresh = async () => {
    await trackEvent("usage_stats_refresh_click");
    await loadStats();
  };

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-executive sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
            Page Activity
          </p>
          <h2 className="text-xl font-black text-hpNavy sm:text-2xl">
            Visits, clicks, uploads, and exports
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Public usage tracking saved in Firebase Firestore.
          </p>
        </div>

        <button
          onClick={refresh}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-hpNavy px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Visits" value={stats.visits} icon={BarChart3} tone="blue" />
        <StatCard title="Clicks" value={stats.clicks} icon={MousePointerClick} tone="navy" />
        <StatCard title="Uploads" value={stats.uploads} icon={UploadCloud} tone="green" />
        <StatCard title="Exports" value={stats.exports} icon={Download} tone="amber" />
        <StatCard title="Total Events" value={stats.totalEvents} icon={Activity} tone="blue" />
      </div>
    </section>
  );
}