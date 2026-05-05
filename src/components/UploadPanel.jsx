// /src/components/UploadPanel.jsx

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { parseExcelFile } from "../utils/excelParser";
import { trackEvent } from "../utils/tracking";

export default function UploadPanel({
  onUploadComplete,
  history = [],
  reportLoadMessage = "",
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const parseFiles = async (files) => {
    if (!files.length) return;

    await trackEvent("upload_reports_click", {
      fileCount: files.length,
    });

    setLoading(true);
    setErrors([]);
    setMessage("Parsing Tableau Excel reports...");

    const reports = [];
    const fileErrors = [];

    for (const file of files) {
      try {
        const report = await parseExcelFile(file);
        reports.push(report);
      } catch (error) {
        fileErrors.push(`${file.name}: ${error.message}`);
      }
    }

    setLoading(false);
    setErrors(fileErrors);

    if (reports.length) {
      await trackEvent("reports_uploaded", {
        reportCount: reports.length,
        fileNames: reports.map((report) => report.fileName).join(", "),
      });

      await onUploadComplete(reports);

      setMessage(`${reports.length} report(s) loaded successfully.`);
    } else {
      setMessage("No reports were loaded. Please check the file format.");
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <section className="print-card rounded-3xl bg-white shadow-executive border border-slate-100 p-4 sm:p-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Saved Tableau Reports
          </p>

          <h2 className="text-2xl sm:text-3xl font-black text-hpNavy">
            Utilization Reports Loaded Automatically
          </h2>

          <p className="mt-2 max-w-5xl text-sm sm:text-base text-hpMuted">
            The tool automatically loads the saved Tableau utilization reports from
            the project. These reports provide the phone-time numerator and AUX/status
            time used for operational analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 no-print">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(event) =>
              parseFiles(Array.from(event.target.files || []))
            }
          />

          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hpBlue px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-sky-500"
          >
            <UploadCloud size={18} />
            Replace / Upload Reports
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 shrink-0 text-red-700" size={22} />

          <div>
            <p className="text-base font-black text-red-900">
              Auto-loaded report files and data warning
            </p>

            <p className="mt-2">
              The tool is loading these saved Tableau reports automatically:
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Buwelo Service.xlsx</li>
              <li>Concentrix Service.xlsx</li>
              <li>Telus Utilization.xlsx</li>
              <li>TEP Service.xlsx</li>
              <li>WNS Service.xlsx</li>
            </ul>

            <p className="mt-3">
              These files contain agent status minutes by date, agent, AUX/status,
              hourly bucket, and Grand Total. Phone Hours are calculated from On Call
              minutes divided by 60. Logged/status hours are calculated from On Call +
              Available + Break + Offline.
            </p>

            <p className="mt-3">
              Important: Tableau hourly bucket logic may overstate AUX statuses if an
              agent changes status inside the hour. These results are directional until
              missing agents, date overlap, and raw interval-level status data are validated.
            </p>

            {reportLoadMessage && (
              <p className="mt-3 rounded-xl bg-white p-3 text-red-900">
                {reportLoadMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-red-100 bg-red-50/70 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-1 shrink-0 text-red-700" size={22} />

            <div>
              <p className="font-black text-red-900">
                How the Tableau utilization reports are calculated
              </p>

              <div className="mt-2 space-y-2 text-sm leading-6 text-red-800">
                <p>
                  <span className="font-black">Phone Hours:</span>{" "}
                  On Call minutes ÷ 60.
                </p>

                <p>
                  <span className="font-black">Logged / Status Hours:</span>{" "}
                  On Call + Available + Break + Offline.
                </p>

                <p>
                  <span className="font-black">AUX Warning:</span>{" "}
                  Break, Available, and Offline can be distorted by Tableau hourly
                  bucket behavior.
                </p>

                <p>
                  <span className="font-black">Missing Agent Warning:</span>{" "}
                  If agents are missing from Tableau, the phone-hour numerator may be
                  incomplete and utilization may look lower than reality.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-red-700" />
            <p className="font-black text-hpNavy">Reports Loaded</p>
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto space-y-2 text-xs text-slate-600">
            {history.length ? (
              history.map((item) => (
                <div
                  key={`${item.fileName}-${item.uploadedAt}`}
                  className="rounded-xl bg-white p-3 border border-slate-100"
                >
                  <p className="font-black text-slate-800">
                    {item.callCenter || "Unknown Call Center"}
                  </p>

                  <p className="truncate font-semibold">{item.fileName}</p>

                  <p className="mt-1">
                    <span className="font-bold">Dates:</span>{" "}
                    {item.reportDateRange || "Date not detected"}
                  </p>

                  <p>
                    <span className="font-bold">Rows:</span>{" "}
                    {item.rowCount || 0}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Source:{" "}
                    {item.loadedAutomatically
                      ? "Auto-loaded saved report"
                      : "Manual upload / saved history"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-3 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Loading saved reports...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-bold text-hpBlue">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin" size={20} />
            {message}
          </div>
        </div>
      ) : (
        message && (
          <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              {message}
            </div>
          </div>
        )
      )}

      {!!errors.length && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </section>
  );
}