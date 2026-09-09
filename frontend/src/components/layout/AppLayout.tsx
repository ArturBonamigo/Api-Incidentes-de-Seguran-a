import { FormEvent, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
export function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    navigate(
      "/incidentes?" +
        new URLSearchParams(search.trim() ? { search: search.trim() } : {}),
    );
    setSearch("");
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">
            <ShieldCheck size={24} />
          </span>
          <span>
            sentinel<span className="brand-subtitle">SECURITY OPERATIONS</span>
          </span>
        </Link>
        <p className="nav-caption">WORKSPACE</p>
        <nav
          className="nav-list"
          aria-label="Navegação principal"
          onClick={() => setMenuOpen(false)}
        >
          <NavLink to="/dashboard">
            <LayoutDashboard size={18} />
            Visão geral
          </NavLink>
          <NavLink to="/incidentes" end>
            <ClipboardList size={18} />
            Incidentes
          </NavLink>
          {user?.perfil !== "AUDITOR" && (
            <NavLink to="/incidentes/novo">
              <Plus size={18} />
              Registrar incidente
            </NavLink>
          )}
          {user?.perfil === "ADMIN" && (
            <NavLink to="/funcionarios">
              <Users size={18} />
              Equipe
            </NavLink>
          )}
        </nav>
        <div className="sidebar-note">
          <span className="mini-orbit">
            <ShieldCheck size={23} />
          </span>
          <strong>Clareza para agir.</strong>
          <p>
            Centralize a investigação. Conecte os fatos. Responda com confiança.
          </p>
          <Link to="/incidentes?fila=nao_atribuidos">
            Revisar fila de triagem <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="workspace-label">
          <span className="workspace-icon">S</span>
          <div>
            <strong>Central de segurança</strong>
            <small>Gestão de incidentes</small>
          </div>
          <span className="version">v1.0</span>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="breadcrumb">
            Workspace <span>/</span> Central de segurança
          </span>
          <form className="topbar-search" onSubmit={submitSearch}>
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar incidentes"
                placeholder="Buscar incidentes…"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" aria-label="Pesquisar">
                ↵
              </button>
            </label>
          </form>
          <span className="operator-avatar">
            {(user?.username?.[0] ?? "S").toUpperCase()}
          </span>
          <div className="operator-card">
            <strong>{user?.username}</strong>
            <span>{user?.perfil?.replaceAll("_", " ")}</span>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <LogOut size={17} />
          </button>
        </header>
        <main className="content" id="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Sentinel · Central de operações de segurança</span>
          <span>Investigue. Colabore. Resolva.</span>
        </footer>
      </div>
    </div>
  );
}
