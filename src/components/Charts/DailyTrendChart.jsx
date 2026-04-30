// /src/components/Charts/DailyTrendChart.jsx
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

const colors = ['#0077C8', '#16A34A', '#F59E0B', '#DC2626', '#22A7F0', '#071A2D'];

export default function DailyTrendChart({ dailyTrend, siteKPIs }) {
  const sites = siteKPIs.map((site) => site.callCenter);
  const byDate = dailyTrend.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || { date: item.date };
    acc[item.date][item.callCenter] = Number(item.utilization.toFixed(1));
    return acc;
  }, {});
  const data = Object.values(byDate);
  return (
    <ChartCard title="Daily Utilization Trend" subtitle="Use this to detect partial-day or site-level swings">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          <Legend />
          {sites.map((site, index) => <Line key={site} type="monotone" dataKey={site} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
