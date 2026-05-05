// /src/components/ScheduleUploadPanel.jsx

import { CalendarClock, CheckCircle2, FileSpreadsheet, Info } from "lucide-react";

export default function ScheduleUploadPanel({ scheduleHistory = [], scheduleLoadMessage = "" }) {
  const hasSchedules = scheduleHistory.length > 0;

  return (
    <section className="print-card rounded-3xl bg-white shadow-executive border border-slate-100 p-4 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-hpBlue">
            Saved Schedules
          </p>

          <h2 className="text-2xl sm:text-3xl font-black text-hpNavy">
            Billable Hours Schedule Files Loaded Automatically
          </h2>

          <p className="mt-2 max-w-5xl text-sm sm:text-base text-hpMuted">
            The tool automatically loads the saved Buwelo and WNS schedule files from the project.
            These schedules are used as the billable-hour denominator for the Billable Hours analysis.
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700 ring-1 ring-green-100">
          {hasSchedules ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={18} />
              Schedules Loaded
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <CalendarClock size={18} />
              Loading Schedules
            </span>
          )}
        </div>
      </div>

      {scheduleLoadMessage && (
        <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-800">
          {scheduleLoadMessage}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-1 shrink-0 text-hpBlue" size={22} />

            <div>
              <p className="font-black text-hpNavy">
                How the schedule files are being calculated
              </p>

              <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                <p>
                  <span className="font-black text-hpNavy">Business rule:</span>{" "}
                  Full-time scheduled/billable hours are capped at{" "}
                  <span className="font-black text-green-700">6.5 hours per agent per day</span>.
                </p>

                <p>
                  <span className="font-black text-hpNavy">Formula:</span>{" "}
                  Phone Utilization % = Phone Hours ÷ Billable Hours.
                </p>

                <p>
                  <span className="font-black text-hpNavy">Phone Hours:</span>{" "}
                  Comes from the Tableau utilization report On Call minutes divided by 60.
                </p>

                <p>
                  <span className="font-black text-hpNavy">Billable Hours:</span>{" "}
                  Comes from the saved schedule files, capped at 6.5 hours for each full-time agent day.
                </p>

                <p>
                  <span className="font-black text-hpNavy">Important:</span>{" "}
                  The dashboard only compares dates that exist in both the utilization report and schedule file.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-green-700" />
            <p className="font-black text-hpNavy">Files Loaded</p>
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto space-y-2 text-xs text-slate-600">
            {scheduleHistory.length ? (
              scheduleHistory.map((item) => (
                <div
                  key={`${item.fileName}-${item.uploadedAt}`}
                  className="rounded-xl bg-white p-3 border border-slate-100"
                >
                  <p className="font-black text-slate-800">
                    {item.callCenter || "Unknown Call Center"}
                  </p>

                  <p className="truncate font-semibold">{item.fileName}</p>

                  <p className="mt-1">
                    <span className="font-bold">Sheets:</span>{" "}
                    {item.sheetName || "N/A"}
                  </p>

                  <p>
                    <span className="font-bold">Dates:</span>{" "}
                    {item.scheduleDateRange || "Date not detected"}
                  </p>

                  <p>
                    <span className="font-bold">Agents:</span>{" "}
                    {item.agentCount || 0}
                  </p>

                  <p>
                    <span className="font-bold">Billable Hours:</span>{" "}
                    {Number(item.totalBillableHours || 0).toFixed(1)}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Rule: {item.billableRule || "6.5 hours cap per full-time day"}
                  </p>
                </div>
              ))
            ) : (
              <p>No saved schedules loaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}