import { FormEvent, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Field, Select, TextInput } from "../../../components/ui/Field";
import { IncidentFilters as Filters } from "../../../types/incident";
import {
  incidentTypeOptions,
  severityOptions,
  statusOptions,
} from "../constants";
export function IncidentFilters({
  initial,
  onApply,
}: {
  initial: Filters;
  onApply: (filters: Filters) => void;
}) {
  const [filters, setFilters] = useState(initial);
  const [expanded, setExpanded] = useState(
    Boolean(
      initial.data_abertura_inicio ||
      initial.data_abertura_fim ||
      initial.tipo_incidente ||
      initial.envolve_dados_sensiveis !== undefined,
    ),
  );
  function update(name: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [name]: value || undefined }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    onApply(filters);
  }
  return (
    <form className="filter-panel" onSubmit={submit}>
      <div className="filters">
        <Field label="Buscar">
          <div className="input-icon">
            <Search size={16} />
            <TextInput
              placeholder="Título, descrição ou usuário"
              value={filters.search ?? ""}
              onChange={(e) => update("search", e.target.value)}
            />
          </div>
        </Field>
        <Field label="Status">
          <Select
            value={filters.status ?? ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">Todos os status</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Criticidade">
          <Select
            value={filters.criticidade ?? ""}
            onChange={(e) => update("criticidade", e.target.value)}
          >
            <option value="">Todas</option>
            {severityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <button
          className="button button-secondary"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={16} /> Mais filtros
        </button>
        <button className="button button-primary" type="submit">
          Aplicar
        </button>
        <button
          className="icon-button"
          title="Limpar filtros"
          aria-label="Limpar filtros"
          type="button"
          onClick={() => {
            setFilters({});
            onApply({});
          }}
        >
          <X size={17} />
        </button>
      </div>
      {expanded && (
        <div className="advanced-filters">
          <Field label="Tipo de incidente">
            <Select
              value={filters.tipo_incidente ?? ""}
              onChange={(e) => update("tipo_incidente", e.target.value)}
            >
              <option value="">Todos os tipos</option>
              {incidentTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dados sensíveis">
            <Select
              value={
                filters.envolve_dados_sensiveis === undefined
                  ? ""
                  : String(filters.envolve_dados_sensiveis)
              }
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  envolve_dados_sensiveis:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                }))
              }
            >
              <option value="">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </Field>
          <Field label="Abertura a partir de (UTC)">
            <TextInput
              type="date"
              value={filters.data_abertura_inicio ?? ""}
              max={filters.data_abertura_fim}
              onChange={(e) => update("data_abertura_inicio", e.target.value)}
            />
          </Field>
          <Field label="Abertura até (UTC)">
            <TextInput
              type="date"
              value={filters.data_abertura_fim ?? ""}
              min={filters.data_abertura_inicio}
              onChange={(e) => update("data_abertura_fim", e.target.value)}
            />
          </Field>
          <Field label="Ordenação">
            <Select
              value={filters.ordenar_por ?? "mais_recentes"}
              onChange={(e) => update("ordenar_por", e.target.value)}
            >
              <option value="mais_recentes">Mais recentes</option>
              <option value="mais_antigos">Mais antigos</option>
            </Select>
          </Field>
        </div>
      )}
    </form>
  );
}
