// /src/components/MappingCoverage.jsx

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  TableProperties,
  Users,
} from "lucide-react";

const GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1QZO61rBDUUbNH-lkWrmhgADjHraZkV4wfZ_cSo0MaD8/edit?usp=sharing";

function normalizeVendor(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === "teleperformance") return "TEP";
  if (text === "tep") return "TEP";
  if (text === "concentrix") return "Concentrix";
  if (text === "buwelo") return "Buwelo";
  if (text === "wns") return "WNS";
  if (text === "telus") return "Telus";

  return value || "Unknown";
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildAliases(value) {
  const raw = normalizeId(value);
  const aliases = new Set();

  if (!raw) return [];

  aliases.add(raw);

  if (raw.startsWith("hp")) aliases.add(raw.replace(/^hp/, ""));
  if (raw.startsWith("tes")) aliases.add(raw.replace(/^tes/, ""));
  if (raw.startsWith("tp")) aliases.add(raw.replace(/^tp/, ""));

  if (/^\d+$/.test(raw)) {
    aliases.add(`hp${raw}`);
    aliases.add(`tes${raw}`);
    aliases.add(`tp${raw}`);
  }

  return [...aliases];
}

function getGoogleAgentId(agent) {
  return (
    agent.agent_id ||
    agent.hp_id ||
    agent.id ||
    agent.employee_id ||
    agent.uid ||
    ""
  );
}

function getGoogleAgentName(agent) {
  return (
    agent.full_name ||
    agent.agent_name ||
    agent.name ||
    `${agent.first_name || ""} ${agent.last_name || ""}`.trim() ||
    ""
  );
}

function getScheduleAgentId(row) {
  return (
    row.employeeId ||
    row.agentId ||
    row.hpId ||
    row.agentHpId ||
    row.agentName ||
    row.agent ||
    ""
  );
}

function getUtilizationAgentId(row) {
  return (
    row.agentHpId ||
    row.agentOriginal ||
    row.agent ||
    row.agentId ||
    row.hpId ||
    row.agentName ||
    row.agentDisplayName ||
    ""
  );
}

function getUtilizationAgentName(row) {
  return row.agentDisplayName || row.agentName || row.agent || row.agentHpId || "";
}

function hasMatch(id, targetSet) {
  return buildAliases(id).some((alias) => targetSet.has(alias));
}

function buildVendorCoverage({
  vendor,
  googleAgents,
  scheduleRows,
  utilizationRows,
}) {
  const vendorGoogleAgents = googleAgents.filter(
    (agent) =>
      normalizeVendor(agent.vendor || agent.call_center || agent.site) === vendor
  );

  const vendorScheduleRows = scheduleRows.filter(
    (row) => normalizeVendor(row.callCenter) === vendor
  );

  const vendorUtilizationRows = utilizationRows.filter(
    (row) => normalizeVendor(row.callCenter) === vendor
  );

  const googleAgentIds = unique(vendorGoogleAgents.map(getGoogleAgentId));
  const googleAgentNames = unique(vendorGoogleAgents.map(getGoogleAgentName));

  const scheduleAgentIds = unique(vendorScheduleRows.map(getScheduleAgentId));
  const utilizationAgentIds = unique(vendorUtilizationRows.map(getUtilizationAgentId));

  const googleAliasSet = new Set();
  googleAgentIds.forEach((id) => {
    buildAliases(id).forEach((alias) => googleAliasSet.add(alias));
  });

  const scheduleAliasSet = new Set();
  scheduleAgentIds.forEach((id) => {
    buildAliases(id).forEach((alias) => scheduleAliasSet.add(alias));
  });

  const utilizationAliasSet = new Set();
  utilizationAgentIds.forEach((id) => {
    buildAliases(id).forEach((alias) => utilizationAliasSet.add(alias));
  });

  const scheduleMatchedToTableau = scheduleAgentIds.filter((id) =>
    hasMatch(id, utilizationAliasSet)
  );

  const scheduleNotMatchedToTableau = scheduleAgentIds.filter(
    (id) => !hasMatch(id, utilizationAliasSet)
  );

  const tableauMatchedToGoogleSheet = utilizationAgentIds.filter((id) =>
    hasMatch(id, googleAliasSet)
  );

  const tableauNotMatchedToGoogleSheet = utilizationAgentIds.filter(
    (id) => !hasMatch(id, googleAliasSet)
  );

  const googleNotSeenInTableau = googleAgentIds.filter(
    (id) => !hasMatch(id, utilizationAliasSet)
  );

  const scheduleMatchRate =
    scheduleAgentIds.length > 0
      ? (scheduleMatchedToTableau.length / scheduleAgentIds.length) * 100
      : 0;

  const googleMappingRate =
    utilizationAgentIds.length > 0
      ? (tableauMatchedToGoogleSheet.length / utilizationAgentIds.length) * 100
      : 0;

  return {
    vendor,
    googleAgentCount: googleAgentIds.length || googleAgentNames.length,
    scheduleAgentCount: scheduleAgentIds.length,
    tableauAgentCount: utilizationAgentIds.length,
    scheduleMatchedToTableauCount: scheduleMatchedToTableau.length,
    scheduleNotMatchedToTableauCount: scheduleNotMatchedToTableau.length,
    tableauMatchedToGoogleSheetCount: tableauMatchedToGoogleSheet.length,
    tableauNotMatchedToGoogleSheetCount: tableauNotMatchedToGoogleSheet.length,
    googleNotSeenInTableauCount: googleNotSeenInTableau.length,
    scheduleMatchRate,
    googleMappingRate,
    scheduleNotMatchedToTableau: scheduleNotMatchedToTableau.slice(0, 20),
    tableauNotMatchedToGoogleSheet: tableauNotMatchedToGoogleSheet.slice(0, 20),
  };
}

function StatusBadge({ value }) {
  if (value >= 80) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-100">
        Healthy
      </span>
    );
  }

  if (value >= 50) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
        Needs Review
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-100">
      Data Risk
    </span>
  );
}

function MetricCard({ title, value, detail, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-hpBlue",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    navy: "bg-slate-100 text-hpNavy",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-hpNavy">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>

        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function MappingCoverage({
  googleAgents = [],
  googleAgentCounts = [],
  utilizationRows = [],
  scheduleReports = [],
}) {
  const scheduleRows = scheduleReports.flatMap((report) => report.rows || []);

  const vendors = unique([
    ...googleAgents.map((agent) =>
      normalizeVendor(agent.vendor || agent.call_center || agent.site)
    ),
    ...utilizationRows.map((row) => normalizeVendor(row.callCenter)),
    ...scheduleRows.map((row) => normalizeVendor(row.callCenter)),
  ]).filter((vendor) => vendor !== "Unknown");

  const coverageRows = vendors
    .map((vendor) =>
      buildVendorCoverage({
        vendor,
        googleAgents,
        scheduleRows,
        utilizationRows,
      })
    )
    .sort((a, b) => a.vendor.localeCompare(b.vendor));

  const totalGoogleAgents =
    googleAgentCounts.reduce(
      (sum, item) => sum + Number(item.activeAgents || item.agents || 0),
      0
    ) || googleAgents.length;

  const totalTableauAgents = unique(utilizationRows.map(getUtilizationAgentId)).length;
  const totalScheduleAgents = unique(scheduleRows.map(getScheduleAgentId)).length;

  const totalTableauUnmapped = coverageRows.reduce(
    (sum, row) => sum + row.tableauNotMatchedToGoogleSheetCount,
    0
  );

  const totalScheduleNotMatched = coverageRows.reduce(
    (sum, row) => sum + row.scheduleNotMatchedToTableauCount,
    0
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-amber-600 via-hpNavy to-slate-950 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-100">
              Mapping Coverage
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Google Sheet Roster vs Schedule vs Tableau
            </h2>

            <p className="mt-2 max-w-5xl text-sm leading-7 text-amber-50 sm:text-base">
              This section explains where the data is coming from and why “scheduled
              not matched” is different from total agents in the Google Sheet.
            </p>
          </div>

          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-yellow-300"
          >
            <ExternalLink size={18} />
            Where is this data coming from?
          </a>
        </div>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-7">
          <p>
            <span className="font-black">Google Sheet Agents_Master:</span> master
            roster for agent names, vendors, IDs, and agent quantity.
          </p>
          <p>
            <span className="font-black">Schedules:</span> who was supposed to work.
          </p>
          <p>
            <span className="font-black">Tableau reports:</span> who showed
            utilization activity such as On Call, Available, Break, and Offline.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Google Sheet Agents"
          value={number(totalGoogleAgents)}
          detail="Master roster count"
          icon={Database}
          tone="green"
        />

        <MetricCard
          title="Schedule Agents"
          value={number(totalScheduleAgents)}
          detail="From schedule files"
          icon={Users}
          tone="blue"
        />

        <MetricCard
          title="Tableau Agents"
          value={number(totalTableauAgents)}
          detail="From utilization files"
          icon={TableProperties}
          tone="navy"
        />

        <MetricCard
          title="Tableau Unmapped"
          value={number(totalTableauUnmapped)}
          detail="Tableau IDs not found in Google Sheet"
          icon={AlertTriangle}
          tone={totalTableauUnmapped > 0 ? "red" : "green"}
        />

        <MetricCard
          title="Schedule Not Matched"
          value={number(totalScheduleNotMatched)}
          detail="Scheduled agents not matched to Tableau"
          icon={AlertTriangle}
          tone={totalScheduleNotMatched > 0 ? "red" : "green"}
        />
      </section>

      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 shrink-0 text-yellow-700" />
          <div>
            <p className="font-black text-yellow-900">
              Leadership explanation
            </p>
            <p className="mt-2 text-sm leading-7 text-yellow-900">
              The Google Sheet shows the master roster and total active agents.
              “Scheduled Not Matched” does not mean those agents are missing from the
              roster. It means the schedule file has agents that did not match Tableau
              utilization for the compared dates. This can happen because of ID format
              differences, missing Tableau setup, schedule-only agents, or agents not
              showing activity during the selected period.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
              Vendor Coverage Table
            </p>
            <h3 className="text-2xl font-black text-hpNavy">
              Roster, schedule, and Tableau matching
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Use this to explain the difference between total agents and matched
              operational records.
            </p>
          </div>

          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-slate-950 shadow-md hover:bg-yellow-300"
          >
            <ExternalLink size={16} />
            Open Google Sheet
          </a>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Call Center</th>
                <th className="px-4 py-3">Google Sheet Agents</th>
                <th className="px-4 py-3">Schedule Agents</th>
                <th className="px-4 py-3">Tableau Agents</th>
                <th className="px-4 py-3">Schedule Matched</th>
                <th className="px-4 py-3">Scheduled Not Matched</th>
                <th className="px-4 py-3">Tableau Mapped to Google Sheet</th>
                <th className="px-4 py-3">Tableau Unmapped</th>
                <th className="px-4 py-3">Schedule Match %</th>
                <th className="px-4 py-3">Google Mapping %</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {coverageRows.map((row) => (
                <tr key={row.vendor} className="hover:bg-sky-50">
                  <td className="px-4 py-3 font-black text-hpNavy">
                    {row.vendor}
                  </td>

                  <td className="px-4 py-3">{number(row.googleAgentCount)}</td>
                  <td className="px-4 py-3">{number(row.scheduleAgentCount)}</td>
                  <td className="px-4 py-3">{number(row.tableauAgentCount)}</td>
                  <td className="px-4 py-3">
                    {number(row.scheduleMatchedToTableauCount)}
                  </td>
                  <td className="px-4 py-3 font-black text-red-700">
                    {number(row.scheduleNotMatchedToTableauCount)}
                  </td>
                  <td className="px-4 py-3">
                    {number(row.tableauMatchedToGoogleSheetCount)}
                  </td>
                  <td className="px-4 py-3 font-black text-amber-700">
                    {number(row.tableauNotMatchedToGoogleSheetCount)}
                  </td>
                  <td className="px-4 py-3 font-black">
                    {percent(row.scheduleMatchRate)}
                  </td>
                  <td className="px-4 py-3 font-black">
                    {percent(row.googleMappingRate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      value={Math.max(row.scheduleMatchRate, row.googleMappingRate)}
                    />
                  </td>
                </tr>
              ))}

              {!coverageRows.length && (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan="11">
                    No mapping coverage data is available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {coverageRows
          .filter(
            (row) =>
              row.scheduleNotMatchedToTableau.length ||
              row.tableauNotMatchedToGoogleSheet.length
          )
          .map((row) => (
            <div
              key={`${row.vendor}-samples`}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 text-hpBlue" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
                    {row.vendor} Samples
                  </p>
                  <h3 className="text-xl font-black text-hpNavy">
                    Records that need review
                  </h3>
                </div>
              </div>

              {!!row.scheduleNotMatchedToTableau.length && (
                <div className="mt-4">
                  <p className="font-black text-red-700">
                    Scheduled not matched to Tableau
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.scheduleNotMatchedToTableau.map((item) => (
                      <span
                        key={`schedule-${row.vendor}-${item}`}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!!row.tableauNotMatchedToGoogleSheet.length && (
                <div className="mt-4">
                  <p className="font-black text-amber-700">
                    Tableau IDs not found in Google Sheet
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.tableauNotMatchedToGoogleSheet.map((item) => (
                      <span
                        key={`tableau-${row.vendor}-${item}`}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}