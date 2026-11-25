import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="container page-section">
      <div className="surface-card center-state">
        <span className="badge badge-neutral">404</span>
        <h1 style={{ fontSize: 24 }}>Page not found</h1>
        <p style={{ margin: 0, color: 'var(--color-ink-secondary)', maxWidth: 400 }}>
          The page you are looking for does not exist or may have moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Return Home
        </Link>
      </div>
    </main>
  );
}
