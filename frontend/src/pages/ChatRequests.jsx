import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Check, Inbox, MessageCircle, Send, X } from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { LiveBadge } from '../components/Presence';
import { useSocket } from '../context/SocketContext';
import { getApiError, requestApi } from '../services/api';
import { formatRelative } from '../utils/format';

function StatusChip({ status }) {
  return <span className={`status-chip status-${status.toLowerCase()}`}>{status}</span>;
}

export default function ChatRequests({ mode = 'incoming' }) {
  const incomingMode = mode === 'incoming';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState(null);
  const { statuses, notify, subscribeRequests } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = incomingMode ? await requestApi.incoming() : await requestApi.outgoing();
      setRequests(data);
      setError('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [incomingMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeRequests(() => load()), [subscribeRequests, load]);

  const handleAction = async (request, action) => {
    setActingOn(request.id);
    try {
      if (action === 'accept') {
        const updated = await requestApi.accept(request.id);
        notify(`You are now connected with ${request.senderName}`, 'success');
        setRequests((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const updated = await requestApi.reject(request.id);
        notify(`Request from ${request.senderName} declined`, 'info');
        setRequests((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
    } catch (err) {
      notify(getApiError(err), 'error');
    } finally {
      setActingOn(null);
    }
  };

  const counterpart = (request) =>
    incomingMode
      ? { id: request.senderId, name: request.senderName, username: request.senderUsername }
      : { id: request.receiverId, name: request.receiverName, username: request.receiverUsername };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Chat requests"
        title={incomingMode ? 'Incoming requests' : 'Outgoing requests'}
        subtitle={
          incomingMode
            ? 'Accept a request to unlock a secure one-to-one conversation.'
            : 'Track the requests you have sent. Private chat unlocks after acceptance.'
        }
      />

      <div className="tabs">
        <NavLink
          to="/requests/incoming"
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`.trim()}
        >
          <Inbox size={16} /> Incoming
        </NavLink>
        <NavLink
          to="/requests/outgoing"
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`.trim()}
        >
          <Send size={16} /> Outgoing
        </NavLink>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <Loading label="Loading requests…" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={incomingMode ? Inbox : Send}
          title={incomingMode ? 'No incoming requests' : 'No outgoing requests'}
          description={
            incomingMode
              ? 'When another member wants to chat privately, their request lands here.'
              : 'Find members on the Discover page and send your first chat request.'
          }
        >
          <Link to="/discover" className="btn btn-secondary btn-sm">
            Discover members
          </Link>
        </EmptyState>
      ) : (
        <div className="request-list">
          {requests.map((request) => {
            const person = counterpart(request);
            const status = statuses[person.id] || 'OFFLINE';
            const pending = request.status === 'PENDING';
            return (
              <article key={request.id} className="card request-card">
                <Avatar name={person.name} username={person.username} size={48} status={status} />
                <div className="request-card-body">
                  <div className="request-card-heading">
                    <Link to={`/users/${person.id}`} className="request-card-name">
                      {person.name}
                    </Link>
                    {status === 'LIVE' ? <LiveBadge /> : null}
                    <StatusChip status={request.status} />
                  </div>
                  <span className="muted">@{person.username}</span>
                  <p className="muted small">
                    {incomingMode
                      ? `${person.name} wants to start a private conversation · ${formatRelative(request.createdAt)}`
                      : `Sent to ${person.name} · ${formatRelative(request.createdAt)}`}
                  </p>
                </div>
                <div className="request-card-actions">
                  {incomingMode && pending ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={actingOn === request.id}
                        onClick={() => handleAction(request, 'accept')}
                      >
                        <Check size={15} /> Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={actingOn === request.id}
                        onClick={() => handleAction(request, 'reject')}
                      >
                        <X size={15} /> Decline
                      </button>
                    </>
                  ) : null}
                  {request.status === 'ACCEPTED' && request.conversationId ? (
                    <Link to={`/chats/${request.conversationId}`} className="btn btn-primary btn-sm">
                      <MessageCircle size={15} /> Open chat
                    </Link>
                  ) : null}
                  {!incomingMode && pending ? (
                    <span className="waiting-note">Waiting for a response</span>
                  ) : null}
                  {request.status === 'REJECTED' ? (
                    <span className="muted small">No conversation was created.</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
