import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Enter your username or email and your password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
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
            <span className="live-dot" /> REAL-TIME MESSAGING
          </span>
          <h1>Conversations that keep everyone in the loop.</h1>
          <p>
            One shared room for the whole community, private chats with the people you trust, and
            live presence that updates as it happens.
          </p>
        </div>
        <ul className="hero-points">
          <li>
            <Zap size={18} />
            <div>
              <strong>Instant delivery</strong>
              <span>Messages stream over authenticated WebSockets.</span>
            </div>
          </li>
          <li>
            <Users size={18} />
            <div>
              <strong>Live presence</strong>
              <span>See who is online, offline, or actively chatting.</span>
            </div>
          </li>
          <li>
            <ShieldCheck size={18} />
            <div>
              <strong>Private by request</strong>
              <span>One-to-one conversations unlock only after acceptance.</span>
            </div>
          </li>
        </ul>
        <p className="hero-footer">ConnectHub · college project prototype</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to ConnectHub</h2>
          <p className="auth-subtitle">Use your username or email to pick up where you left off.</p>

          {error ? <div className="form-error">{error}</div> : null}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label className="field">
              <span>Username or email</span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="alex_carter or alex@campus.edu"
                autoComplete="username"
                autoFocus
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
              {!submitting ? <ArrowRight size={17} /> : null}
            </button>
          </form>

          <p className="auth-switch">
            New to ConnectHub? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
