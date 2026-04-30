// /src/components/Charts/DailyTrendChart.jsx

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SITE_COLORS = {
  WNS: "#0077C8",
  TEP: "#DC2626",
  Telus: "#16A34A",
  Concentrix: "#22A7F0",
  Buwelo: "#F59E0B",
  Unknown: "#64748B",
};

function normalizePercent(value) {
  const number = Number(value || 0);

  if (number <= 1) {
    return number * 100;
  }

  return number;
}

function formatPercent(value) {
  return `${normalizePercent(value).toFixed(1)}%`;
}

function formatDateLabel(date) {
  if (!date || date === "Unknown Date") return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildChartData(dailyTrend = []) {
  const centers = [...new Set(dailyTrend.map((item) => item.callCenter))]
    .filter(Boolean)
    .sort();

  const groupedByDate = dailyTrend.reduce((acc, item) => {
    const date = item.date || "Unknown Date";

    if (!acc[date]) {
      acc[date] = {
        date,
        displayDate: formatDateLabel(date),
      };
    }

    acc[date][item.callCenter] = normalizePercent(item.utilization);

    return acc;
  }, {});

  const rows = Object.values(groupedByDate).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  return {
    centers,
    rows,
  };
}

function buildLatestDayData(rows, centers) {
  const latest = rows[rows.length - 1];

  if (!latest) return [];

  return centers
    .map((center) => ({
      callCenter: center,
      utilization: Number(latest[center] || 0),
      date: latest.date,
      displayDate: latest.displayDate,
      color: SITE_COLORS[center] || SITE_COLORS.Unknown,
    }))
    .sort((a, b) => b.utilization - a.utilization);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const cleanPayload = payload
    .filter((item) => Number(item.value || 0) > 0)
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <p className="mb-3 text-sm font-black text-hpNavy">{label}</p>

      <div className="space-y-2">
        {cleanPayload.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-8 text-sm"
          >
            <span className="font-bold" style={{ color: item.color }}>
              {item.name}
            </span>

            <span className="font-black text-slate-900">
              {formatPercent(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-black text-hpNavy">{item.callCenter}</p>
      <p className="text-xs text-slate-500">{item.displayDate}</p>
      <p className="mt-2 text-lg font-black text-slate-900">
        {formatPercent(item.utilization)}
      </p>
    </div>
  );
}

export default function DailyTrendChart({ dailyTrend = [] }) {
  const { centers, rows } = buildChartData(dailyTrend);
  const hasEnoughDatesForLine = rows.length >= 2;
  const latestDayData = buildLatestDayData(rows, centers);

  if (!dailyTrend.length || !rows.length || !centers.length) {
    return (
      <div className="h-[360px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-hpBlue">
              Analytics
            </p>
            <h3 className="mt-2 text-2xl font-black text-hpNavy">
              Daily Utilization Trend
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Upload reports with valid daily dates to display the trend.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasEnoughDatesForLine) {
    return (
      <div className="h-[420px]">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
            Analytics
          </p>

          <h3 className="text-2xl font-black text-hpNavy">
            Latest Day Utilization
          </h3>

          <p className="text-sm text-slate-500">
            Only one report date was detected, so this view shows site comparison
            instead of a broken line trend.
          </p>
        </div>

        <ResponsiveContainer width="100%" height="82%">
          <BarChart
            data={latestDayData}
            layout="vertical"
            margin={{ top: 10, right: 35, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />

            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12, fill: "#64748B" }}
            />

            <YAxis
              type="category"
              dataKey="callCenter"
              width={90}
              tick={{ fontSize: 12, fill: "#071A2D", fontWeight: 700 }}
            />

            <Tooltip content={<CustomBarTooltip />} />

            <Bar
              dataKey="utilization"
              radius={[0, 12, 12, 0]}
              barSize={24}
            >
              {latestDayData.map((entry) => (
                <Cell key={entry.callCenter} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[420px]">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-hpBlue">
          Analytics
        </p>

        <h3 className="text-2xl font-black text-hpNavy">
          Daily Utilization Trend
        </h3>

        <p className="text-sm text-slate-500">
          Daily paid-time productivity trend by call center.
        </p>
      </div>

      <ResponsiveContainer width="100%" height="82%">
        <LineChart
          data={rows}
          margin={{ top: 10, right: 35, left: 10, bottom: 45 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />

          <XAxis
            dataKey="displayDate"
            interval="preserveStartEnd"
            angle={-35}
            textAnchor="end"
            tick={{ fontSize: 11, fill: "#64748B" }}
            height={55}
          />

          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12, fill: "#64748B" }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="bottom"
            height={35}
            iconType="circle"
            wrapperStyle={{
              paddingTop: "12px",
              fontWeight: 700,
            }}
          />

          {centers.map((center) => (
            <Line
              key={center}
              type="monotone"
              dataKey={center}
              name={center}
              stroke={SITE_COLORS[center] || SITE_COLORS.Unknown}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}