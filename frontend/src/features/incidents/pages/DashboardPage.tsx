import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  Crosshair,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import * as api from "../../../api/incidents.api";
import { useAuth } from "../../../auth/useAuth";
import { IncidentStats } from "../../../types/incident";
import { formatDateTime } from "../../../utils/format";
import { incidentTypeLabels, severityOptions } from "../constants";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatusBadge } from "../components/StatusBadge";
export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date>();
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .getIncidentStats()
      .then((data) => {
        if (active) {
          setStats(data);
          setUpdated(new Date());
        }
      })
      .catch((err) => {
        if (active)
          setError(err.message || "Não foi possível carregar o painel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const rate = stats?.total
    ? Math.round((stats.encerrados / stats.total) * 100)
    : 0;
  const max = Math.max(1, ...(stats?.atividade.map((d) => d.total) ?? []));
  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-line" /> CENTRAL DE OPERAÇÕES
          </p>
          <h1>
            Visão geral<span className="heading-dot">.</span>
          </h1>
          <p>A informação certa para a sua próxima decisão.</p>
        </div>
        <div className="header-actions">
          <button
            className="button button-secondary"
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw size={15} className={loading ? "spinning" : ""} />{" "}
            Atualizar
          </button>
          {user?.perfil !== "AUDITOR" && (
            <Link className="button button-primary" to="/incidentes/novo">
              <Plus size={16} /> Novo incidente
            </Link>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error} Tente atualizar o painel.
        </p>
      )}
      {loading && !stats && (
        <div className="loading-state">
          <Activity className="spinning" /> Carregando indicadores…
        </div>
      )}
      {stats && (
        <>
          <div className="overview-banner">
            <div className="banner-symbol">
              <Crosshair size={30} />
            </div>
            <div>
              <span className="eyebrow">SEU PANORAMA OPERACIONAL</span>
              <h2>
                {stats.abertos
                  ? `${stats.abertos} incidente${stats.abertos === 1 ? "" : "s"} em acompanhamento`
                  : "Nenhum incidente ativo no momento"}
              </h2>
              <p>
                {stats.ativos_nao_atribuidos
                  ? `${stats.ativos_nao_atribuidos} aguardando um responsável. Organize a resposta pela prioridade.`
                  : "Acompanhe a evolução das investigações e os próximos passos da equipe."}
              </p>
            </div>
            <Link to="/incidentes?fila=ativos">
              Ver fila de trabalho <ArrowUpRight size={18} />
            </Link>
            <div className="banner-decoration" aria-hidden="true" />
          </div>
          <div className="soc-metric-grid">
            <Link to="/incidentes" className="metric-card">
              <div className="metric-top">
                <span>Total de incidentes</span>
                <Activity size={18} />
              </div>
              <strong>{stats.total}</strong>
              <small>
                <span className="metric-neutral">Base completa</span> registros
                visíveis ao seu perfil
              </small>
            </Link>
            <Link
              to="/incidentes?fila=ativos&criticidade=CRITICA"
              className="metric-card"
            >
              <div className="metric-top">
                <span>Críticos em aberto</span>
                <ShieldAlert size={18} className="danger-text" />
              </div>
              <strong>
                {stats.criticos_ativos}
                <span className="metric-indicator danger" />
              </strong>
              <small>
                <span className="danger-text">Prioridade máxima</span> na fila
                de resposta
              </small>
            </Link>
            <Link to="/incidentes?fila=nao_atribuidos" className="metric-card">
              <div className="metric-top">
                <span>Aguardando responsável</span>
                <Users size={18} />
              </div>
              <strong>{stats.ativos_nao_atribuidos}</strong>
              <small>
                <span className="warning-text">Triagem</span> incidentes ativos
                sem analista
              </small>
            </Link>
            <Link to="/incidentes" className="metric-card">
              <div className="metric-top">
                <span>Taxa de encerramento</span>
                <CheckCheck size={18} />
              </div>
              <strong>
                {rate}
                <em>%</em>
              </strong>
              <small>
                <ArrowDownRight size={13} /> {stats.encerrados} resolvidos,
                cancelados ou falsos positivos
              </small>
            </Link>
          </div>
          <div className="dashboard-main-grid">
            <article className="panel activity-panel">
              <div className="section-header">
                <div>
                  <p className="eyebrow">EVOLUÇÃO</p>
                  <h2>Atividade de incidentes</h2>
                </div>
                <span className="subtle-chip">Últimos 14 dias · UTC</span>
              </div>
              <div className="chart-summary">
                <strong>
                  {stats.atividade.reduce((sum, d) => sum + d.total, 0)}
                </strong>
                <span>incidentes registrados no período</span>
                <span className="chart-key">
                  <i /> Registros por dia
                </span>
              </div>
              <div
                className="bar-chart"
                role="img"
                aria-label={stats.atividade
                  .map((d) => `${d.data}: ${d.total} incidentes`)
                  .join("; ")}
              >
                {stats.atividade.map((day, i) => (
                  <div className="bar-column" key={day.data}>
                    <div className="bar-track">
                      <div
                        className={`chart-bar ${i === 13 ? "latest" : ""}`}
                        style={{
                          height: `${(day.total / max) * 100}%`,
                          minHeight: day.total ? 4 : 0,
                        }}
                      >
                        <span>{day.total}</span>
                      </div>
                    </div>
                    <small>
                      {day.data.slice(8)}/{day.data.slice(5, 7)}
                    </small>
                  </div>
                ))}
              </div>
              <p className="chart-note">
                Contagem por data de abertura. Dias sem registros aparecem com
                valor zero.
              </p>
            </article>
            <article className="panel">
              <div className="section-header">
                <div>
                  <p className="eyebrow">CLASSIFICAÇÃO</p>
                  <h2>Distribuição por criticidade</h2>
                </div>
                <ShieldCheck size={19} className="muted" />
              </div>
              <div className="severity-overview">
                <strong>{stats.total}</strong>
                <span>incidentes na base</span>
              </div>
              <div className="distribution-track">
                {[...severityOptions].reverse().map((s) => (
                  <span
                    key={s.value}
                    className={`fill-${s.value.toLowerCase()}`}
                    style={{
                      width: `${stats.total ? ((stats.por_criticidade[s.value] ?? 0) / stats.total) * 100 : 0}%`,
                    }}
                  />
                ))}
              </div>
              <div className="severity-list">
                {[...severityOptions].reverse().map((s) => (
                  <Link key={s.value} to={`/incidentes?criticidade=${s.value}`}>
                    <span>
                      <i
                        className={`severity-dot fill-${s.value.toLowerCase()}`}
                      />
                      {s.label}
                    </span>
                    <strong>
                      {stats.por_criticidade[s.value] ?? 0}
                      <small>
                        {stats.total
                          ? Math.round(
                              ((stats.por_criticidade[s.value] ?? 0) /
                                stats.total) *
                                100,
                            )
                          : 0}
                        %
                      </small>
                    </strong>
                  </Link>
                ))}
              </div>
            </article>
          </div>
          <div className="dashboard-main-grid">
            <article className="panel recent-panel">
              <div className="section-header">
                <div>
                  <p className="eyebrow">ACOMPANHAMENTO</p>
                  <h2>Incidentes recentes</h2>
                </div>
                <Link className="inline-action" to="/incidentes">
                  Ver todos <ChevronRight size={16} />
                </Link>
              </div>
              <div className="table-wrap embedded">
                <table>
                  <thead>
                    <tr>
                      <th>Incidente</th>
                      <th>Criticidade</th>
                      <th>Status</th>
                      <th>Responsável</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentes.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <Link
                            className="incident-title"
                            to={`/incidentes/${i.id}`}
                          >
                            {i.titulo}
                          </Link>
                          <span className="table-subtitle">
                            INC-{String(i.id).padStart(4, "0")} ·{" "}
                            {incidentTypeLabels[i.tipo_incidente]}
                          </span>
                        </td>
                        <td>
                          <SeverityBadge severity={i.criticidade} />
                        </td>
                        <td>
                          <StatusBadge status={i.status} />
                        </td>
                        <td>
                          {i.analista_nome || (
                            <span className="muted">Não atribuído</span>
                          )}
                        </td>
                        <td>
                          <Link
                            className="table-action"
                            aria-label={`Abrir ${i.titulo}`}
                            to={`/incidentes/${i.id}`}
                          >
                            <ArrowUpRight size={17} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!stats.recentes.length && (
                <div className="empty-state">
                  <ShieldCheck size={30} />
                  <h3>Sua central começa aqui</h3>
                  <p>Os incidentes registrados aparecerão nesta visão.</p>
                </div>
              )}
            </article>
            <article className="panel">
              <div className="section-header">
                <div>
                  <p className="eyebrow">PRÓXIMOS PASSOS</p>
                  <h2>Foco da equipe</h2>
                </div>
                <Crosshair size={19} className="muted" />
              </div>
              <p className="panel-description">
                Ativos por criticidade, dos mais antigos aos mais recentes.
              </p>
              <div className="priority-list">
                {stats.prioritarios.map((i, index) => (
                  <Link key={i.id} to={`/incidentes/${i.id}`}>
                    <span className="priority-number">0{index + 1}</span>
                    <div>
                      <strong>{i.titulo}</strong>
                      <small>
                        {i.analista_nome || "Aguardando responsável"}
                      </small>
                    </div>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>
              {!stats.prioritarios.length && (
                <div className="empty-state compact">
                  <CheckCheck size={28} />
                  <p>Nenhuma pendência na fila.</p>
                </div>
              )}
            </article>
          </div>
          <div className="data-footnote">
            <span>
              <span className="system-pulse" /> Dados reais · acesso conforme
              seu perfil
            </span>
            <span>
              Atualizado {updated ? formatDateTime(updated.toISOString()) : ""}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
