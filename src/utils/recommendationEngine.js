// /src/utils/recommendationEngine.js
import { KPI_RULES } from '../data/kpiRules';
import { percent } from './formatters';

export function buildRedFlags(siteKPIs, agentKPIs = []) {
  const flags = [];

  siteKPIs.forEach((site) => {
    if (site.utilization < KPI_RULES.utilizationCritical) {
      flags.push({ title: 'Critical utilization gap', site: site.callCenter, severity: 'Critical', meaning: `${site.callCenter} is converting only ${percent(site.utilization)} of logged time into On Call time.`, action: 'Review staffing intervals, call volume, adherence, and agent idle behavior.' });
    } else if (site.utilization < KPI_RULES.utilizationReview) {
      flags.push({ title: 'Utilization needs review', site: site.callCenter, severity: 'Medium', meaning: `${site.callCenter} is below the healthy utilization range.`, action: 'Validate whether the report is partial and compare staffing to arrival volume.' });
    }
    if (site.breakPct > KPI_RULES.breakCritical) {
      flags.push({ title: 'Critical Break AUX risk', site: site.callCenter, severity: 'Critical', meaning: `Break represents ${percent(site.breakPct)} of logged time, which can indicate AUX misuse, mapping issues, or adherence gaps.`, action: 'Ask the vendor to explain Break time and audit interval-level AUX mapping.' });
    }
    if (site.offlinePct > KPI_RULES.offlineRisk) {
      flags.push({ title: 'Offline status risk', site: site.callCenter, severity: 'High', meaning: `Offline time is ${percent(site.offlinePct)} of logged time.`, action: 'Review meetings, coaching, system issues, and offline reason codes.' });
    }
    if (site.availablePct > KPI_RULES.availableRisk) {
      flags.push({ title: 'Possible overstaffing or low volume', site: site.callCenter, severity: 'Medium', meaning: `Available time is ${percent(site.availablePct)} of logged time.`, action: 'Compare staffing to call arrival patterns by interval before making schedule decisions.' });
    }
    if (site.zeroOnCallAgents > 0) {
      flags.push({ title: 'Agents with zero On Call time', site: site.callCenter, severity: 'High', meaning: `${site.zeroOnCallAgents} agent(s) show logged time with no On Call productivity.`, action: 'Audit these agents first and require an explanation from the site.' });
    }
  });

  agentKPIs.filter((agent) => agent.breakPct > KPI_RULES.breakCritical || agent.offlinePct > KPI_RULES.offlineRisk || agent.utilization < KPI_RULES.utilizationCritical).slice(0, 20).forEach((agent) => {
    flags.push({ title: `Agent-level risk: ${agent.agent}`, site: agent.callCenter, severity: agent.utilization < KPI_RULES.utilizationCritical ? 'High' : 'Medium', meaning: `${agent.agent} has ${percent(agent.utilization)} utilization, ${percent(agent.breakPct)} Break, and ${percent(agent.offlinePct)} Offline.`, action: 'Review individual adherence, coaching notes, and status behavior.' });
  });

  return flags;
}

export function buildRecommendations(siteKPIs, flags) {
  const recommendations = [
    { title: 'Validate Tableau export completeness', detail: 'Confirm whether the newest report date is a full production day. Same-day partial exports can make utilization look artificially weak.' },
    { title: 'Compare staffing to call arrival volume', detail: 'High Available time may be low volume or overstaffing. Review interval staffing before taking vendor action.' },
    { title: 'Audit AUX mapping', detail: 'High Break or Offline time should be validated against the site AUX configuration and schedule adherence rules.' },
  ];

  siteKPIs.forEach((site) => {
    if (site.breakPct > 20) recommendations.push({ title: `${site.callCenter}: Break review`, detail: `Break is elevated at ${site.breakPct.toFixed(1)}%. Ask for AUX reason-code detail and compare paid break policy to actual usage.` });
    if (site.availablePct > 25) recommendations.push({ title: `${site.callCenter}: Staffing review`, detail: `Available time is elevated at ${site.availablePct.toFixed(1)}%. Check if staffing exceeds volume in low-demand intervals.` });
    if (site.zeroOnCallAgents > 0) recommendations.push({ title: `${site.callCenter}: Zero On Call audit`, detail: `${site.zeroOnCallAgents} agent(s) have no On Call time. These should be explained before accepting the report as healthy.` });
  });

  if (flags.some((flag) => flag.severity === 'Critical')) {
    recommendations.unshift({ title: 'Immediate vendor follow-up required', detail: 'Critical utilization or AUX risks were found. Request written explanation from the site and a corrective action plan.' });
  }

  return recommendations;
}

export function buildExecutiveSummary(siteKPIs, totals, flags) {
  if (!siteKPIs.length) return 'Upload Tableau utilization reports to generate an executive operations summary.';
  const best = [...siteKPIs].sort((a, b) => b.utilization - a.utilization)[0];
  const lowest = [...siteKPIs].sort((a, b) => a.utilization - b.utilization)[0];
  const breakRisk = [...siteKPIs].sort((a, b) => b.breakPct - a.breakPct)[0];
  const offlineRisk = [...siteKPIs].sort((a, b) => b.offlinePct - a.offlinePct)[0];
  const availableRisk = [...siteKPIs].sort((a, b) => b.availablePct - a.availablePct)[0];
  const criticalCount = flags.filter((flag) => flag.severity === 'Critical').length;

  return `${best.callCenter} is currently showing the strongest paid-time productivity at ${best.utilization.toFixed(1)}% utilization. ${lowest.callCenter} requires deeper operational review because it has the lowest utilization at ${lowest.utilization.toFixed(1)}%. ${breakRisk.callCenter} has the highest Break exposure at ${breakRisk.breakPct.toFixed(1)}%, which should be validated against AUX mapping and schedule adherence. ${offlineRisk.callCenter} has the highest Offline exposure at ${offlineRisk.offlinePct.toFixed(1)}%, while ${availableRisk.callCenter} has the highest Available time at ${availableRisk.availablePct.toFixed(1)}%, which may indicate overstaffing, low volume, or idle status behavior. Overall, the uploaded reports include ${totals.callCenterCount} call center(s), ${totals.agentCount} agent(s), and ${totals.loggedHours.toFixed(1)} logged hours. ${criticalCount ? `${criticalCount} critical issue(s) need immediate leadership follow-up.` : 'No critical issues were detected, but vendor-level review should continue by interval.'}`;
}
