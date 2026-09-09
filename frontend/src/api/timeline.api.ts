import { IncidentTimeline } from "../types/incident";
import { loadAllPages } from "./pagination";

export async function listIncidentTimeline(incidentId: number) {
  return loadAllPages<IncidentTimeline>(
    `/incidentes/${incidentId}/timeline/`
  );
}
