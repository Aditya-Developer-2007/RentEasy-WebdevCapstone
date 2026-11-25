import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user, getDashboardPath } = useAuth();

  return (
    <main className="container page-section">
      <div className="surface-card center-state">
        <span className="badge badge-rejected">403 · Access Restricted</span>
        <h1 style={{ fontSize: 24 }}>You do not have access to this page</h1>
        <p style={{ margin: 0, color: 'var(--color-ink-secondary)', maxWidth: 420 }}>
          Your current account role does not permit viewing this workspace.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/" className="btn btn-secondary">
            Browse Properties
          </Link>
          {user && (
            <Link to={getDashboardPath(user.role)} className="btn btn-primary">
              Go to My Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
