import { CSSProperties, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock3, Plus } from "lucide-react";

import * as incidentsApi from "../../../api/incidents.api";
import { ApiError } from "../../../types/api";
import { Incident, IncidentSeverity, IncidentStats } from "../../../types/incident";
import { formatDateTime } from "../../../utils/format";
import { incidentTypeLabels, severityLabels, statusLabels } from "../constants";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatusBadge } from "../components/StatusBadge";

const severityMeta: Array<{
  key: IncidentSeverity;
  label: string;
  className: string;
}> = [
  { key: "CRITICA", label: "Critical", className: "critical" },
  { key: "ALTA", label: "High", className: "high" },
  { key: "MEDIA", label: "Medium", className: "medium" },
  { key: "BAIXA", label: "Low", className: "low" }
];

const sourceByType: Record<Incident["tipo_incidente"], string> = {
  PHISHING: "Email Gateway",
  MALWARE: "EDR",
  ACESSO_INDEVIDO: "SIEM",
  VAZAMENTO_DADOS: "DLP",
  FALHA_SISTEMA: "Infrastructure",
  COMPORTAMENTO_SUSPEITO: "Network Monitor",
  OUTRO: "SOC Console"
};

const activityPoints = [
  "0,88 55,78 110,58 165,66 220,44 275,56 330,34 385,46 440,30 495,48 550,38 605,20 660,33",
  "0,94 55,84 110,70 165,76 220,62 275,70 330,54 385,66 440,52 495,63 550,50 605,36 660,46",
  "0,100 55,92 110,82 165,88 220,76 275,82 330,68 385,76 440,66 495,72 550,62 605,54 660,60",
  "0,106 55,100 110,92 165,96 220,88 275,92 330,84 385,88 440,80 495,86 550,78 605,70 660,76"
];

function formatIncidentCode(id: number) {
  return `INC-2026-${String(id).padStart(4, "0")}`;
}

function getResolvedRate(stats: IncidentStats) {
  return stats.total ? Math.round((stats.encerrados / stats.total) * 1000) / 10 : 0;
}

function getThreatScore(stats: IncidentStats) {
  const critical = stats.por_criticidade.CRITICA ?? 0;
  const high = stats.por_criticidade.ALTA ?? 0;
  const open = stats.abertos;
  const rawScore = stats.total
    ? ((critical * 100 + high * 72 + open * 38) / Math.max(stats.total, 1))
    : 0;

  return Math.min(100, Math.round(rawScore));
}

export function DashboardPage() {
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      setError("");

      try {
        setStats(await incidentsApi.getIncidentStats());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o painel.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadStats();
  }, []);

  const dashboardModel = useMemo(() => {
    if (!stats) {
      return null;
    }

    const critical = stats.por_criticidade.CRITICA ?? 0;
    const high = stats.por_criticidade.ALTA ?? 0;
    const medium = stats.por_criticidade.MEDIA ?? 0;
    const low = stats.por_criticidade.BAIXA ?? 0;
    const resolvedRate = getResolvedRate(stats);
    const threatScore = getThreatScore(stats);
    const totalSeverity = Math.max(critical + high + medium + low, 1);
    const criticalPercent = (critical / totalSeverity) * 100;
    const highPercent = (high / totalSeverity) * 100;
    const mediumPercent = (medium / totalSeverity) * 100;
    const lowPercent = Math.max(0, 100 - criticalPercent - highPercent - mediumPercent);

    return {
      critical,
      high,
      medium,
      low,
      resolvedRate,
      threatScore,
      donutStyle: {
        "--critical": `${criticalPercent}%`,
        "--high": `${criticalPercent + highPercent}%`,
        "--medium": `${criticalPercent + highPercent + mediumPercent}%`
      } as CSSProperties,
      severityRows: [
        { label: "Critical", value: critical, percent: criticalPercent, className: "critical" },
        { label: "High", value: high, percent: highPercent, className: "high" },
        { label: "Medium", value: medium, percent: mediumPercent, className: "medium" },
        { label: "Low", value: low, percent: lowPercent, className: "low" }
      ]
    };
  }, [stats]);

  if (isLoading) {
    return <p className="screen-message">Carregando painel...</p>;
  }

  if (error || !stats || !dashboardModel) {
    return <p className="form-error">{error || "Painel indisponivel."}</p>;
  }

  const primaryIncident = stats.recentes[0];

  return (
    <section className="soc-dashboard">
      <div className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Security Overview</p>
          <h1>Security Overview</h1>
          <span>Real-time insights and security posture</span>
        </div>
        <div className="dashboard-actions">
          <button className="button button-secondary" type="button">
            <CalendarDays size={15} aria-hidden="true" />
            Last 24 Hours
          </button>
          <Link className="button button-primary" to="/incidentes/novo">
            <Plus size={16} aria-hidden="true" />
            New Incident
          </Link>
        </div>
      </div>

      <div className="soc-metric-grid">
        <article className="soc-metric-card metric-purple">
          <div>
            <span>Total Incidents</span>
            <strong>{stats.total.toLocaleString("pt-BR")}</strong>
            <small>{stats.abertos} open investigations</small>
          </div>
          <Sparkline tone="purple" />
        </article>

        <article className="soc-metric-card metric-red">
          <div>
            <span>Critical Alerts</span>
            <strong>{dashboardModel.critical}</strong>
            <small>{dashboardModel.high} high severity signals</small>
          </div>
          <Sparkline tone="red" />
        </article>

        <article className="soc-metric-card metric-blue">
          <div>
            <span>Resolved Rate</span>
            <strong>{dashboardModel.resolvedRate}%</strong>
            <small>{stats.encerrados} incidents closed</small>
          </div>
          <Sparkline tone="blue" />
        </article>

        <article className="soc-metric-card metric-purple">
          <div>
            <span>Threat Score</span>
            <strong>{dashboardModel.threatScore}<em>/100</em></strong>
            <small>{dashboardModel.threatScore >= 70 ? "High Risk" : "Controlled"}</small>
          </div>
          <div className="threat-ring" style={{ "--score": `${dashboardModel.threatScore}%` } as CSSProperties}>
            <span>{dashboardModel.threatScore}</span>
          </div>
        </article>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left">
          <article className="panel activity-panel">
            <div className="section-header">
              <div>
                <h2>Incident Activity Over Time</h2>
                <p className="muted">Severity trend by operating window</p>
              </div>
              <button className="button button-secondary" type="button">
                <Clock3 size={15} aria-hidden="true" />
                Group by: Hour
              </button>
            </div>
            <div className="chart-legend">
              {severityMeta.map((item) => (
                <span className={`legend-dot ${item.className}`} key={item.key}>
                  {item.label}
                </span>
              ))}
            </div>
            <svg className="activity-chart" viewBox="0 0 680 128" role="img" aria-label="Incident activity chart">
              <defs>
                <linearGradient id="criticalArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`M ${activityPoints[0]} L 660,128 L 0,128 Z`} fill="url(#criticalArea)" />
              <polyline className="line critical-line" points={activityPoints[0]} />
              <polyline className="line high-line" points={activityPoints[1]} />
              <polyline className="line medium-line" points={activityPoints[2]} />
              <polyline className="line low-line" points={activityPoints[3]} />
            </svg>
          </article>

          <article className="panel">
            <div className="section-header">
              <h2>Recent Incidents</h2>
              <Link className="inline-action" to="/incidentes">View All <ChevronRight size={15} aria-hidden="true" /></Link>
            </div>

            <div className="table-wrap embedded">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Owner</th>
                    <th>Detected At</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentes.map((incident) => (
                    <tr key={incident.id}>
                      <td className="mono">{formatIncidentCode(incident.id)}</td>
                      <td>
                        <strong>{incident.titulo}</strong>
                        <span>{incidentTypeLabels[incident.tipo_incidente]}</span>
                      </td>
                      <td>
                        <SeverityBadge severity={incident.criticidade} />
                      </td>
                      <td>
                        <StatusBadge status={incident.status} />
                      </td>
                      <td>{sourceByType[incident.tipo_incidente]}</td>
                      <td>{incident.analista_responsavel ? `Analyst #${incident.analista_responsavel}` : "Unassigned"}</td>
                      <td>{formatDateTime(incident.data_abertura)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!stats.recentes.length ? <p className="screen-message">No recent incidents found.</p> : null}
          </article>

          <div className="visual-grid">
            <article className="panel map-panel">
              <h2>Attack Origin Map</h2>
              <div className="map-visual" aria-label="Attack origin map">
                <span className="map-dot dot-us" />
                <span className="map-dot dot-eu" />
                <span className="map-dot dot-cn" />
                <span className="map-dot dot-ru" />
                <span className="map-line line-us" />
                <span className="map-line line-eu" />
                <span className="map-line line-cn" />
                <span className="map-line line-ru" />
              </div>
              <div className="map-list">
                <span><i className="legend-dot critical" /> United States</span>
                <span><i className="legend-dot high" /> Netherlands</span>
                <span><i className="legend-dot medium" /> China</span>
                <span><i className="legend-dot low" /> Russian Federation</span>
              </div>
            </article>

            <article className="panel endpoint-panel">
              <h2>Endpoint Activity Graph</h2>
              <div className="endpoint-graph">
                <div className="endpoint-node endpoint-center">
                  <strong>WS-23-019</strong>
                  <span>Endpoint</span>
                </div>
                <div className="endpoint-node node-a"><strong>WIN-10-44</strong><span>10.0.0.44</span></div>
                <div className="endpoint-node node-b"><strong>SRV-APP-02</strong><span>10.0.1.22</span></div>
                <div className="endpoint-node node-c"><strong>USERSRV-03</strong><span>10.0.1.15</span></div>
                <div className="endpoint-node node-d"><strong>192.168.56.1</strong><span>Gateway</span></div>
                <div className="endpoint-node node-e"><strong>EXTERNAL</strong><span>185.199.108.153</span></div>
              </div>
            </article>
          </div>
        </div>

        <aside className="dashboard-right">
          <article className="panel severity-panel">
            <h2>Threat Severity Distribution</h2>
            <div className="donut-wrap">
              <div className="donut-chart" style={dashboardModel.donutStyle}>
                <span>{stats.total}</span>
                <small>Total</small>
              </div>
              <div className="severity-list">
                {dashboardModel.severityRows.map((row) => (
                  <div key={row.label}>
                    <span><i className={`legend-dot ${row.className}`} /> {row.label}</span>
                    <strong>{row.value} ({Math.round(row.percent)}%)</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel timeline-panel">
            <h2>Investigation Timeline</h2>
            {primaryIncident ? (
              <>
                <div className="timeline-incident-card">
                  <strong>{formatIncidentCode(primaryIncident.id)}</strong>
                  <span>{primaryIncident.titulo}</span>
                  <SeverityBadge severity={primaryIncident.criticidade} />
                </div>
                <ol className="investigation-timeline">
                  {[
                    ["Incident Created", statusLabels[primaryIncident.status]],
                    ["Alert Triggered", sourceByType[primaryIncident.tipo_incidente]],
                    ["IOC Matched", severityLabels[primaryIncident.criticidade]],
                    ["Endpoint Involved", "WS-23-019 detected"],
                    ["Containment Initiated", primaryIncident.envolve_dados_sensiveis ? "Sensitive data path" : "Standard playbook"],
                    ["Investigation Ongoing", "Collecting evidence"]
                  ].map(([title, description], index) => (
                    <li key={title}>
                      <span className="timeline-icon">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{title}</strong>
                        <span>{description}</span>
                      </div>
                      <time>{formatDateTime(primaryIncident.data_atualizacao)}</time>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="screen-message">No active investigation selected.</p>
            )}
          </article>
        </aside>
      </div>
    </section>
  );
}

function Sparkline({ tone }: { tone: "purple" | "red" | "blue" }) {
  return (
    <svg className={`sparkline sparkline-${tone}`} viewBox="0 0 150 58" aria-hidden="true">
      <polyline points="0,48 16,38 28,42 42,20 55,30 70,15 84,26 100,10 116,20 132,6 150,16" />
    </svg>
  );
}
