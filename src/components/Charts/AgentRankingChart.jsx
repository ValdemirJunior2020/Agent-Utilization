// /src/components/Charts/AgentRankingChart.jsx
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

export default function AgentRankingChart({ agentKPIs }) {
  const data = [...agentKPIs]
    .sort((a, b) => b.onCallHours - a.onCallHours)
    .slice(0, 10)
    .map((agent) => ({ ...agent, label: `${agent.agent.slice(0, 16)} (${agent.callCenter})` }));

  return (
    <ChartCard title="Top 10 Agents by On Call Hours" subtitle="Strongest direct customer-handling contribution">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}h`} />
          <Bar dataKey="onCallHours" name="On Call Hours" fill="#16A34A" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
