import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { EmployeeCreatePage } from "../features/employees/pages/EmployeeCreatePage";
import { DashboardPage } from "../features/incidents/pages/DashboardPage";
import { IncidentDetailPage } from "../features/incidents/pages/IncidentDetailPage";
import { IncidentListPage } from "../features/incidents/pages/IncidentListPage";
import { NewIncidentPage } from "../features/incidents/pages/NewIncidentPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/incidentes" element={<IncidentListPage />} />
          <Route path="/incidentes/novo" element={<NewIncidentPage />} />
          <Route path="/incidentes/:id" element={<IncidentDetailPage />} />
          <Route path="/funcionarios" element={<EmployeeCreatePage />} />
          <Route path="*" element={<section className="empty-state"><h1>Página não encontrada</h1><p>Confira o endereço ou use a navegação para continuar.</p><a className="button button-primary" href="/dashboard">Voltar à visão geral</a></section>} />
        </Route>
      </Route>
    </Routes>
  );
}
