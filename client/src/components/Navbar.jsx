import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BuildingIcon, CloseIcon, MenuIcon } from './Icons';

export default function Navbar() {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardPath = user ? getDashboardPath(user.role) : '/';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">
            <BuildingIcon size={18} />
          </span>
          <span>RentEasy</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Browse Properties
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to={dashboardPath}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                {user.role}
              </span>
              <span style={{ fontSize: 13.5, color: 'var(--color-ink-secondary)' }}>
                {user.name}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="nav-mobile-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-drawer">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Browse Properties
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to={dashboardPath}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Dashboard ({user.role})
              </NavLink>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={handleLogout}
              >
                Logout ({user.name})
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to="/login"
                className="btn btn-secondary btn-full"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-full"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
