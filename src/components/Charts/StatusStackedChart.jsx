// /src/components/Charts/StatusStackedChart.jsx
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

export default function StatusStackedChart({ siteKPIs }) {
  return (
    <ChartCard title="Logged Time Distribution" subtitle="On Call, Available, Break, and Offline hours">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={siteKPIs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="callCenter" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}h`} />
          <Legend />
          <Bar dataKey="onCallHours" stackId="a" name="On Call" fill="#0077C8" />
          <Bar dataKey="availableHours" stackId="a" name="Available" fill="#22A7F0" />
          <Bar dataKey="breakHours" stackId="a" name="Break" fill="#F59E0B" />
          <Bar dataKey="offlineHours" stackId="a" name="Offline" fill="#DC2626" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
