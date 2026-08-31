import { IncidentStatus } from "../../../types/incident";
import { statusLabels } from "../constants";

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{statusLabels[status]}</span>;
}
