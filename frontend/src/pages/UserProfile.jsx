import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MessageCircle,
  Settings as SettingsIcon,
  UserPlus,
  X,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import { LiveBadge, PresenceLabel } from '../components/Presence';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getApiError, requestApi, userApi } from '../services/api';
import { formatJoined } from '../utils/format';

export default function UserProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { statuses, notify } = useSocket();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.get(id);
      setProfile(data);
      setError('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendRequest = async () => {
    setActing(true);
    try {
      await requestApi.send(profile.id);
      notify(`Chat request sent to ${profile.fullName}`, 'success');
      await load();
    } catch (err) {
      notify(getApiError(err), 'error');
    } finally {
      setActing(false);
    }
  };

  const handleRespond = async (action) => {
    setActing(true);
    try {
      if (action === 'accept') {
        await requestApi.accept(profile.relation.requestId);
        notify(`You are now connected with ${profile.fullName}`, 'success');
      } else {
        await requestApi.reject(profile.relation.requestId);
        notify(`Request from ${profile.fullName} declined`, 'info');
      }
      await load();
    } catch (err) {
      notify(getApiError(err), 'error');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <Loading label="Loading profile…" />;

  if (error || !profile) {
    return (
      <div className="page">
        <Link to="/discover" className="back-link">
          <ArrowLeft size={16} /> Back to members
        </Link>
        <div className="alert alert-error">{error || 'Profile not available'}</div>
      </div>
    );
  }

  const status = statuses[profile.id] || profile.status || 'OFFLINE';
  const relation = profile.relation?.status || 'NONE';
  const isSelf = user?.id === profile.id;

  return (
    <div className="page profile-page">
      <Link to="/discover" className="back-link">
        <ArrowLeft size={16} /> Back to members
      </Link>

      <section className="card profile-hero">
        <div className="profile-banner" />
        <div className="profile-identity">
          <Avatar
            name={profile.fullName}
            username={profile.username}
            size={88}
            status={status}
            className="profile-avatar"
          />
          <div className="profile-headline">
            <h1>
              {profile.fullName}
              {status === 'LIVE' ? <LiveBadge /> : null}
            </h1>
            <p>@{profile.username}</p>
            <div className="profile-presence">
              <PresenceLabel status={status} />
              <span className="dot-separator">•</span>
              <span className="muted">
                <CalendarDays size={14} /> {formatJoined(profile.createdAt)}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            {isSelf ? (
              <Link to="/settings" className="btn btn-secondary">
                <SettingsIcon size={16} /> Manage account
              </Link>
            ) : null}
            {!isSelf && relation === 'ACCEPTED' ? (
              <Link to={`/chats/${profile.relation.conversationId}`} className="btn btn-primary">
                <MessageCircle size={16} /> Open private chat
              </Link>
            ) : null}
            {!isSelf && relation === 'PENDING_SENT' ? (
              <button type="button" className="btn btn-ghost" disabled>
                <Check size={16} /> Request pending
              </button>
            ) : null}
            {!isSelf && relation === 'PENDING_RECEIVED' ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={acting}
                  onClick={() => handleRespond('accept')}
                >
                  <Check size={16} /> Accept request
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={acting}
                  onClick={() => handleRespond('reject')}
                >
                  <X size={16} /> Decline
                </button>
              </>
            ) : null}
            {!isSelf && relation === 'NONE' ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={acting}
                onClick={handleSendRequest}
              >
                <UserPlus size={16} /> {acting ? 'Sending…' : 'Send chat request'}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <section className="card panel">
          <div className="panel-header compact">
            <div>
              <h2>Public profile</h2>
              <p>What other members can see</p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Display name</dt>
              <dd>{profile.fullName}</dd>
            </div>
            <div>
              <dt>Username</dt>
              <dd>@{profile.username}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <PresenceLabel status={status} />
              </dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{formatJoined(profile.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <aside className="card panel">
          <div className="panel-header compact">
            <div>
              <h2>Private messaging</h2>
              <p>How ConnectHub keeps chats secure</p>
            </div>
          </div>
          <p className="muted profile-note">
            {relation === 'ACCEPTED'
              ? 'You have an accepted chat request with this member, so you can message privately.'
              : relation === 'PENDING_SENT'
                ? 'Your request is waiting for a response. Private messaging unlocks once it is accepted.'
                : relation === 'PENDING_RECEIVED'
                  ? 'This member wants to chat privately. Accept the request to open a conversation.'
                  : 'Send a chat request first. Private messaging unlocks only after the request is accepted.'}
          </p>
          <p className="muted profile-note">
            Email addresses and passwords are never exposed on public profiles.
          </p>
        </aside>
      </div>
    </div>
  );
}
