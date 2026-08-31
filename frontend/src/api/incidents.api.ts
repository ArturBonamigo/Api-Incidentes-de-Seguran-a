import {
  PaginatedResponse,
} from "../types/api";
import {
  Incident,
  IncidentComment,
  IncidentCreateRequest,
  IncidentFilters,
  IncidentStats,
  IncidentStatus
} from "../types/incident";
import { apiRequest } from "./httpClient";

type ListResponse<T> = T[] | PaginatedResponse<T>;

function normalizeList<T>(response: ListResponse<T>) {
  return Array.isArray(response) ? response : response.results;
}

function toSearchParams(filters: IncidentFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function listIncidents(filters?: IncidentFilters) {
  const query = toSearchParams(filters);
  const response = await apiRequest<ListResponse<Incident>>(
    `/incidentes/${query ? `?${query}` : ""}`
  );
  return normalizeList(response);
}

export function getIncident(id: number) {
  return apiRequest<Incident>(`/incidentes/${id}/`);
}

export function getIncidentStats() {
  return apiRequest<IncidentStats>("/incidentes/estatisticas/");
}

export function createIncident(payload: IncidentCreateRequest) {
  return apiRequest<Incident>("/incidentes/", {
    method: "POST",
    body: payload
  });
}

export function updateIncident(id: number, payload: Partial<Incident>) {
  return apiRequest<Incident>(`/incidentes/${id}/`, {
    method: "PATCH",
    body: payload
  });
}

export function assignIncident(id: number) {
  return apiRequest<Incident>(`/incidentes/${id}/assumir/`, {
    method: "POST"
  });
}

export function changeIncidentStatus(id: number, status: IncidentStatus) {
  return apiRequest<Incident>(`/incidentes/${id}/alterar-status/`, {
    method: "POST",
    body: { status }
  });
}

export async function listIncidentComments(id: number) {
  const response = await apiRequest<ListResponse<IncidentComment>>(
    `/incidentes/${id}/comentarios/`
  );
  return normalizeList(response);
}

export function createIncidentComment(id: number, comentario: string) {
  return apiRequest<IncidentComment>(`/incidentes/${id}/comentarios/`, {
    method: "POST",
    body: { comentario }
  });
}
