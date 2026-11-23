import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!USERNAME_PATTERN.test(form.username.trim())) {
      setError('Username must be 3–30 characters using letters, numbers, dots or underscores.');
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <Link to="/login" className="auth-brand">
          <span className="brand-mark light">
            <MessageCircle size={20} />
          </span>
          ConnectHub
        </Link>
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="live-dot" /> JOIN THE COMMUNITY
          </span>
          <h1>Your campus conversations, in one place.</h1>
          <p>
            Create your profile, join the global room and send private chat requests to start
            one-to-one conversations securely.
          </p>
        </div>
        <ul className="hero-points">
          <li>
            <Zap size={18} />
            <div>
              <strong>Global room</strong>
              <span>Every registered member can join the conversation.</span>
            </div>
          </li>
          <li>
            <Users size={18} />
            <div>
              <strong>Member discovery</strong>
              <span>Search people and see who is online right now.</span>
            </div>
          </li>
          <li>
            <ShieldCheck size={18} />
            <div>
              <strong>Secure accounts</strong>
              <span>Passwords are hashed with BCrypt and never shared.</span>
            </div>
          </li>
        </ul>
        <p className="hero-footer">ConnectHub · college project prototype</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card auth-card-wide">
          <span className="eyebrow">Create account</span>
          <h2>Join ConnectHub</h2>
          <p className="auth-subtitle">Set up your profile in a few seconds.</p>

          {error ? <div className="form-error">{error}</div> : null}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Alex Carter"
                autoComplete="name"
                autoFocus
              />
            </label>
            <div className="field-grid">
              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={update('username')}
                  placeholder="alex_carter"
                  autoComplete="username"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="alex@campus.edu"
                  autoComplete="email"
                />
              </label>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
              {!submitting ? <ArrowRight size={17} /> : null}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
