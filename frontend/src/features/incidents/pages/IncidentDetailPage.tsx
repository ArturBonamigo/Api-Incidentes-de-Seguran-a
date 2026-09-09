import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as incidentsApi from "../../../api/incidents.api";
import * as timelineApi from "../../../api/timeline.api";
import { useAuth } from "../../../auth/useAuth";
import { Button } from "../../../components/ui/Button";
import { Field, Select, TextArea } from "../../../components/ui/Field";
import { ApiError } from "../../../types/api";
import {
  Incident,
  IncidentComment,
  IncidentTimeline,
} from "../../../types/incident";
import { formatDateTime } from "../../../utils/format";
import { incidentTypeLabels, statusOptions } from "../constants";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatusBadge } from "../components/StatusBadge";

export function IncidentDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const incidentId = Number(params.id);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [timeline, setTimeline] = useState<IncidentTimeline[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const canEditStatus =
    user?.perfil === "ADMIN" ||
    user?.perfil === "ANALISTA_SOC" ||
    user?.perfil === "GESTOR";
  const canAssignIncident =
    user?.perfil === "ADMIN" || user?.perfil === "ANALISTA_SOC";
  const canComment = user?.perfil !== "AUDITOR";

  useEffect(() => {
    async function loadDetail() {
      if (!incidentId) {
        setError("Incidente invalido.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [incidentData, commentsData, timelineData] = await Promise.all([
          incidentsApi.getIncident(incidentId),
          incidentsApi.listIncidentComments(incidentId),
          timelineApi.listIncidentTimeline(incidentId),
        ]);
        setIncident(incidentData);
        setComments(commentsData);
        setTimeline(timelineData);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Nao foi possivel carregar o incidente.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [incidentId]);

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    setCommentError("");
    setIsSendingComment(true);

    try {
      const createdComment = await incidentsApi.createIncidentComment(
        incidentId,
        comment,
      );
      setComments((current) => [...current, createdComment]);
      setComment("");
      try {
        setTimeline(await timelineApi.listIncidentTimeline(incidentId));
      } catch {
        setCommentError(
          "Comentário salvo. Recarregue a página para atualizar o histórico.",
        );
      }
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : "Nao foi possivel comentar.",
      );
    } finally {
      setIsSendingComment(false);
    }
  }

  async function handleStatusChange(status: Incident["status"]) {
    if (!incident || status === incident.status) {
      return;
    }

    setStatusError("");
    setIsUpdatingStatus(true);

    try {
      const updatedIncident = await incidentsApi.changeIncidentStatus(
        incident.id,
        status,
      );
      setIncident(updatedIncident);
      try {
        setTimeline(await timelineApi.listIncidentTimeline(incident.id));
      } catch {
        setStatusError(
          "Status salvo. Recarregue a página para atualizar o histórico.",
        );
      }
    } catch (err) {
      setStatusError(
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel alterar o status.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleAssign() {
    if (!incident) {
      return;
    }

    setStatusError("");
    setIsAssigning(true);

    try {
      const updatedIncident = await incidentsApi.assignIncident(incident.id);
      setIncident(updatedIncident);
      try {
        setTimeline(await timelineApi.listIncidentTimeline(incident.id));
      } catch {
        setStatusError(
          "Responsável salvo. Recarregue a página para atualizar o histórico.",
        );
      }
    } catch (err) {
      setStatusError(
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel assumir o incidente.",
      );
    } finally {
      setIsAssigning(false);
    }
  }

  if (isLoading) {
    return <p className="screen-message">Carregando incidente...</p>;
  }

  if (error || !incident) {
    return <p className="form-error">{error || "Incidente nao encontrado."}</p>;
  }

  return (
    <section className="page-stack">
      <Link className="detail-back" to="/incidentes">
        ← Voltar para incidentes
      </Link>
      <div className="page-header">
        <div>
          <p className="eyebrow">Incidente #{incident.id}</p>
          <h1>{incident.titulo}</h1>
        </div>
        <div className="badge-row">
          <StatusBadge status={incident.status} />
          <SeverityBadge severity={incident.criticidade} />
        </div>
      </div>

      <div className="action-strip">
        {canAssignIncident && incident.analista_responsavel === null ? (
          <Button type="button" onClick={handleAssign} disabled={isAssigning}>
            {isAssigning ? "Assumindo..." : "Assumir incidente"}
          </Button>
        ) : null}
        <span>
          Reportado por{" "}
          {incident.reportante_nome || `#${incident.usuario_reportante}`}
        </span>
        <span>Responsável: {incident.analista_nome || "não atribuído"}</span>
      </div>

      <div className="detail-grid">
        <article className="panel">
          <h2>Resumo</h2>
          <p className="detail-description">{incident.descricao}</p>
          {canEditStatus ? (
            <div className="status-editor">
              <Field label="Status">
                <Select
                  disabled={isUpdatingStatus}
                  value={incident.status}
                  onChange={(event) =>
                    handleStatusChange(event.target.value as Incident["status"])
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {statusError ? <p className="form-error">{statusError}</p> : null}
            </div>
          ) : null}
          <dl className="metadata-list">
            <div>
              <dt>Tipo</dt>
              <dd>{incidentTypeLabels[incident.tipo_incidente]}</dd>
            </div>
            <div>
              <dt>Impacto</dt>
              <dd>{incident.impacto}</dd>
            </div>
            <div>
              <dt>Urgência</dt>
              <dd>{incident.urgencia}</dd>
            </div>
            <div>
              <dt>Dados sensíveis</dt>
              <dd>{incident.envolve_dados_sensiveis ? "Sim" : "Não"}</dd>
            </div>
            <div>
              <dt>Abertura</dt>
              <dd>{formatDateTime(incident.data_abertura)}</dd>
            </div>
            <div>
              <dt>Última atualização</dt>
              <dd>{formatDateTime(incident.data_atualizacao)}</dd>
            </div>
            {incident.data_fechamento && (
              <div>
                <dt>Fechamento</dt>
                <dd>{formatDateTime(incident.data_fechamento)}</dd>
              </div>
            )}
          </dl>
        </article>

        <aside className="panel">
          <h2>Histórico da investigação</h2>
          <ol className="timeline">
            {timeline.map((item) => (
              <li key={item.id}>
                <strong>{item.descricao}</strong>
                <span>{formatDateTime(item.criado_em)}</span>
              </li>
            ))}
          </ol>
          {!timeline.length && (
            <p className="muted">Nenhum evento registrado.</p>
          )}
        </aside>
      </div>

      <section className="panel">
        <h2>Notas da investigação · {comments.length}</h2>
        {!comments.length && (
          <p className="panel-description">
            Registre evidências, decisões e próximos passos para manter a equipe
            alinhada.
          </p>
        )}
        <div className="comment-list">
          {comments.map((item) => (
            <article key={item.id} className="comment">
              <strong>{item.usuario_username}</strong>
              <p>{item.comentario}</p>
              <span>{formatDateTime(item.criado_em)}</span>
            </article>
          ))}
        </div>

        <form className="comment-form" onSubmit={handleCommentSubmit}>
          {commentError ? <p className="form-error">{commentError}</p> : null}
          {canComment ? (
            <>
              <TextArea
                aria-label="Nova nota da investigação"
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Compartilhe uma evidência, atualização ou próximo passo…"
              />
              <Button
                type="submit"
                disabled={isSendingComment || !comment.trim()}
              >
                {isSendingComment ? "Enviando..." : "Comentar"}
              </Button>
            </>
          ) : (
            <p className="screen-message">
              Auditores possuem acesso somente leitura.
            </p>
          )}
        </form>
      </section>
    </section>
  );
}
