import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Kanban,
  List,
  Plus,
  RefreshCw,
  SearchX,
  Shield,
} from "lucide-react";
import * as api from "../../../api/incidents.api";
import { useAuth } from "../../../auth/useAuth";
import { PaginatedResponse } from "../../../types/api";
import {
  Incident,
  IncidentFilters as Filters,
  IncidentStatus,
} from "../../../types/incident";
import { formatDateTime } from "../../../utils/format";
import { incidentTypeLabels, severityLabels, statusLabels } from "../constants";
import { IncidentFilters } from "../components/IncidentFilters";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatusBadge } from "../components/StatusBadge";
const columns: { label: string; statuses: IncidentStatus[] }[] = [
  { label: "Entrada", statuses: ["ABERTO", "EM_TRIAGEM"] },
  { label: "Investigação", statuses: ["EM_INVESTIGACAO"] },
  { label: "Contenção", statuses: ["CONTIDO"] },
  {
    label: "Encerrados",
    statuses: ["RESOLVIDO", "FALSO_POSITIVO", "CANCELADO"],
  },
];
export function IncidentListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const filters = Object.fromEntries(params) as unknown as Filters;
  if (params.has("envolve_dados_sensiveis"))
    filters.envolve_dados_sensiveis =
      params.get("envolve_dados_sensiveis") === "true";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [result, setResult] = useState<PaginatedResponse<Incident>>({
    results: [],
    count: 0,
    next: null,
    previous: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const board = params.get("view") === "quadro";
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setNotice("");
    const parsed = Object.fromEntries(new URLSearchParams(query));
    api
      .getIncidentPage(parsed as unknown as Filters)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active)
          setError(err.message || "Não foi possível carregar os incidentes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, revision]);
  function apply(next: Filters) {
    const search = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && key !== "page")
        search.set(key, String(value));
    });
    if (board) search.set("view", "quadro");
    setParams(search);
  }
  function changePage(next: number) {
    const search = new URLSearchParams(params);
    search.set("page", String(next));
    setParams(search);
  }
  async function download() {
    setExporting(true);
    setError("");
    try {
      const rows = await api.exportIncidents(filters);
      const cell = (value: unknown) => {
        let text = String(value ?? "");
        if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
        return '"' + text.replaceAll('"', '""') + '"';
      };
      const values = [
        [
          "ID",
          "Título",
          "Tipo",
          "Criticidade",
          "Status",
          "Responsável",
          "Dados sensíveis",
          "Abertura",
          "Fechamento",
        ],
        ...rows.map((i) => [
          i.id,
          i.titulo,
          incidentTypeLabels[i.tipo_incidente],
          severityLabels[i.criticidade],
          statusLabels[i.status],
          i.analista_nome || "",
          i.envolve_dados_sensiveis ? "Sim" : "Não",
          i.data_abertura,
          i.data_fechamento,
        ]),
      ];
      const url = URL.createObjectURL(
        new Blob(
          [
            "\uFEFF" +
              values.map((row) => row.map(cell).join(";")).join("\r\n"),
          ],
          { type: "text/csv;charset=utf-8" },
        ),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sentinel-incidentes-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        `${rows.length} incidentes exportados com os filtros selecionados.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao exportar.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">OPERAÇÃO SOC</p>
          <h1>
            Incidentes<span className="heading-dot">.</span>
          </h1>
          <p>
            Do primeiro sinal à resolução. Toda a investigação em um só lugar.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="button button-secondary"
            disabled={exporting || loading || Boolean(error) || !result.count}
            onClick={download}
          >
            <Download size={16} />
            {exporting ? "Exportando…" : "Exportar CSV"}
          </button>
          {user?.perfil !== "AUDITOR" && (
            <Link className="button button-primary" to="/incidentes/novo">
              <Plus size={16} /> Novo incidente
            </Link>
          )}
        </div>
      </div>
      <div className="list-toolbar">
        <div className="queue-tabs">
          {[
            { key: "", label: "Todos os incidentes" },
            { key: "ativos", label: "Em andamento" },
            { key: "meus", label: "Meus incidentes" },
            { key: "nao_atribuidos", label: "Sem responsável" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={String(filters.fila ?? "") === tab.key ? "active" : ""}
              onClick={() =>
                apply({ ...filters, fila: tab.key as Filters["fila"] })
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            aria-label="Visualização em lista"
            aria-pressed={!board}
            className={!board ? "active" : ""}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete("view");
              setParams(next);
            }}
          >
            <List size={17} />
          </button>
          <button
            aria-label="Visualização em quadro"
            aria-pressed={board}
            className={board ? "active" : ""}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("view", "quadro");
              setParams(next);
            }}
          >
            <Kanban size={17} />
          </button>
        </div>
      </div>
      <IncidentFilters key={query} initial={filters} onApply={apply} />
      {error && (
        <div className="form-error" role="alert">
          {error}{" "}
          <button
            className="button button-ghost"
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      )}
      {notice && (
        <p className="form-success" role="status">
          {notice}
        </p>
      )}
      {loading ? (
        <div className="loading-state">
          <RefreshCw size={20} className="spinning" />
          Carregando incidentes…
        </div>
      ) : (
        !error && (
          <>
            {!result.results.length ? (
              <div className="panel empty-state">
                <SearchX size={36} />
                <h2>Nenhum incidente encontrado</h2>
                <p>Experimente outros filtros ou registre um novo incidente.</p>
                <button
                  className="button button-secondary"
                  onClick={() => apply({})}
                >
                  Limpar filtros
                </button>
              </div>
            ) : board ? (
              <>
                <p className="muted">
                  Quadro dos registros desta página. Abra um cartão para
                  acompanhar ou alterar o status.
                </p>
                <div className="kanban-board">
                  {columns.map((column) => (
                    <section className="kanban-column" key={column.label}>
                      <h2>
                        <span className="column-dot" />
                        {column.label}
                        <span>
                          {
                            result.results.filter((i) =>
                              column.statuses.includes(i.status),
                            ).length
                          }
                        </span>
                      </h2>
                      {result.results
                        .filter((i) => column.statuses.includes(i.status))
                        .map((i) => (
                          <Link
                            className="kanban-card"
                            to={`/incidentes/${i.id}`}
                            key={i.id}
                          >
                            <div className="section-header">
                              <span className="mono">
                                INC-{String(i.id).padStart(4, "0")}
                              </span>
                              <SeverityBadge severity={i.criticidade} />
                            </div>
                            <h3>{i.titulo}</h3>
                            <p>{incidentTypeLabels[i.tipo_incidente]}</p>
                            <StatusBadge status={i.status} />
                            <footer>
                              <span>
                                {i.analista_nome || "Sem responsável"}
                              </span>
                              <ArrowUpRight size={16} />
                            </footer>
                          </Link>
                        ))}
                      {!result.results.some((i) =>
                        column.statuses.includes(i.status),
                      ) && (
                        <p className="column-empty">
                          Nenhum incidente nesta etapa
                        </p>
                      )}
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Incidente</th>
                      <th>Criticidade</th>
                      <th>Status</th>
                      <th>Responsável</th>
                      <th>Abertura</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((i) => (
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
                            {incidentTypeLabels[i.tipo_incidente]}{" "}
                            {i.envolve_dados_sensiveis && (
                              <Shield
                                size={12}
                                aria-label="Envolve dados sensíveis"
                              />
                            )}
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
                        <td className="date-cell">
                          {formatDateTime(i.data_abertura)}
                        </td>
                        <td>
                          <Link
                            className="table-action"
                            to={`/incidentes/${i.id}`}
                            aria-label={`Abrir ${i.titulo}`}
                          >
                            <ArrowUpRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pagination">
              <span>
                {result.count} resultado{result.count === 1 ? "" : "s"} ·{" "}
                {result.results.length} nesta página
              </span>
              <div>
                <button
                  className="button button-secondary"
                  disabled={!result.previous}
                  onClick={() => changePage(page - 1)}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span>Página {page}</span>
                <button
                  className="button button-secondary"
                  disabled={!result.next}
                  onClick={() => changePage(page + 1)}
                >
                  Próxima
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )
      )}
    </section>
  );
}
