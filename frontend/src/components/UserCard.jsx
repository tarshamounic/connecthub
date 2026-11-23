import { Link } from 'react-router-dom';
import { Check, MessageCircle, Send, UserPlus } from 'lucide-react';
import Avatar from './Avatar';
import { LiveBadge, PresenceLabel } from './Presence';
import { formatJoined } from '../utils/format';
import { useSocket } from '../context/SocketContext';

export default function UserCard({ candidate, onRequest, requesting }) {
  const { statuses } = useSocket();
  const status = statuses[candidate.id] || candidate.status || 'OFFLINE';
  const relation = candidate.relation?.status || 'NONE';

  return (
    <article className="user-card card">
      <div className="user-card-top">
        <Avatar
          name={candidate.fullName}
          username={candidate.username}
          size={52}
          status={status}
        />
        <div className="user-card-heading">
          <Link to={`/users/${candidate.id}`} className="user-card-name">
            {candidate.fullName}
          </Link>
          <span className="muted">@{candidate.username}</span>
        </div>
        {status === 'LIVE' ? <LiveBadge /> : null}
      </div>

      <div className="user-card-meta">
        <PresenceLabel status={status} />
        <span className="dot-separator">•</span>
        <span className="muted small">{formatJoined(candidate.createdAt)}</span>
      </div>

      <div className="user-card-actions">
        {relation === 'ACCEPTED' ? (
          <Link className="btn btn-primary btn-sm" to={`/chats/${candidate.relation.conversationId}`}>
            <MessageCircle size={15} /> Message
          </Link>
        ) : null}
        {relation === 'PENDING_SENT' ? (
          <button className="btn btn-ghost btn-sm" type="button" disabled>
            <Check size={15} /> Request sent
          </button>
        ) : null}
        {relation === 'PENDING_RECEIVED' ? (
          <Link className="btn btn-secondary btn-sm" to="/requests/incoming">
            Respond to request
          </Link>
        ) : null}
        {relation === 'NONE' ? (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => onRequest(candidate)}
            disabled={requesting}
          >
            <UserPlus size={15} /> {requesting ? 'Sending…' : 'Send request'}
          </button>
        ) : null}
        <Link className="btn btn-ghost btn-sm" to={`/users/${candidate.id}`}>
          View profile
        </Link>
      </div>
    </article>
  );
}
