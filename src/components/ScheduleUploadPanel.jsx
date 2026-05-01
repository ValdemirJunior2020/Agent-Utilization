// /src/components/ScheduleUploadPanel.jsx

import { useState } from "react";
import { CalendarClock, FileSpreadsheet, Loader2 } from "lucide-react";
import { parseScheduleFile } from "../utils/scheduleParser";
import { trackEvent } from "../utils/tracking";
import { savedScheduleFiles } from "../data/savedSchedules";

async function parseScheduleUrl(url, fileName) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load saved schedule: ${fileName}`);
  }

  const blob = await response.blob();

  const file = new File([blob], fileName, {
    type:
      blob.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return parseScheduleFile(file);
}

export default function ScheduleUploadPanel({
  onScheduleUploadComplete,
  scheduleHistory = [],
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const loadSavedSchedules = async () => {
    await trackEvent("load_saved_schedules_click");

    setLoading(true);
    setErrors([]);
    setMessage("Loading saved online schedules...");

    const reports = [];
    const fileErrors = [];

    for (const savedFile of savedScheduleFiles) {
      try {
        const report = await parseScheduleUrl(savedFile.url, savedFile.fileName);
        reports.push(report);
      } catch (error) {
        fileErrors.push(`${savedFile.fileName}: ${error.message}`);
      }
    }

    setLoading(false);
    setErrors(fileErrors);

    if (reports.length) {
      await trackEvent("saved_schedules_loaded", {
        reportCount: reports.length,
        fileNames: reports.map((report) => report.fileName).join(", "),
      });

      onScheduleUploadComplete(reports);
      setMessage(`${reports.length} saved schedule file(s) loaded successfully.`);
    } else {
      setMessage("No saved schedules were loaded.");
    }
  };

  return (
    <section className="print-card rounded-3xl bg-white shadow-executive border border-slate-100 p-4 sm:p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-hpBlue">
            Saved Schedules
          </p>

          <h2 className="text-2xl sm:text-3xl font-black text-hpNavy">
            Billable Hours Schedule Parser
          </h2>

          <p className="mt-2 max-w-4xl text-sm sm:text-base text-hpMuted">
            Load the saved Buwelo and WNS schedule files already stored in the project.
            The dashboard uses only the schedule dates that overlap with the utilization reports.
          </p>

          <p className="mt-2 text-sm font-bold text-amber-700">
            Current supported tabs: Buwelo Partner_Voice, WNS Agent Sched,
            WNS Pavia, and WNS Nesting Sched.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 no-print">
          <button
            onClick={loadSavedSchedules}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hpNavy px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={18} />
            )}
            Load Saved Schedules
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 p-4 text-sm text-slate-700">
          {loading ? (
            <div className="flex items-center gap-3 font-bold text-green-700">
              <Loader2 className="animate-spin" size={20} />
              {message}
            </div>
          ) : (
            <p>
              {message ||
                "No saved schedule files loaded yet. Click Load Saved Schedules to calculate Phone Hours / Billable Hours."}
            </p>
          )}

          {!!errors.length && (
            <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-green-700" />
            <p className="font-black text-hpNavy">Schedule History</p>
          </div>

          <div className="mt-2 max-h-44 overflow-y-auto space-y-2 text-xs text-slate-600">
            {scheduleHistory.length ? (
              scheduleHistory.map((item) => (
                <div
                  key={`${item.fileName}-${item.uploadedAt}`}
                  className="rounded-xl bg-white p-2 border border-slate-100"
                >
                  <p className="font-bold text-slate-800">
                    {item.callCenter || "Unknown Call Center"}
                  </p>

                  <p className="truncate">{item.fileName}</p>

                  <p>Sheets: {item.sheetName || "N/A"}</p>

                  <p>Dates: {item.scheduleDateRange || "Date not detected"}</p>

                  <p>
                    Agents: {item.agentCount || 0} · Billable Hours:{" "}
                    {Number(item.totalBillableHours || 0).toFixed(1)}
                  </p>

                  <p>{item.uploadedAt}</p>
                </div>
              ))
            ) : (
              <p>No schedule history yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}