import { FormEvent, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Field, Select, TextInput } from "../../../components/ui/Field";
import { IncidentFilters as IncidentFiltersType } from "../../../types/incident";
import { incidentTypeOptions, severityOptions, statusOptions } from "../constants";

type IncidentFiltersProps = {
  onApply: (filters: IncidentFiltersType) => void;
};

export function IncidentFilters({ onApply }: IncidentFiltersProps) {
  const [filters, setFilters] = useState<IncidentFiltersType>({
    ordenar_por: "mais_recentes"
  });

  function updateFilter(name: keyof IncidentFiltersType, value: string | boolean) {
    setFilters((current) => ({
      ...current,
      [name]: value === "" ? undefined : value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(filters);
  }

  return (
    <form className="filters" onSubmit={handleSubmit}>
      <Field label="Busca">
        <TextInput
          placeholder="Titulo, descricao ou usuario"
          value={filters.search ?? ""}
          onChange={(event) => updateFilter("search", event.target.value)}
        />
      </Field>

      <Field label="Status">
        <Select value={filters.status ?? ""} onChange={(event) => updateFilter("status", event.target.value)}>
          <option value="">Todos</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Criticidade">
        <Select
          value={filters.criticidade ?? ""}
          onChange={(event) => updateFilter("criticidade", event.target.value)}
        >
          <option value="">Todas</option>
          {severityOptions.map((severity) => (
            <option key={severity.value} value={severity.value}>
              {severity.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Tipo">
        <Select
          value={filters.tipo_incidente ?? ""}
          onChange={(event) => updateFilter("tipo_incidente", event.target.value)}
        >
          <option value="">Todos</option>
          {incidentTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Dados sensiveis">
        <Select
          value={
            filters.envolve_dados_sensiveis === undefined
              ? ""
              : String(filters.envolve_dados_sensiveis)
          }
          onChange={(event) => {
            const value = event.target.value;
            updateFilter(
              "envolve_dados_sensiveis",
              value === "" ? "" : value === "true"
            );
          }}
        >
          <option value="">Todos</option>
          <option value="true">Sim</option>
          <option value="false">Nao</option>
        </Select>
      </Field>

      <Field label="Ordenacao">
        <Select
          value={filters.ordenar_por ?? "mais_recentes"}
          onChange={(event) => updateFilter("ordenar_por", event.target.value)}
        >
          <option value="mais_recentes">Mais recentes</option>
          <option value="mais_antigos">Mais antigos</option>
        </Select>
      </Field>

      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  );
}
