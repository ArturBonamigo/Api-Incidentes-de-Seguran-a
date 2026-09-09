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
import { loadAllPages } from "./pagination";

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

export async function getIncidentPage(filters: IncidentFilters = {}) {
  const response = await apiRequest<ListResponse<Incident>>(`/incidentes/?${toSearchParams(filters)}`);
  return Array.isArray(response)
    ? { count: response.length, results: response, next: null, previous: null }
    : response;
}

export async function exportIncidents(filters: IncidentFilters) {
  const rows: Incident[] = [];
  let page = 1;
  let more = true;
  while (more) {
    const response = await getIncidentPage({ ...filters, page });
    rows.push(...response.results);
    more = Boolean(response.next);
    page += 1;
  }
  return rows;
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
  return loadAllPages<IncidentComment>(
    `/incidentes/${id}/comentarios/`
  );
}

export function createIncidentComment(id: number, comentario: string) {
  return apiRequest<IncidentComment>(`/incidentes/${id}/comentarios/`, {
    method: "POST",
    body: { comentario }
  });
}
