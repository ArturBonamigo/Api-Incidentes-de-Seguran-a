import { FormEvent, useEffect, useState } from "react";

import * as authApi from "../../../api/auth.api";
import { useAuth } from "../../../auth/useAuth";
import { Button } from "../../../components/ui/Button";
import { Field, Select, TextInput } from "../../../components/ui/Field";
import { ApiError } from "../../../types/api";
import { EmployeeCreateRequest, User, UserProfile } from "../../../types/auth";
import { formatDateTime } from "../../../utils/format";

const profiles: Array<{ value: EmployeeCreateRequest["perfil"]; label: string }> = [
  { value: "ANALISTA_SOC", label: "Analista SOC" },
  { value: "GESTOR", label: "Gestor" },
  { value: "AUDITOR", label: "Auditor" },
  { value: "ADMIN", label: "Administrador" }
];

export function EmployeeCreatePage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [form, setForm] = useState<EmployeeCreateRequest>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    perfil: "ANALISTA_SOC",
    is_active: true,
    password: "",
    password_confirm: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const isAdmin = user?.perfil === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      setIsLoadingEmployees(false);
      return;
    }

    async function loadEmployees() {
      setIsLoadingEmployees(true);
      setError("");

      try {
        setEmployees(await authApi.listUsers());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar funcionarios.");
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    void loadEmployees();
  }, [isAdmin]);

  function updateField<K extends keyof EmployeeCreateRequest>(
    field: K,
    value: EmployeeCreateRequest[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const employee = await authApi.createEmployee(form);
      setSuccess(`Funcionario ${employee.username} cadastrado com perfil ${employee.perfil}.`);
      setEmployees((current) => [employee, ...current]);
      setForm({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        perfil: "ANALISTA_SOC",
        is_active: true,
        password: "",
        password_confirm: ""
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cadastrar funcionario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfileChange(employee: User, perfil: UserProfile) {
    setError("");
    setSuccess("");
    setUpdatingUserId(employee.id);

    try {
      const updatedEmployee = await authApi.updateUser(employee.id, { perfil });
      setEmployees((current) =>
        current.map((item) => (item.id === employee.id ? updatedEmployee : item))
      );
      setSuccess(`Perfil de ${updatedEmployee.username} atualizado.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar perfil.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleActiveToggle(employee: User) {
    setError("");
    setSuccess("");
    setUpdatingUserId(employee.id);

    try {
      const updatedEmployee = await authApi.updateUser(employee.id, {
        is_active: !employee.is_active
      });
      setEmployees((current) =>
        current.map((item) => (item.id === employee.id ? updatedEmployee : item))
      );
      setSuccess(
        `${updatedEmployee.username} ${updatedEmployee.is_active ? "ativado" : "desativado"}.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel alterar status da conta.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (!isAdmin) {
    return <p className="form-error">Apenas administradores podem cadastrar funcionarios.</p>;
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administracao</p>
          <h1>Equipe<span className="heading-dot">.</span></h1>
          <p>Gerencie as pessoas e os perfis de acesso da sua operação.</p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div>
          <h2>Cadastrar funcionario</h2>
          <p className="muted">Crie contas operacionais com perfil de acesso definido.</p>
        </div>

        <Field label="Usuario">
          <TextInput
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            required
          />
        </Field>

        <Field label="Email">
          <TextInput
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </Field>

        <div className="two-columns">
          <Field label="Nome">
            <TextInput
              value={form.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
            />
          </Field>
          <Field label="Sobrenome">
            <TextInput
              value={form.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
            />
          </Field>
        </div>

        <Field label="Perfil">
          <Select
            value={form.perfil}
            onChange={(event) =>
              updateField("perfil", event.target.value as EmployeeCreateRequest["perfil"])
            }
          >
            {profiles.map((profile) => (
              <option key={profile.value} value={profile.value}>
                {profile.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="two-columns">
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
        </div>

        <label className="checkbox-row">
          <input
            checked={form.is_active}
            type="checkbox"
            onChange={(event) => updateField("is_active", event.target.checked)}
          />
          Conta ativa
        </label>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Cadastrar funcionario"}
        </Button>
      </form>

      <section className="panel">
        <div className="section-header">
          <div>
            <h2>Contas cadastradas</h2>
            <p className="muted">Gerencie perfis e acesso ativo dos usuarios internos.</p>
          </div>
        </div>

        {isLoadingEmployees ? <p className="screen-message">Carregando funcionarios...</p> : null}

        <div className="table-wrap embedded">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const isCurrentUser = employee.id === user?.id;
                const isUpdating = updatingUserId === employee.id;

                return (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.username}</strong>
                      <span>{employee.email || "Sem email"}</span>
                    </td>
                    <td>
                      <Select
                        disabled={isUpdating || isCurrentUser}
                        aria-label={`Perfil de ${employee.username}`}
                        value={employee.perfil}
                        onChange={(event) =>
                          handleProfileChange(employee, event.target.value as UserProfile)
                        }
                      >
                        <option value="USUARIO_COMUM">Usuario comum</option>
                        {profiles.map((profile) => (
                          <option key={profile.value} value={profile.value}>
                            {profile.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <span className={`account-status ${employee.is_active ? "active" : "inactive"}`}>
                        {employee.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td>{formatDateTime(employee.date_joined)}</td>
                    <td>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUpdating || isCurrentUser}
                        onClick={() => handleActiveToggle(employee)}
                        title={
                          isCurrentUser
                            ? "Voce nao pode desativar a propria conta por aqui."
                            : undefined
                        }
                      >
                        {employee.is_active ? "Desativar" : "Ativar"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoadingEmployees && !employees.length ? (
          <p className="screen-message">Nenhuma conta encontrada.</p>
        ) : null}
      </section>
    </section>
  );
}
