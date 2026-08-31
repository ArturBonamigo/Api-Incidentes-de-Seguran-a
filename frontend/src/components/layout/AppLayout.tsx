import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlusSquare,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";

import { useAuth } from "../../auth/useAuth";

export function AppLayout() {
  const { logout, user } = useAuth();
  const isAdmin = user?.perfil === "ADMIN";
  const profileLabel = user?.perfil?.replaceAll("_", " ") ?? "Operador";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark" aria-hidden="true"><ShieldCheck size={21} strokeWidth={1.8} /></span>
          <span>Cyber Sentinel</span>
        </Link>
        <nav className="nav-list" aria-label="Navegacao principal">
          <NavLink to="/dashboard">
            <span className="nav-icon" aria-hidden="true"><LayoutDashboard size={18} /></span>
            Dashboard
          </NavLink>
          <NavLink to="/incidentes">
            <span className="nav-icon" aria-hidden="true"><ClipboardList size={18} /></span>
            Painel
          </NavLink>
          <NavLink to="/incidentes/novo">
            <span className="nav-icon" aria-hidden="true"><PlusSquare size={18} /></span>
            Novo incidente
          </NavLink>
          {isAdmin ? (
            <NavLink to="/funcionarios">
              <span className="nav-icon" aria-hidden="true"><Users size={18} /></span>
              Funcionarios
            </NavLink>
          ) : null}
        </nav>
        <div className="system-card" aria-label="Status do sistema">
          <span className="system-pulse" aria-hidden="true" />
          <div>
            <strong>Sistemas operacionais</strong>
            <span>Monitoramento ativo</span>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-search">
            <button className="icon-button" type="button" aria-label="Abrir menu">
              <Menu size={19} aria-hidden="true" />
            </button>
            <label className="search-field">
              <Search size={16} aria-hidden="true" />
              <input placeholder="Search incidents, threats, assets, IPs..." type="search" />
            </label>
          </div>
          <div className="topbar-actions">
            <button className="icon-button has-alert" type="button" aria-label="Notificacoes">
              <Bell size={18} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Mensagens">
              <MessageSquare size={18} aria-hidden="true" />
            </button>
            <span className="operator-avatar" aria-hidden="true">
              {(user?.username?.[0] ?? "S").toUpperCase()}
            </span>
            <div className="operator-card">
              <div>
                <strong>{user?.username}</strong>
                <span>{profileLabel}</span>
              </div>
              <button className="button button-ghost" type="button" onClick={logout}>
                Sair
              </button>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
