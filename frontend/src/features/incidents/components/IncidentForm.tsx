import { FormEvent, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Field, Select, TextArea, TextInput } from "../../../components/ui/Field";
import { IncidentCreateRequest, IncidentType } from "../../../types/incident";
import { incidentTypeOptions } from "../constants";

type IncidentFormProps = {
  onSubmit: (payload: IncidentCreateRequest) => Promise<void>;
  isSubmitting?: boolean;
};

export function IncidentForm({ onSubmit, isSubmitting = false }: IncidentFormProps) {
  const [form, setForm] = useState<IncidentCreateRequest>({
    titulo: "",
    descricao: "",
    tipo_incidente: "OUTRO",
    impacto: 1,
    urgencia: 1,
    envolve_dados_sensiveis: false
  });

  function updateField<K extends keyof IncidentCreateRequest>(field: K, value: IncidentCreateRequest[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <Field label="Titulo">
        <TextInput value={form.titulo} onChange={(event) => updateField("titulo", event.target.value)} required />
      </Field>

      <Field label="Descricao">
        <TextArea
          value={form.descricao}
          onChange={(event) => updateField("descricao", event.target.value)}
          rows={5}
          required
        />
      </Field>

      <Field label="Tipo de incidente">
        <Select
          value={form.tipo_incidente}
          onChange={(event) => updateField("tipo_incidente", event.target.value as IncidentType)}
        >
          {incidentTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="two-columns">
        <Field label="Impacto">
          <TextInput
            min={1}
            max={5}
            type="number"
            value={form.impacto}
            onChange={(event) => updateField("impacto", Number(event.target.value))}
            required
          />
        </Field>

        <Field label="Urgencia">
          <TextInput
            min={1}
            max={5}
            type="number"
            value={form.urgencia}
            onChange={(event) => updateField("urgencia", Number(event.target.value))}
            required
          />
        </Field>
      </div>

      <label className="checkbox-row">
        <input
          checked={form.envolve_dados_sensiveis}
          type="checkbox"
          onChange={(event) => updateField("envolve_dados_sensiveis", event.target.checked)}
        />
        Envolve dados sensiveis
      </label>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Criar incidente"}
      </Button>
    </form>
  );
}
