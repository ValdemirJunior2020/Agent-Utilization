// /src/components/AgentMappingNotice.jsx

import { CheckCircle2, IdCard, AlertTriangle } from "lucide-react";
import { getAgentMappingSummary } from "../utils/agentMappingParser";

export default function AgentMappingNotice({
  mappingReports = [],
  mappingLoadMessage = "",
}) {
  const summary = getAgentMappingSummary(mappingReports);
  const hasMappings = summary.totalMappings > 0;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-executive sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
            Agent ID Mapping
          </p>

          <h2 className="text-2xl font-black text-hpNavy">
            HP IDs Mapped to Real Agent Names
          </h2>

          <p className="mt-2 max-w-5xl text-sm leading-7 text-slate-600">
            The dashboard uses uploaded login/mapping files to replace Tableau HP IDs
            with real agent names. This makes the Break, Available, Offline, and On Call
            analysis easier to coach and validate.
          </p>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
            hasMappings
              ? "bg-green-50 text-green-700 ring-green-100"
              : "bg-amber-50 text-amber-700 ring-amber-100"
          }`}
        >
          {hasMappings ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={18} />
              {summary.totalMappings} mappings loaded
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={18} />
              No mappings loaded
            </span>
          )}
        </div>
      </div>

      {mappingLoadMessage && (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-bold leading-7 text-hpNavy">
          {mappingLoadMessage}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <IdCard className="mt-1 shrink-0 text-hpBlue" />

          <div className="w-full text-sm leading-7 text-slate-700">
            <p>
              <span className="font-black text-hpNavy">Loaded files:</span>{" "}
              {summary.fileNames.length ? summary.fileNames.join(", ") : "None"}
            </p>

            <p>
              <span className="font-black text-hpNavy">Call centers:</span>{" "}
              {summary.callCenters.length
                ? summary.callCenters.join(", ")
                : "None"}
            </p>

            <p>
              <span className="font-black text-hpNavy">Operations purpose:</span>{" "}
              Identify real agents with too much Break time, too much Available time,
              too much Offline time, low On Call time, or no call activity.
            </p>

            {summary.sources.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs">
                  <thead className="bg-white text-left uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Call Center</th>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Tab</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Mappings</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {summary.sources.map((source) => (
                      <tr
                        key={`${source.fileName}-${source.sheetName}-${source.sourceLabel}`}
                      >
                        <td className="px-3 py-2 font-black text-hpNavy">
                          {source.callCenter}
                        </td>
                        <td className="px-3 py-2">{source.fileName}</td>
                        <td className="px-3 py-2">{source.sheetName}</td>
                        <td className="px-3 py-2">{source.sourceLabel}</td>
                        <td className="px-3 py-2 font-black">
                          {source.mappingCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}