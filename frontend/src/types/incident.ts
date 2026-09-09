export type IncidentType =
  | "PHISHING"
  | "MALWARE"
  | "ACESSO_INDEVIDO"
  | "VAZAMENTO_DADOS"
  | "FALHA_SISTEMA"
  | "COMPORTAMENTO_SUSPEITO"
  | "OUTRO";

export type IncidentStatus =
  | "ABERTO"
  | "EM_TRIAGEM"
  | "EM_INVESTIGACAO"
  | "CONTIDO"
  | "RESOLVIDO"
  | "FALSO_POSITIVO"
  | "CANCELADO";

export type IncidentSeverity = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type Incident = {
  reportante_nome: string;
  analista_nome: string | null;
  id: number;
  titulo: string;
  descricao: string;
  tipo_incidente: IncidentType;
  criticidade: IncidentSeverity;
  impacto: number;
  urgencia: number;
  envolve_dados_sensiveis: boolean;
  status: IncidentStatus;
  usuario_reportante: number;
  analista_responsavel: number | null;
  data_abertura: string;
  data_atualizacao: string;
  data_fechamento: string | null;
  observacoes_finais: string;
};

export type IncidentCreateRequest = {
  titulo: string;
  descricao: string;
  tipo_incidente: IncidentType;
  impacto: number;
  urgencia: number;
  envolve_dados_sensiveis: boolean;
};

export type IncidentFilters = {
  fila?: 'ativos' | 'meus' | 'nao_atribuidos';
  page?: number;
  search?: string;
  status?: IncidentStatus;
  criticidade?: IncidentSeverity;
  tipo_incidente?: IncidentType;
  envolve_dados_sensiveis?: boolean;
  data_abertura_inicio?: string;
  data_abertura_fim?: string;
  ordenar_por?: "mais_recentes" | "mais_antigos";
};

export type IncidentComment = {
  id: number;
  incidente: number;
  incidente_titulo: string;
  usuario: number;
  usuario_username: string;
  comentario: string;
  criado_em: string;
};

export type TimelineAction =
  | "INCIDENTE_CRIADO"
  | "STATUS_ALTERADO"
  | "ANALISTA_ATRIBUIDO"
  | "COMENTARIO_ADICIONADO";

export type IncidentTimeline = {
  id: number;
  incidente: number;
  incidente_titulo: string;
  usuario: number | null;
  usuario_username: string | null;
  acao: TimelineAction | string;
  descricao: string;
  valor_anterior: string;
  valor_novo: string;
  criado_em: string;
};

export type IncidentStats = {
  criticos_ativos: number;
  ativos_nao_atribuidos: number;
  por_tipo: Partial<Record<IncidentType, number>>;
  atividade: { data: string; total: number }[];
  prioritarios: Incident[];
  total: number;
  abertos: number;
  encerrados: number;
  nao_atribuidos: number;
  com_dados_sensiveis: number;
  por_status: Partial<Record<IncidentStatus, number>>;
  por_criticidade: Partial<Record<IncidentSeverity, number>>;
  recentes: Incident[];
};
