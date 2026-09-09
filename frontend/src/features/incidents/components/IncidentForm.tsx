import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { SeverityBadge } from "./SeverityBadge";

import { Button } from "../../../components/ui/Button";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "../../../components/ui/Field";
import { IncidentCreateRequest, IncidentType } from "../../../types/incident";
import { incidentTypeOptions } from "../constants";

type IncidentFormProps = {
  onSubmit: (payload: IncidentCreateRequest) => Promise<void>;
  isSubmitting?: boolean;
};

export function IncidentForm({
  onSubmit,
  isSubmitting = false,
}: IncidentFormProps) {
  const [form, setForm] = useState<IncidentCreateRequest>({
    titulo: "",
    descricao: "",
    tipo_incidente: "OUTRO",
    impacto: 1,
    urgencia: 1,
    envolve_dados_sensiveis: false,
  });

  function updateField<K extends keyof IncidentCreateRequest>(
    field: K,
    value: IncidentCreateRequest[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim()) return;
    await onSubmit({
      ...form,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
    });
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <h2 className="form-section-title">
        <span>01</span> O que aconteceu?
      </h2>
      <Field label="Título do incidente">
        <TextInput
          maxLength={150}
          placeholder="Ex.: E-mail suspeito solicitando credenciais"
          value={form.titulo}
          onChange={(event) => updateField("titulo", event.target.value)}
          required
        />
      </Field>

      <Field label="Descrição e contexto">
        <TextArea
          value={form.descricao}
          onChange={(event) => updateField("descricao", event.target.value)}
          rows={5}
          placeholder="Descreva o que foi observado, os sistemas afetados, quando aconteceu e as ações já realizadas."
          required
        />
      </Field>

      <Field label="Tipo de incidente">
        <Select
          value={form.tipo_incidente}
          onChange={(event) =>
            updateField("tipo_incidente", event.target.value as IncidentType)
          }
        >
          {incidentTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </Field>

      <h2 className="form-section-title">
        <span>02</span> Qual é a dimensão do incidente?
      </h2>
      <p className="field-hint">
        Use uma escala de 1 (baixo) a 5 (muito alto). Impacto representa a
        extensão do dano; urgência, a rapidez necessária na resposta.
      </p>
      <div className="two-columns">
        <Field label="Impacto">
          <TextInput
            min={1}
            max={5}
            type="number"
            value={form.impacto}
            onChange={(event) =>
              updateField("impacto", Number(event.target.value))
            }
            required
          />
        </Field>

        <Field label="Urgência">
          <TextInput
            min={1}
            max={5}
            type="number"
            value={form.urgencia}
            onChange={(event) =>
              updateField("urgencia", Number(event.target.value))
            }
            required
          />
        </Field>
      </div>

      <label className="checkbox-row">
        <input
          checked={form.envolve_dados_sensiveis}
          type="checkbox"
          onChange={(event) =>
            updateField("envolve_dados_sensiveis", event.target.checked)
          }
        />
        Envolve dados sensíveis
      </label>

      <div className="severity-preview" aria-live="polite">
        <div>
          <strong>Criticidade calculada automaticamente</strong>
          <p>
            Impacto + urgência
            {form.envolve_dados_sensiveis
              ? " + 2 pontos por dados sensíveis"
              : ""}
            . A classificação será confirmada ao salvar.
          </p>
        </div>
        <SeverityBadge
          severity={
            form.impacto +
              form.urgencia +
              (form.envolve_dados_sensiveis ? 2 : 0) <=
            3
              ? "BAIXA"
              : form.impacto +
                    form.urgencia +
                    (form.envolve_dados_sensiveis ? 2 : 0) <=
                  6
                ? "MEDIA"
                : form.impacto +
                      form.urgencia +
                      (form.envolve_dados_sensiveis ? 2 : 0) <=
                    9
                  ? "ALTA"
                  : "CRITICA"
          }
        />
      </div>
      <div className="form-actions">
        <Link className="button button-secondary" to="/incidentes">
          Cancelar
        </Link>
        <Button
          type="submit"
          disabled={
            isSubmitting || !form.titulo.trim() || !form.descricao.trim()
          }
        >
          {isSubmitting ? "Salvando..." : "Criar incidente"}
        </Button>
      </div>
    </form>
  );
}
