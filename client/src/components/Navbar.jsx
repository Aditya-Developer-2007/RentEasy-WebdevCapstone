import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShortlist } from '../context/ShortlistContext';
import { BuildingIcon, CloseIcon, HeartIcon, MenuIcon } from './Icons';

export default function Navbar() {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const { savedIds } = useShortlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer automatically on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll & close on Escape while drawer is open
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

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
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
              >
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

        <div className="nav-mobile-right">
          {isAuthenticated && user?.role === 'tenant' && (
            <Link
              to="/dashboard/tenant"
              className="nav-mobile-shortlist tabular-nums"
              aria-label={`Shortlisted properties (${savedIds.length})`}
            >
              <HeartIcon size={15} filled={savedIds.length > 0} />
              <span>{savedIds.length}</span>
            </Link>
          )}
          <button
            type="button"
            className="nav-mobile-toggle"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setMobileOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            {isAuthenticated && user && (
              <div className="drawer-user-card">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }} className="wrap-anywhere">
                    {user.name}
                  </div>
                  <div
                    style={{ fontSize: 12.5, color: 'var(--color-ink-muted)' }}
                    className="wrap-anywhere"
                  >
                    {user.email}
                  </div>
                </div>
                <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </div>
            )}

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `drawer-nav-link ${isActive ? 'active' : ''}`
              }
            >
              Browse Properties
            </NavLink>

            {isAuthenticated && (
              <NavLink
                to={dashboardPath}
                className={({ isActive }) =>
                  `drawer-nav-link ${isActive ? 'active' : ''}`
                }
              >
                Dashboard
              </NavLink>
            )}

            <div
              style={{
                paddingTop: 8,
                borderTop: '1px solid var(--color-border)',
                display: 'grid',
                gap: 10,
              }}
            >
              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary btn-full">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-full">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
