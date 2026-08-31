import { useState } from "react";
import { useNavigate } from "react-router-dom";

import * as incidentsApi from "../../../api/incidents.api";
import { ApiError } from "../../../types/api";
import { IncidentCreateRequest } from "../../../types/incident";
import { IncidentForm } from "../components/IncidentForm";

export function NewIncidentPage() {
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

  return (
    <section className="page-stack narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Registro</p>
          <h1>Novo incidente</h1>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      <IncidentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </section>
  );
}
