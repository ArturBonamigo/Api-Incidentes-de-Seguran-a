import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ellipsis, Plus } from "lucide-react";

import * as incidentsApi from "../../../api/incidents.api";
import { ApiError } from "../../../types/api";
import { Incident, IncidentFilters as IncidentFiltersType } from "../../../types/incident";
import { formatDateTime } from "../../../utils/format";
import { incidentTypeLabels } from "../constants";
import { IncidentFilters } from "../components/IncidentFilters";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatusBadge } from "../components/StatusBadge";

export function IncidentListPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filters, setFilters] = useState<IncidentFiltersType>({ ordenar_por: "mais_recentes" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadIncidents() {
      setIsLoading(true);
      setError("");

      try {
        const data = await incidentsApi.listIncidents(filters);
        setIncidents(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar incidentes.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadIncidents();
  }, [filters]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operacao SOC</p>
          <h1>Incidentes</h1>
        </div>
        <Link className="button button-primary" to="/incidentes/novo">
          <Plus size={16} aria-hidden="true" />
          Novo incidente
        </Link>
      </div>

      <div className="summary-strip">
        <span>{incidents.length} incidentes carregados</span>
        <span>{incidents.filter((incident) => incident.envolve_dados_sensiveis).length} com dados sensiveis</span>
        <span>{incidents.filter((incident) => incident.analista_responsavel === null).length} sem analista</span>
      </div>

      <IncidentFilters onApply={setFilters} />

      {error ? <p className="form-error">{error}</p> : null}
      {isLoading ? <p className="screen-message">Carregando incidentes...</p> : null}

      {!isLoading && !incidents.length ? (
        <p className="screen-message">Nenhum incidente encontrado.</p>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Titulo</th>
              <th>Status</th>
              <th>Criticidade</th>
              <th>Abertura</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td>
                  <strong>{incident.titulo}</strong>
                  <span>{incidentTypeLabels[incident.tipo_incidente]}</span>
                </td>
                <td>
                  <StatusBadge status={incident.status} />
                </td>
                <td>
                  <SeverityBadge severity={incident.criticidade} />
                </td>
                <td>{formatDateTime(incident.data_abertura)}</td>
                <td>
                  <Link className="table-action" to={`/incidentes/${incident.id}`} aria-label={`Abrir ${incident.titulo}`}>
                    <Ellipsis size={18} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
