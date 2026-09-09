import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/useAuth";
import { Button } from "../../../components/ui/Button";
import { Field, TextInput } from "../../../components/ui/Field";
import { ApiError } from "../../../types/api";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Fingerprint,
  Activity,
  Users,
} from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      const from = (
        location.state as {
          from?: { pathname?: string; search?: string };
        } | null
      )?.from;
      navigate(
        from?.pathname ? from.pathname + (from.search ?? "") : "/dashboard",
        { replace: true },
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Nao foi possivel entrar.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-story">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={30} />
          </span>
          <span>
            sentinel<span className="brand-subtitle">SECURITY OPERATIONS</span>
          </span>
        </div>
        <p className="eyebrow">SUA CENTRAL DE SEGURANÇA</p>
        <h2>
          Transforme sinais
          <br />
          em <span>ações precisas.</span>
        </h2>
        <p>
          Uma visão conectada dos seus incidentes. Da identificação à resposta,
          mantenha sua equipe um passo à frente.
        </p>
        <div className="auth-points">
          <span>
            <Activity size={18} /> Visibilidade para priorizar o que importa
          </span>
          <span>
            <Users size={18} /> Investigações construídas em equipe
          </span>
          <span>
            <Fingerprint size={18} /> Histórico de cada decisão
          </span>
        </div>
      </div>
      <form className="auth-panel" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">ACESSO AO WORKSPACE</p>
          <h1>Bem-vindo de volta</h1>
          <p className="muted">Entre na sua central de operações.</p>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <Field label="Usuário">
          <TextInput
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </Field>

        <Field label="Senha">
          <div className="password-field">
            <TextInput
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>

        <p className="muted">
          Sem conta? <Link to="/cadastro">Criar cadastro</Link>
        </p>
      </form>
    </main>
  );
}
