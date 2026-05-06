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
            Concentrix HP IDs Mapped to Real Agent Names
          </h2>

          <p className="mt-2 max-w-5xl text-sm leading-7 text-slate-600">
            The dashboard uses the Concentrix login file to replace Tableau HP IDs
            with real agent names. This helps identify agents spending too much time
            on Break, too much time Available, or not receiving calls.
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
          <IdCard className="mt-1 text-hpBlue" />
          <div className="text-sm leading-7 text-slate-700">
            <p>
              <span className="font-black text-hpNavy">Loaded file:</span>{" "}
              {summary.fileNames.length ? summary.fileNames.join(", ") : "None"}
            </p>

            <p>
              <span className="font-black text-hpNavy">Call center:</span>{" "}
              {summary.callCenters.length ? summary.callCenters.join(", ") : "None"}
            </p>

            <p>
              <span className="font-black text-hpNavy">Mapping rule:</span>{" "}
              CON Master List tab, Column K = HP ID, Column D = Agent Name.
            </p>

            <p>
              <span className="font-black text-hpNavy">Operations purpose:</span>{" "}
              Once mapped, we can review real agents by Break hours, Available hours,
              Offline time, On Call time, and utilization balance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}