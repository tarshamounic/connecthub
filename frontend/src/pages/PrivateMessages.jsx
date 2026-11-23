import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessagesSquare, UserPlus } from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { LiveBadge } from '../components/Presence';
import { useSocket } from '../context/SocketContext';
import { conversationApi, getApiError } from '../services/api';
import { formatRelative } from '../utils/format';

export default function PrivateMessages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { statuses, subscribePrivate, subscribeRequests } = useSocket();

  const load = useCallback(async () => {
    try {
      const data = await conversationApi.list();
      setConversations(data);
      setError('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () =>
      subscribePrivate((message) => {
        setConversations((previous) => {
          if (!previous.some((conversation) => conversation.id === message.conversationId)) {
            load();
            return previous;
          }
          const next = previous.map((conversation) =>
            conversation.id === message.conversationId
              ? { ...conversation, lastMessage: message.content, lastMessageAt: message.createdAt }
              : conversation,
          );
          return next.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
      }),
    [subscribePrivate, load],
  );

  useEffect(() => subscribeRequests(() => load()), [subscribeRequests, load]);

  const statusOf = (conversation) =>
    statuses[conversation.otherUser.id] || conversation.otherUser.status || 'OFFLINE';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Messages"
        title="Private messages"
        subtitle="Only conversations created from accepted chat requests appear here."
        actions={
          <Link to="/discover" className="btn btn-secondary">
            <UserPlus size={16} /> Start a new chat
          </Link>
        }
      />

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <Loading label="Loading conversations…" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No private conversations yet"
          description="Send a chat request to a member. Once they accept, your conversation appears here."
        >
          <Link to="/discover" className="btn btn-primary btn-sm">
            Discover members
          </Link>
        </EmptyState>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const status = statusOf(conversation);
            return (
              <Link key={conversation.id} to={`/chats/${conversation.id}`} className="card conversation-row">
                <Avatar
                  name={conversation.otherUser.fullName}
                  username={conversation.otherUser.username}
                  size={48}
                  status={status}
                />
                <div className="conversation-body">
                  <div className="conversation-heading">
                    <span className="conversation-name">{conversation.otherUser.fullName}</span>
                    {status === 'LIVE' ? <LiveBadge /> : null}
                    <span className="muted small">@{conversation.otherUser.username}</span>
                  </div>
                  <p className="conversation-snippet">
                    {conversation.lastMessage || 'No messages yet — say hello!'}
                  </p>
                </div>
                <div className="conversation-meta">
                  <span>{formatRelative(conversation.lastMessageAt)}</span>
                  <ArrowRight size={17} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
