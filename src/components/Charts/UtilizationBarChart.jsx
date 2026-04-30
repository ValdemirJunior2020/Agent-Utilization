// /src/components/Charts/UtilizationBarChart.jsx
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

export default function UtilizationBarChart({ siteKPIs }) {
  return (
    <ChartCard title="Utilization % by Call Center" subtitle="Paid-time productivity benchmark">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={siteKPIs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="callCenter" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          <Bar dataKey="utilization" name="Utilization" fill="#0077C8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
