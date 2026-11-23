import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Inbox,
  MessageCircle,
  MessagesSquare,
  Search,
  Users,
  X,
  Radio,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { LiveBadge, PresenceLabel } from '../components/Presence';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { conversationApi, getApiError, globalApi, requestApi, userApi } from '../services/api';
import { formatRelative, formatTime, greeting, todayLabel } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    statuses,
    notify,
    connected,
    subscribeGlobal,
    subscribePrivate,
    subscribeRequests,
  } = useSocket();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actingOn, setActingOn] = useState(null);
  const [railOpen, setRailOpen] = useState(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [userList, conversationList, incoming, globalMessages] = await Promise.all([
        userApi.list({ filter: 'ALL' }),
        conversationApi.list(),
        requestApi.incoming(),
        globalApi.messages(),
      ]);
      setUsers(userList);
      setConversations(conversationList);
      setRequests(incoming.filter((request) => request.status === 'PENDING'));
      setPreview(globalMessages.slice(-4));
      setError('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () =>
      subscribeGlobal((message) => {
        setPreview((previous) => [...previous, message].slice(-4));
      }),
    [subscribeGlobal],
  );

  useEffect(
    () =>
      subscribePrivate((message) => {
        setConversations((previous) => {
          const next = previous.map((conversation) =>
            conversation.id === message.conversationId
              ? { ...conversation, lastMessage: message.content, lastMessageAt: message.createdAt }
              : conversation,
          );
          return next.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
      }),
    [subscribePrivate],
  );

  useEffect(
    () =>
      subscribeRequests(() => {
        load({ silent: true });
      }),
    [subscribeRequests, load],
  );

  const resolveStatus = useCallback(
    (member) => statuses[member.id] || member.status || 'OFFLINE',
    [statuses],
  );

  const onlineUsers = useMemo(
    () => users.filter((member) => ['ONLINE', 'LIVE'].includes(resolveStatus(member))),
    [users, resolveStatus],
  );
  const liveUsers = useMemo(
    () => users.filter((member) => resolveStatus(member) === 'LIVE'),
    [users, resolveStatus],
  );
  const ownStatus = statuses[user?.id] || 'ONLINE';
  const onlineCount = onlineUsers.length + (ownStatus === 'OFFLINE' ? 0 : 1);
  const liveCount = liveUsers.length + (ownStatus === 'LIVE' ? 1 : 0);

  const handleSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    navigate(term ? `/discover?q=${encodeURIComponent(term)}` : '/discover');
  };

  const handleRespond = async (request, action) => {
    setActingOn(request.id);
    try {
      if (action === 'accept') {
        await requestApi.accept(request.id);
        notify(`You are now connected with ${request.senderName}`, 'success');
      } else {
        await requestApi.reject(request.id);
        notify(`Request from ${request.senderName} declined`, 'info');
      }
      await load({ silent: true });
    } catch (err) {
      notify(getApiError(err), 'error');
    } finally {
      setActingOn(null);
    }
  };

  if (loading) {
    return <Loading label="Loading your dashboard…" />;
  }

  return (
    <div className="dashboard">
      <div className="welcome-card card">
        <div>
          <span className="eyebrow">{todayLabel()}</span>
          <h1>
            {greeting()}, {user?.fullName?.split(' ')[0] || 'there'}
          </h1>
          <p>Here is what is happening across your community right now.</p>
        </div>
        <div className="welcome-actions">
          <div className="welcome-presence">
            <PresenceLabel status={ownStatus} />
            {ownStatus === 'LIVE' ? <LiveBadge /> : null}
          </div>
          <div className="welcome-actions-row">
            <button
              type="button"
              className="btn btn-ghost btn-sm rail-toggle"
              onClick={() => setRailOpen((open) => !open)}
            >
              <Users size={15} /> {railOpen ? 'Hide people' : 'Show people'}
            </button>
            <Link to="/global" className="btn btn-primary">
              Open global chat <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="stat-grid">
        <div className="stat-card card">
          <span className="stat-icon stat-purple">
            <Users size={19} />
          </span>
          <div>
            <strong>{onlineCount}</strong>
            <span>Members online</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon stat-red">
            <Radio size={19} />
          </span>
          <div>
            <strong>{liveCount}</strong>
            <span>Live right now</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon stat-amber">
            <Inbox size={19} />
          </span>
          <div>
            <strong>{requests.length}</strong>
            <span>Pending requests</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon stat-green">
            <MessagesSquare size={19} />
          </span>
          <div>
            <strong>{conversations.length}</strong>
            <span>Private chats</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="card panel">
            <div className="panel-header">
              <div>
                <h2>
                  <span className="live-dot" /> Global chat
                </h2>
                <p>Latest messages from the whole community</p>
              </div>
              <Link to="/global" className="text-link">
                Open room <ArrowRight size={14} />
              </Link>
            </div>
            {preview.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="The room is quiet"
                description="Be the first to say hello in the global chat."
              >
                <Link to="/global" className="btn btn-primary btn-sm">
                  Start the conversation
                </Link>
              </EmptyState>
            ) : (
              <div className="preview-list">
                {preview.map((message) => (
                  <Link to="/global" key={message.id} className="preview-message">
                    <Avatar
                      name={message.senderName}
                      username={message.senderUsername}
                      size={34}
                    />
                    <div className="preview-message-body">
                      <div>
                        <span className="preview-name">{message.senderName}</span>
                        <span className="preview-time">{formatTime(message.createdAt)}</span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="dashboard-columns">
            <section className="card panel">
              <div className="panel-header">
                <div>
                  <h2>Recent conversations</h2>
                  <p>Your accepted private chats</p>
                </div>
                <Link to="/chats" className="text-link">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {conversations.length === 0 ? (
                <EmptyState
                  icon={MessagesSquare}
                  title="No private chats yet"
                  description="Send a chat request to a member to start a private conversation."
                >
                  <Link to="/discover" className="btn btn-secondary btn-sm">
                    Discover members
                  </Link>
                </EmptyState>
              ) : (
                <div className="mini-list">
                  {conversations.slice(0, 4).map((conversation) => (
                    <Link to={`/chats/${conversation.id}`} key={conversation.id} className="mini-row">
                      <Avatar
                        name={conversation.otherUser.fullName}
                        username={conversation.otherUser.username}
                        size={38}
                        status={resolveStatus(conversation.otherUser)}
                      />
                      <div className="mini-row-body">
                        <span className="mini-row-name">{conversation.otherUser.fullName}</span>
                        <span className="mini-row-snippet">
                          {conversation.lastMessage || 'No messages yet'}
                        </span>
                      </div>
                      <span className="mini-row-time">
                        {formatRelative(conversation.lastMessageAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="card panel">
              <div className="panel-header">
                <div>
                  <h2>Chat requests</h2>
                  <p>People waiting to connect with you</p>
                </div>
                <Link to="/requests/incoming" className="text-link">
                  All requests <ArrowRight size={14} />
                </Link>
              </div>
              {requests.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No pending requests"
                  description="When someone wants to chat privately, it will appear here."
                />
              ) : (
                <div className="request-stack">
                  {requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="request-row">
                      <Avatar name={request.senderName} username={request.senderUsername} size={38} />
                      <div className="request-row-body">
                        <span className="request-row-name">{request.senderName}</span>
                        <span className="request-row-meta">
                          @{request.senderUsername} · {formatRelative(request.createdAt)}
                        </span>
                      </div>
                      <div className="request-row-actions">
                        <button
                          type="button"
                          className="icon-button icon-button-success"
                          title="Accept"
                          disabled={actingOn === request.id}
                          onClick={() => handleRespond(request, 'accept')}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          title="Decline"
                          disabled={actingOn === request.id}
                          onClick={() => handleRespond(request, 'reject')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <aside className={`dashboard-rail ${railOpen ? '' : 'collapsed'}`.trim()}>
          <section className="card panel rail-panel">
            <form className="rail-search" onSubmit={handleSearch}>
              <Search size={16} />
              <input
                type="search"
                placeholder="Search people"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search people"
              />
            </form>
          </section>

          <section className="card panel rail-panel">
            <div className="panel-header compact">
              <div>
                <h2>Online now</h2>
                <p>{onlineCount} members available</p>
              </div>
              <span className="connection-dot" title={connected ? 'Connected' : 'Reconnecting'} />
            </div>
            {onlineUsers.length === 0 ? (
              <p className="rail-empty">No other members are online right now.</p>
            ) : (
              <div className="rail-list">
                {onlineUsers.slice(0, 6).map((member) => (
                  <Link to={`/users/${member.id}`} key={member.id} className="rail-user">
                    <Avatar
                      name={member.fullName}
                      username={member.username}
                      size={34}
                      status={resolveStatus(member)}
                    />
                    <div>
                      <span className="rail-user-name">{member.fullName}</span>
                      <span className="rail-user-handle">@{member.username}</span>
                    </div>
                    {resolveStatus(member) === 'LIVE' ? <LiveBadge /> : null}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card panel rail-panel">
            <div className="panel-header compact">
              <div>
                <h2>LIVE members</h2>
                <p>Actively chatting in the last 90s</p>
              </div>
            </div>
            {liveUsers.length === 0 ? (
              <p className="rail-empty">Nobody is marked LIVE at the moment.</p>
            ) : (
              <div className="rail-list">
                {liveUsers.slice(0, 5).map((member) => (
                  <Link to={`/users/${member.id}`} key={member.id} className="rail-user">
                    <Avatar name={member.fullName} username={member.username} size={34} status="LIVE" />
                    <div>
                      <span className="rail-user-name">{member.fullName}</span>
                      <span className="rail-user-handle">@{member.username}</span>
                    </div>
                    <LiveBadge />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
