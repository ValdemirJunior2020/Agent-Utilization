// /src/components/UploadPanel.jsx

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { parseExcelFile, parseExcelUrl } from "../utils/excelParser";
import { sampleReportFiles } from "../data/mockData";

export default function UploadPanel({ onUploadComplete, history }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const parseFiles = async (files) => {
    if (!files.length) return;

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
      onUploadComplete(reports);
      setMessage(`${reports.length} report(s) loaded successfully.`);
    } else {
      setMessage("No reports were loaded. Please check the file format.");
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const loadSamples = async () => {
    setLoading(true);
    setErrors([]);
    setMessage("Loading the uploaded test Excel files from the project sample folder...");

    try {
      const reports = await Promise.all(
        sampleReportFiles.map((url) => parseExcelUrl(url))
      );

      onUploadComplete(reports);
      setMessage(`${reports.length} sample report(s) loaded successfully.`);
    } catch (error) {
      setErrors([error.message]);
      setMessage("Sample reports could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="print-card rounded-3xl bg-white shadow-executive border border-slate-100 p-4 sm:p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-hpBlue">
            Upload Reports
          </p>

          <h2 className="text-2xl sm:text-3xl font-black text-hpNavy">
            Tableau Agent Utilization Analyzer
          </h2>

          <p className="mt-2 max-w-4xl text-sm sm:text-base text-hpMuted">
            Upload WNS, TEP, Telus, Concentrix, Buwelo, or any vendor Excel
            export. The dashboard detects the site from the file name and
            normalizes columns automatically.
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
            Upload Reports
          </button>

          <button
            onClick={loadSamples}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hpNavy px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800"
          >
            <FileSpreadsheet size={18} />
            Load Test Files
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/60 p-4 text-sm text-slate-700">
          {loading ? (
            <div className="flex items-center gap-3 font-bold text-hpBlue">
              <Loader2 className="animate-spin" size={20} />
              {message}
            </div>
          ) : (
            <p>
              {message ||
                "No reports uploaded yet. Mock data is shown until real reports are loaded."}
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
          <p className="font-black text-hpNavy">Upload History</p>

          <div className="mt-2 max-h-40 overflow-y-auto space-y-2 text-xs text-slate-600">
            {history.length ? (
              history.map((item) => (
                <div
                  key={`${item.fileName}-${item.uploadedAt}`}
                  className="rounded-xl bg-white p-2 border border-slate-100"
                >
                  <p className="font-bold text-slate-800">
                    {item.callCenter || "Unknown Call Center"}
                  </p>

                  <p className="truncate">{item.fileName}</p>

                  <p>
                    {item.rowCount || 0} rows · Dates:{" "}
                    {item.reportDateRange ||
                      item.reportDate ||
                      "Date not detected"}
                  </p>

                  <p>
                    Start: {item.reportStartDate || "N/A"} · End:{" "}
                    {item.reportEndDate || "N/A"} · Days:{" "}
                    {item.reportDateCount || 0}
                  </p>

                  <p>{item.uploadedAt}</p>
                </div>
              ))
            ) : (
              <p>No upload history yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}