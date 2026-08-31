import { PaginatedResponse } from "../types/api";
import { IncidentTimeline } from "../types/incident";
import { apiRequest } from "./httpClient";

type ListResponse<T> = T[] | PaginatedResponse<T>;

function normalizeList<T>(response: ListResponse<T>) {
  return Array.isArray(response) ? response : response.results;
}

export async function listIncidentTimeline(incidentId: number) {
  const response = await apiRequest<ListResponse<IncidentTimeline>>(
    `/incidentes/${incidentId}/timeline/`
  );
  return normalizeList(response);
}
