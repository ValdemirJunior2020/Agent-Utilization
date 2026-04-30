// /src/App.jsx
import { useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import UploadPanel from './components/UploadPanel';
import ExecutiveSummary from './components/ExecutiveSummary';
import KpiCards from './components/KpiCards';
import SiteComparisonTable from './components/SiteComparisonTable';
import AgentDrilldown from './components/AgentDrilldown';
import AuxBreakdown from './components/AuxBreakdown';
import RedFlagsPanel from './components/RedFlagsPanel';
import RecommendationsPanel from './components/RecommendationsPanel';
import RawDataTable from './components/RawDataTable';
import UtilizationBarChart from './components/Charts/UtilizationBarChart';
import StatusStackedChart from './components/Charts/StatusStackedChart';
import DailyTrendChart from './components/Charts/DailyTrendChart';
import AgentRankingChart from './components/Charts/AgentRankingChart';
import { calculateDashboard } from './utils/calculateKPIs';
import { buildExecutiveSummary, buildRecommendations, buildRedFlags } from './utils/recommendationEngine';
import { mockRows } from './data/mockData';
import { exportSummaryPdf } from './utils/exportUtils';

export default function App() {
  const [rows, setRows] = useState(mockRows);
  const [history, setHistory] = useState([]);
  const [selectedSite, setSelectedSite] = useState('All');
  const [activeSection, setActiveSection] = useState('Executive Summary');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [usingMock, setUsingMock] = useState(true);

  const dashboard = useMemo(() => calculateDashboard(rows), [rows]);
  const redFlags = useMemo(() => buildRedFlags(dashboard.siteKPIs, dashboard.agentKPIs), [dashboard.siteKPIs, dashboard.agentKPIs]);
  const recommendations = useMemo(() => buildRecommendations(dashboard.siteKPIs, redFlags), [dashboard.siteKPIs, redFlags]);
  const summary = useMemo(() => buildExecutiveSummary(dashboard.siteKPIs, dashboard.totals, redFlags), [dashboard.siteKPIs, dashboard.totals, redFlags]);

  const handleUploadComplete = (reports) => {
    const parsedRows = reports.flatMap((report) => report.rows);
    setRows(parsedRows.length ? parsedRows : mockRows);
    setHistory(reports.map(({ rows: _, ...report }) => report));
    setSelectedSite('All');
    setUsingMock(false);
  };

  const resetDashboard = () => {
    setRows(mockRows);
    setHistory([]);
    setSelectedSite('All');
    setUsingMock(true);
  };

  const exportPdf = () => exportSummaryPdf({ summary, totals: dashboard.totals, siteKPIs: dashboard.siteKPIs, redFlags, recommendations });

  const sections = {
    'Executive Summary': <ExecutiveSummary summary={summary} siteKPIs={dashboard.siteKPIs} redFlags={redFlags} usingMock={usingMock} />,
    'Site Comparison': <SiteComparisonTable siteKPIs={dashboard.siteKPIs} selectedSite={selectedSite} setSelectedSite={setSelectedSite} />,
    'Agent Utilization': <AgentDrilldown agentKPIs={dashboard.agentKPIs} siteKPIs={dashboard.siteKPIs} selectedSite={selectedSite} setSelectedSite={setSelectedSite} />,
    'AUX Breakdown': <AuxBreakdown siteKPIs={dashboard.siteKPIs} />,
    'Red Flags': <RedFlagsPanel redFlags={redFlags} />,
    Recommendations: <RecommendationsPanel recommendations={recommendations} />,
    'Raw Data': <RawDataTable rows={rows} />,
  };

  return (
    <div className="min-h-screen bg-hpBg text-slate-900">
      <Navbar
        onReset={resetDashboard}
        onExport={exportPdf}
        onMenu={() => setMobileSidebarOpen(true)}
      />
      <div className="mx-auto flex w-full max-w-[1800px] gap-0 lg:gap-6 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
        <main className="w-full min-w-0 space-y-5 lg:space-y-6">
          <UploadPanel onUploadComplete={handleUploadComplete} history={history} />
          <KpiCards totals={dashboard.totals} redFlags={redFlags} />
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
            <UtilizationBarChart siteKPIs={dashboard.siteKPIs} />
            <StatusStackedChart siteKPIs={dashboard.siteKPIs} />
            <DailyTrendChart dailyTrend={dashboard.dailyTrend} siteKPIs={dashboard.siteKPIs} />
            <AgentRankingChart agentKPIs={dashboard.agentKPIs} />
          </section>
          <section id="active-section" className="print-card rounded-3xl bg-white shadow-executive border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-hpBlue">Operations workspace</p>
                <h2 className="text-xl sm:text-2xl font-black text-hpNavy">{activeSection}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(sections).map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`rounded-full px-3 py-2 text-xs sm:text-sm font-bold transition ${activeSection === section ? 'bg-hpBlue text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6">{sections[activeSection]}</div>
          </section>
        </main>
      </div>
    </div>
  );
}
