import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import * as authApi from "../../../api/auth.api";
import { Button } from "../../../components/ui/Button";
import { Field, TextInput } from "../../../components/ui/Field";
import { ApiError } from "../../../types/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await authApi.register(form);
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cadastrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Nova conta</p>
          <h1>Cadastro</h1>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <Field label="Usuario">
          <TextInput value={form.username} onChange={(event) => updateField("username", event.target.value)} required />
        </Field>

        <Field label="Email">
          <TextInput type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
        </Field>

        <div className="two-columns">
          <Field label="Nome">
            <TextInput value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
          </Field>
          <Field label="Sobrenome">
            <TextInput value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
          </Field>
        </div>

        <Field label="Senha">
          <TextInput
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            required
          />
        </Field>

        <Field label="Confirmar senha">
          <TextInput
            type="password"
            value={form.password_confirm}
            onChange={(event) => updateField("password_confirm", event.target.value)}
            required
          />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
        </Button>

        <p className="muted">
          Ja tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
