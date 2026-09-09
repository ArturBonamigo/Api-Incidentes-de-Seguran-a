import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";

import * as incidentsApi from "../../../api/incidents.api";
import { ApiError } from "../../../types/api";
import { IncidentCreateRequest } from "../../../types/incident";
import { IncidentForm } from "../components/IncidentForm";

export function NewIncidentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload: IncidentCreateRequest) {
    setError("");
    setIsSubmitting(true);

    try {
      const incident = await incidentsApi.createIncident(payload);
      navigate(`/incidentes/${incident.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel criar o incidente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user?.perfil === "AUDITOR") return <p className="screen-message">Auditores possuem acesso somente leitura.</p>;

  return (
    <section className="page-stack narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Registro</p>
          <h1>Novo incidente</h1>
          <p>Registre os fatos. A prioridade é calculada a partir do impacto e da urgência.</p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      <IncidentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </section>
  );
}
