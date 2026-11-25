import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircleIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'tenant',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: form.role,
      });
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="surface-card auth-card" style={{ display: 'grid', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Create your account</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-secondary)' }}>
            Join RentEasy as a tenant or property owner
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
            <span className="field-label">I am joining as</span>
            <div className="segmented-control" role="radiogroup" aria-label="Account role">
              <button
                type="button"
                className={`segmented-btn ${form.role === 'tenant' ? 'active' : ''}`}
                onClick={() => updateField('role', 'tenant')}
              >
                Tenant
              </button>
              <button
                type="button"
                className={`segmented-btn ${form.role === 'owner' ? 'active' : ''}`}
                onClick={() => updateField('role', 'owner')}
              >
                Property Owner
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Ananya Sharma"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="ananya@example.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="reg-phone">
              Phone Number (optional)
            </label>
            <input
              id="reg-phone"
              type="tel"
              className="input"
              placeholder="+91-9876543210"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 13.5,
            color: 'var(--color-ink-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
