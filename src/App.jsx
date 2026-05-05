// /src/App.jsx

import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import UploadPanel from "./components/UploadPanel";
import ScheduleUploadPanel from "./components/ScheduleUploadPanel";
import UsageStats from "./components/UsageStats";
import LeadershipBrief from "./components/LeadershipBrief";
import BillableHoursAnalysis from "./components/BillableHoursAnalysis";
import OperationsIntelligence from "./components/OperationsIntelligence";
import ExecutiveSummary from "./components/ExecutiveSummary";
import KpiCards from "./components/KpiCards";
import SiteComparisonTable from "./components/SiteComparisonTable";
import AgentDrilldown from "./components/AgentDrilldown";
import AuxBreakdown from "./components/AuxBreakdown";
import RedFlagsPanel from "./components/RedFlagsPanel";
import RecommendationsPanel from "./components/RecommendationsPanel";
import RawDataTable from "./components/RawDataTable";
import UtilizationBarChart from "./components/Charts/UtilizationBarChart";
import StatusStackedChart from "./components/Charts/StatusStackedChart";
import DailyTrendChart from "./components/Charts/DailyTrendChart";
import AgentRankingChart from "./components/Charts/AgentRankingChart";
import { calculateDashboard } from "./utils/calculateKPIs";
import {
  buildExecutiveSummary,
  buildRecommendations,
  buildRedFlags,
} from "./utils/recommendationEngine";
import { exportSummaryPdf } from "./utils/exportUtils";
import { getUploadHistory, saveUploadHistory } from "./utils/uploadHistoryService";
import { trackEvent, trackPageVisit } from "./utils/tracking";
import { loadSavedScheduleReports } from "./utils/savedScheduleLoader";
import { loadSavedReportFiles } from "./utils/savedReportLoader";
import { loadSavedOperationsFiles } from "./utils/savedOperationsLoader";

export default function App() {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [scheduleReports, setScheduleReports] = useState([]);
  const [scheduleHistory, setScheduleHistory] = useState([]);
  const [operationsReports, setOperationsReports] = useState([]);
  const [selectedSite, setSelectedSite] = useState("All");
  const [activeSection, setActiveSection] = useState("Billable Hours");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [scheduleLoadMessage, setScheduleLoadMessage] = useState("");
  const [reportLoadMessage, setReportLoadMessage] = useState("");
  const [operationsLoadMessage, setOperationsLoadMessage] = useState("");

  useEffect(() => {
    trackPageVisit();

    getUploadHistory()
      .then((savedHistory) => {
        if (savedHistory.length) {
          setHistory((current) => [...current, ...savedHistory]);
        }
      })
      .catch((error) => console.warn("Upload history load failed:", error));

    loadSavedReportsOnStart();
    loadSavedSchedulesOnStart();
    loadSavedOperationsOnStart();
  }, []);

  const loadSavedReportsOnStart = async () => {
    try {
      const { reports, errors } = await loadSavedReportFiles();

      if (reports.length) {
        const parsedRows = reports.flatMap((report) => report.rows || []);

        setRows(parsedRows);

        setHistory((current) => [
          ...reports.map(({ rows: _, ...report }) => report),
          ...current,
        ]);

        setReportLoadMessage(
          `${reports.length} saved Tableau utilization report(s) loaded automatically: ${reports
            .map((report) => report.fileName)
            .join(", ")}. These files contain agent status minutes by date, agent, AUX/status, hourly bucket, and Grand Total. Phone Hours are calculated from On Call minutes divided by 60. Logged/status hours are calculated from On Call + Available + Break + Offline.`
        );
      }

      if (errors.length) {
        console.warn("Saved report load errors:", errors);
        setReportLoadMessage(errors.join(" | "));
      }
    } catch (error) {
      console.warn("Saved reports failed:", error);
      setReportLoadMessage(error.message);
    }
  };

  const loadSavedSchedulesOnStart = async () => {
    try {
      const { reports, errors } = await loadSavedScheduleReports();

      if (reports.length) {
        setScheduleReports(reports);
        setScheduleHistory(reports.map(({ rows: _, ...report }) => report));

        setScheduleLoadMessage(
          `${reports.length} saved schedule file(s) loaded automatically: ${reports
            .map((report) => report.fileName)
            .join(", ")}. Full-time scheduled/billable hours are capped at 6.5 hours per agent per day.`
        );
      }

      if (errors.length) {
        console.warn("Saved schedule load errors:", errors);
        setScheduleLoadMessage(errors.join(" | "));
      }
    } catch (error) {
      console.warn("Saved schedules failed:", error);
      setScheduleLoadMessage(error.message);
    }
  };

  const loadSavedOperationsOnStart = async () => {
    try {
      const { reports, errors } = await loadSavedOperationsFiles();

      if (reports.length) {
        setOperationsReports(reports);
        setOperationsLoadMessage(
          `${reports.length} operations intelligence file(s) loaded automatically: ${reports
            .map((report) => report.fileName)
            .join(", ")}. TUS Service Agents contains Telus/TUS answered calls, outbound calls, agent IDs, and average talk time. Abandoned Calls by Hour contains abandoned-call volume by date, weekday, and hour.`
        );
      }

      if (errors.length) {
        console.warn("Saved operations load errors:", errors);
        setOperationsLoadMessage(errors.join(" | "));
      }
    } catch (error) {
      console.warn("Saved operations files failed:", error);
      setOperationsLoadMessage(error.message);
    }
  };

  const dashboard = useMemo(() => calculateDashboard(rows), [rows]);

  const redFlags = useMemo(
    () => buildRedFlags(dashboard.siteKPIs, dashboard.agentKPIs),
    [dashboard.siteKPIs, dashboard.agentKPIs]
  );

  const recommendations = useMemo(
    () => buildRecommendations(dashboard.siteKPIs, redFlags),
    [dashboard.siteKPIs, redFlags]
  );

  const summary = useMemo(
    () => buildExecutiveSummary(dashboard.siteKPIs, dashboard.totals, redFlags),
    [dashboard.siteKPIs, dashboard.totals, redFlags]
  );

  const hasUtilizationData = rows.length > 0;
  const hasScheduleData = scheduleReports.length > 0;
  const hasOperationsData = operationsReports.length > 0;

  const handleUploadComplete = async (reports) => {
    const parsedRows = reports.flatMap((report) => report.rows || []);

    setRows(parsedRows);
    setHistory(reports.map(({ rows: _, ...report }) => report));
    setSelectedSite("All");
    setActiveSection("Billable Hours");

    setReportLoadMessage(
      `${reports.length} manually uploaded Tableau utilization report(s) loaded: ${reports
        .map((report) => report.fileName)
        .join(", ")}.`
    );

    setTimeout(() => {
      document
        .getElementById("active-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    try {
      await saveUploadHistory(reports);
    } catch (error) {
      console.warn("Could not save upload history:", error);
    }
  };

  const handleScheduleUploadComplete = async (reports) => {
    setScheduleReports(reports);
    setScheduleHistory(reports.map(({ rows: _, ...report }) => report));
    setActiveSection("Billable Hours");

    setScheduleLoadMessage(
      `${reports.length} schedule file(s) loaded: ${reports
        .map((report) => report.fileName)
        .join(", ")}.`
    );

    setTimeout(() => {
      document
        .getElementById("active-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const resetDashboard = async () => {
    await trackEvent("dashboard_reset");

    setRows([]);
    setHistory([]);
    setScheduleReports([]);
    setScheduleHistory([]);
    setOperationsReports([]);
    setSelectedSite("All");
    setActiveSection("Billable Hours");
    setReportLoadMessage("");
    setScheduleLoadMessage("");
    setOperationsLoadMessage("");

    await loadSavedReportsOnStart();
    await loadSavedSchedulesOnStart();
    await loadSavedOperationsOnStart();
  };

  const exportPdf = async () => {
    await trackEvent("export_summary_started", {
      callCenters: dashboard.totals.callCenterCount || 0,
      agents: dashboard.totals.agentCount || 0,
    });

    exportSummaryPdf({
      summary,
      totals: dashboard.totals,
      siteKPIs: dashboard.siteKPIs,
      agentKPIs: dashboard.agentKPIs,
      redFlags,
      recommendations,
      history,
    });
  };

  const sections = {
    "Leadership Brief": (
      <LeadershipBrief
        summary={summary}
        dashboard={dashboard}
        redFlags={redFlags}
        recommendations={recommendations}
        history={history}
        rows={rows}
      />
    ),

    "Billable Hours": (
      <BillableHoursAnalysis
        utilizationRows={rows}
        scheduleReports={scheduleReports}
      />
    ),

    "Operations Intelligence": (
      <OperationsIntelligence
        operationsReports={operationsReports}
        operationsLoadMessage={operationsLoadMessage}
      />
    ),

    "Executive Summary": (
      <ExecutiveSummary
        summary={summary}
        siteKPIs={dashboard.siteKPIs}
        redFlags={redFlags}
        usingMock={false}
      />
    ),

    "Site Comparison": (
      <SiteComparisonTable
        siteKPIs={dashboard.siteKPIs}
        selectedSite={selectedSite}
        setSelectedSite={setSelectedSite}
      />
    ),

    "Agent Utilization": (
      <AgentDrilldown
        agentKPIs={dashboard.agentKPIs}
        siteKPIs={dashboard.siteKPIs}
        selectedSite={selectedSite}
        setSelectedSite={setSelectedSite}
      />
    ),

    "AUX Breakdown": <AuxBreakdown siteKPIs={dashboard.siteKPIs} />,

    "Red Flags": <RedFlagsPanel redFlags={redFlags} />,

    Recommendations: <RecommendationsPanel recommendations={recommendations} />,

    "Raw Data": <RawDataTable rows={rows} />,
  };

  return (
    <div className="min-h-screen bg-hpBg text-slate-900">
      <Navbar
        onReset={resetDashboard}
        onExport={exportPdf}
        onMenu={() => setMobileSidebarOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-[1800px] gap-0 px-3 py-4 sm:px-4 lg:gap-6 lg:px-6 lg:py-6">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="w-full min-w-0 space-y-5 lg:space-y-6">
          <UploadPanel
            onUploadComplete={handleUploadComplete}
            history={history}
            reportLoadMessage={reportLoadMessage}
          />

          <ScheduleUploadPanel
            onScheduleUploadComplete={handleScheduleUploadComplete}
            scheduleHistory={scheduleHistory}
            scheduleLoadMessage={scheduleLoadMessage}
          />

          <UsageStats />

          {hasUtilizationData && (
            <>
              <KpiCards totals={dashboard.totals} redFlags={redFlags} />

              <section className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-2">
                <UtilizationBarChart siteKPIs={dashboard.siteKPIs} />
                <StatusStackedChart siteKPIs={dashboard.siteKPIs} />
                <DailyTrendChart
                  dailyTrend={dashboard.dailyTrend}
                  siteKPIs={dashboard.siteKPIs}
                />
                <AgentRankingChart agentKPIs={dashboard.agentKPIs} />
              </section>
            </>
          )}

          {(hasUtilizationData ||
            hasScheduleData ||
            hasOperationsData ||
            activeSection === "Billable Hours") && (
            <section
              id="active-section"
              className="print-card overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-executive"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-hpBlue">
                    Operations workspace
                  </p>

                  <h2 className="text-xl font-black text-hpNavy sm:text-2xl">
                    {activeSection}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.keys(sections).map((section) => (
                    <button
                      key={section}
                      onClick={async () => {
                        await trackEvent("section_tab_click", { section });
                        setActiveSection(section);
                      }}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition sm:text-sm ${
                        activeSection === section
                          ? "bg-hpBlue text-white shadow-md"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6">{sections[activeSection]}</div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}