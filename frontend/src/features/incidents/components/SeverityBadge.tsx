import { IncidentSeverity } from "../../../types/incident";
import { severityLabels } from "../constants";

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return <span className={`badge severity-${severity.toLowerCase()}`}>{severityLabels[severity]}</span>;
}
