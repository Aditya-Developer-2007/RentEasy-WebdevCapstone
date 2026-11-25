import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircleIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Tenant', email: 'tenant1@renteasy.com', password: 'Password123!' },
  { label: 'Owner', email: 'owner1@renteasy.com', password: 'Password123!' },
  { label: 'Admin', email: 'admin@renteasy.com', password: 'Password123!' },
];

export default function LoginPage() {
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      const redirectTo =
        location.state?.from?.pathname || getDashboardPath(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrors({});
    setServerError('');
  };

  return (
    <main className="auth-shell">
      <div className="surface-card auth-card" style={{ display: 'grid', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-secondary)' }}>
            Sign in to your RentEasy account
          </p>
        </div>

        {serverError && (
          <div className="alert alert-error">
            <AlertCircleIcon size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 14,
            display: 'grid',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'space-between' }}
            onClick={() => setDemoOpen((prev) => !prev)}
            aria-expanded={demoOpen}
          >
            <span>Quick Demo Credentials</span>
            <span>{demoOpen ? '−' : '+'}</span>
          </button>

          {demoOpen && (
            <div style={{ display: 'grid', gap: 8 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => fillDemo(acc)}
                >
                  <span>{acc.label}</span>
                  <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400 }}>
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 13.5,
            color: 'var(--color-ink-secondary)',
          }}
        >
          New to RentEasy?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
