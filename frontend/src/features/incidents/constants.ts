import { IncidentSeverity, IncidentStatus, IncidentType } from "../../types/incident";

export const incidentTypeLabels: Record<IncidentType, string> = {
  PHISHING: "Phishing",
  MALWARE: "Malware",
  ACESSO_INDEVIDO: "Acesso indevido",
  VAZAMENTO_DADOS: "Vazamento de dados",
  FALHA_SISTEMA: "Falha de sistema",
  COMPORTAMENTO_SUSPEITO: "Comportamento suspeito",
  OUTRO: "Outro"
};

export const statusLabels: Record<IncidentStatus, string> = {
  ABERTO: "Aberto",
  EM_TRIAGEM: "Em triagem",
  EM_INVESTIGACAO: "Em investigação",
  CONTIDO: "Contido",
  RESOLVIDO: "Resolvido",
  FALSO_POSITIVO: "Falso positivo",
  CANCELADO: "Cancelado"
};

export const severityLabels: Record<IncidentSeverity, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica"
};

export const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
  value: value as IncidentStatus,
  label
}));

export const severityOptions = Object.entries(severityLabels).map(([value, label]) => ({
  value: value as IncidentSeverity,
  label
}));

export const incidentTypeOptions = Object.entries(incidentTypeLabels).map(([value, label]) => ({
  value: value as IncidentType,
  label
}));
