// /src/components/UploadPanel.jsx

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  UploadCloud,
} from "lucide-react";
import { parseExcelFile } from "../utils/excelParser";

function NoticeCard({ tone = "info", icon: Icon, title, children }) {
  const tones = {
    info: {
      wrapper: "border-sky-200 bg-sky-50",
      icon: "text-sky-700",
      title: "text-sky-900",
      body: "text-sky-900",
    },
    success: {
      wrapper: "border-green-200 bg-green-50",
      icon: "text-green-700",
      title: "text-green-900",
      body: "text-green-900",
    },
    warning: {
      wrapper: "border-sky-200 bg-sky-50",
      icon: "text-sky-700",
      title: "text-sky-900",
      body: "text-sky-900",
    },
    danger: {
      wrapper: "border-red-200 bg-red-50",
      icon: "text-red-700",
      title: "text-red-900",
      body: "text-red-900",
    },
  };

  const style = tones[tone] || tones.info;

  return (
    <div className={`rounded-2xl border p-4 ${style.wrapper}`}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <Icon className={`mt-0.5 shrink-0 ${style.icon}`} size={18} />
        ) : null}

        <div className="min-w-0">
          <p className={`font-black ${style.title}`}>{title}</p>
          <div className={`mt-2 text-sm leading-7 ${style.body}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHistoryItem(item) {
  const dates =
    item.startDate && item.endDate
      ? `${item.startDate} to ${item.endDate}`
      : item.dateRange || "No date range";

  return {
    name: item.fileName || "Unknown file",
    vendor: item.callCenter || "Unknown",
    dates,
    rows: item.rowCount || 0,
    source: item.sourceLabel || "Auto-loaded saved report",
  };
}

export default function UploadPanel({
  onUploadComplete,
  history = [],
  reportLoadMessage = "",
}) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localInfo, setLocalInfo] = useState("");

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setIsUploading(true);
    setLocalError("");
    setLocalInfo("");

    try {
      const reports = [];

      for (const file of files) {
        const report = await parseExcelFile(file);
        reports.push(report);
      }

      await onUploadComplete(reports);

      setLocalInfo(
        `${reports.length} report(s) uploaded successfully: ${reports
          .map((report) => report.fileName)
          .join(", ")}.`
      );
    } catch (error) {
      console.error(error);
      setLocalError(error.message || "Could not parse the Tableau reports.");
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const historyItems = history.map(formatHistoryItem);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-hpBlue">
            Saved Tableau Reports
          </p>

          <h2 className="mt-2 text-3xl font-black text-hpNavy">
            Utilization Reports Loaded Automatically
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
            The tool automatically loads the saved Tableau utilization reports from the
            project. These reports provide the phone-time numerator and AUX/status time
            used for operational analysis.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBrowseClick}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hpBlue px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-blue-700"
        >
          <UploadCloud size={18} />
          Replace / Upload Reports
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <NoticeCard tone="warning" icon={AlertTriangle} title="Auto-loaded report files and data warning">
          <p className="font-black">
            The tool is loading these saved Tableau reports automatically:
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-6 font-black">
            {historyItems.slice(0, 5).map((item) => (
              <li key={`${item.vendor}-${item.name}`}>
                {item.name}
              </li>
            ))}
          </ul>

          <p className="mt-4 font-black">
            These files contain agent status minutes by date, agent, AUX/status,
            hourly bucket, and Grand Total. Phone Hours are calculated from On Call
            minutes divided by 60. Logged/status hours are calculated from On Call +
            Available + Break + Offline.
          </p>

          <p className="mt-4 font-black">
            Important: Tableau hourly bucket logic may overstate AUX statuses if an
            agent changes status inside the hour. These results are directional until
            missing agents, date overlap, and raw interval-level status data are validated.
          </p>

          {reportLoadMessage && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-4 font-black text-sky-900">
              {reportLoadMessage}
            </div>
          )}
        </NoticeCard>

        {localInfo && (
          <NoticeCard
            tone="success"
            icon={CheckCircle2}
            title="Manual upload complete"
          >
            <p>{localInfo}</p>
          </NoticeCard>
        )}

        {localError && (
          <NoticeCard tone="danger" icon={AlertTriangle} title="Upload error">
            <p>{localError}</p>
          </NoticeCard>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-hpBlue" size={18} />

            <div>
              <p className="font-black text-hpNavy">
                How the Tableau utilization reports are calculated
              </p>

              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                <p>
                  <span className="font-black">Phone Hours:</span> On Call
                  minutes ÷ 60.
                </p>

                <p>
                  <span className="font-black">Logged / Status Hours:</span> On
                  Call + Available + Break + Offline.
                </p>

                <p>
                  <span className="font-black">AUX Caution:</span> Break,
                  Available, and Offline can be distorted by Tableau hourly bucket
                  behavior.
                </p>

                <p>
                  <span className="font-black">Missing Agent Warning:</span> If
                  agents are missing from Tableau, the phone-hour numerator may be
                  incomplete and utilization may look lower than reality.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-hpBlue" size={18} />
            <p className="font-black text-hpNavy">Reports Loaded</p>
          </div>

          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {historyItems.length ? (
              historyItems.map((item) => (
                <div
                  key={`${item.vendor}-${item.name}-${item.dates}`}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <p className="font-black text-hpNavy">{item.vendor}</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Dates: {item.dates}
                  </p>
                  <p className="text-sm text-slate-500">Rows: {item.rows}</p>
                  <p className="text-xs text-slate-400">
                    Source: {item.source}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                No report history yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
          Uploading and parsing reports...
        </div>
      )}
    </section>
  );
}