import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, KeyRound, Lock, LogOut, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { LiveBadge, PresenceLabel } from '../components/Presence';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getApiError, settingsApi } from '../services/api';
import { formatJoined } from '../utils/format';

export default function Settings() {
  const { logout } = useAuth();
  const { statuses, connected } = useSocket();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    settingsApi
      .profile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((err) => {
        if (active) setError(getApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) return <Loading label="Loading your profile…" />;

  if (error || !profile) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || 'Profile not available'}</div>
      </div>
    );
  }

  const status = statuses[profile.id] || profile.status || 'OFFLINE';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Review your profile details and manage your session."
        actions={
          <Link to={`/users/${profile.id}`} className="btn btn-secondary">
            <UserIcon size={16} /> View public profile
          </Link>
        }
      />

      <div className="settings-grid">
        <section className="card profile-hero settings-profile">
          <div className="profile-banner" />
          <div className="profile-identity">
            <Avatar
              name={profile.fullName}
              username={profile.username}
              size={80}
              status={status}
              className="profile-avatar"
            />
            <div className="profile-headline">
              <h1>
                {profile.fullName}
                {status === 'LIVE' ? <LiveBadge /> : null}
              </h1>
              <p>@{profile.username}</p>
              <PresenceLabel status={status} />
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>
                <UserIcon size={15} /> Full name
              </dt>
              <dd>{profile.fullName}</dd>
            </div>
            <div>
              <dt>
                <KeyRound size={15} /> Username
              </dt>
              <dd>@{profile.username}</dd>
            </div>
            <div>
              <dt>
                <Mail size={15} /> Email
              </dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={15} /> Member since
              </dt>
              <dd>{formatJoined(profile.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <aside className="settings-side">
          <section className="card panel">
            <div className="panel-header compact">
              <div>
                <h2>Session</h2>
                <p>How your account stays protected</p>
              </div>
            </div>
            <ul className="security-list">
              <li>
                <ShieldCheck size={17} />
                <div>
                  <strong>JWT authentication</strong>
                  <span>Every REST request and WebSocket connection is verified with your token.</span>
                </div>
              </li>
              <li>
                <Lock size={17} />
                <div>
                  <strong>BCrypt password hashing</strong>
                  <span>Your password is stored as a one-way hash, never as plain text.</span>
                </div>
              </li>
              <li>
                <span className={`socket-dot ${connected ? '' : 'off'}`.trim()} />
                <div>
                  <strong>{connected ? 'Real-time session connected' : 'Real-time session reconnecting'}</strong>
                  <span>Presence and messages stream over an authenticated STOMP connection.</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="card panel logout-panel">
            <div>
              <h2>Sign out</h2>
              <p className="muted">
                Logging out removes your token from this browser and closes the live connection.
              </p>
            </div>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              <LogOut size={16} /> Log out
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
