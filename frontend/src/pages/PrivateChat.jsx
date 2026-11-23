import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, MessageCircle, Send } from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import MessageBubble from '../components/MessageBubble';
import { LiveBadge, PresenceLabel } from '../components/Presence';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { conversationApi, getApiError } from '../services/api';

export default function PrivateChat() {
  const { id } = useParams();
  const conversationId = Number(id);
  const { user } = useAuth();
  const { statuses, connected, publish, markActive, subscribePrivate, notify } = useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const appendMessage = useCallback((message) => {
    setMessages((previous) =>
      previous.some((item) => item.id === message.id) ? previous : [...previous, message],
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setError('');
    try {
      const [details, history] = await Promise.all([
        conversationApi.get(conversationId),
        conversationApi.messages(conversationId),
      ]);
      setConversation(details);
      setMessages(history);
    } catch (err) {
      if ([403, 404].includes(err.response?.status)) {
        setForbidden(true);
      } else {
        setError(getApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (Number.isNaN(conversationId)) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    load();
  }, [conversationId, load]);

  useEffect(
    () =>
      subscribePrivate((message) => {
        if (message.conversationId === conversationId) {
          appendMessage(message);
        }
      }),
    [subscribePrivate, appendMessage, conversationId],
  );

  useEffect(() => {
    if (connected) markActive();
  }, [connected, markActive]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (event) => {
    event?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    if (publish('/app/private.send', { conversationId, content })) {
      setText('');
      markActive();
      return;
    }

    setSending(true);
    try {
      const message = await conversationApi.send(conversationId, content);
      appendMessage(message);
      setText('');
    } catch (err) {
      notify(getApiError(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (loading) return <Loading label="Opening conversation…" />;

  if (forbidden) {
    return (
      <div className="page">
        <Link to="/chats" className="back-link">
          <ArrowLeft size={16} /> Back to conversations
        </Link>
        <EmptyState
          icon={Lock}
          title="Conversation unavailable"
          description="Private chats are limited to participants of an accepted chat request."
        >
          <Link to="/chats" className="btn btn-secondary btn-sm">
            View my conversations
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="page">
        <Link to="/chats" className="back-link">
          <ArrowLeft size={16} /> Back to conversations
        </Link>
        <div className="alert alert-error">{error || 'Conversation not found'}</div>
      </div>
    );
  }

  const other = conversation.otherUser;
  const otherStatus = statuses[other.id] || other.status || 'OFFLINE';

  return (
    <div className="chat-page">
      <Link to="/chats" className="back-link">
        <ArrowLeft size={16} /> All conversations
      </Link>
      <div className="card chat-card">
        <div className="chat-header">
          <div className="chat-room">
            <Link to={`/users/${other.id}`}>
              <Avatar name={other.fullName} username={other.username} size={42} status={otherStatus} />
            </Link>
            <div>
              <h2>
                <Link to={`/users/${other.id}`} className="chat-title-link">
                  {other.fullName}
                </Link>
                {otherStatus === 'LIVE' ? <LiveBadge /> : null}
              </h2>
              <p>
                @{other.username} · <PresenceLabel status={otherStatus} />
              </p>
            </div>
          </div>
          <div className="chat-header-right">
            <span className="private-pill">
              <Lock size={13} /> Private
            </span>
            <span className={`realtime-pill ${connected ? 'on' : 'off'}`.trim()}>
              <span className={`socket-dot ${connected ? '' : 'off'}`.trim()} />
              {connected ? 'Live updates' : 'Reconnecting'}
            </span>
          </div>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Say hello"
              description={`This is the beginning of your private conversation with ${other.fullName}.`}
            />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                own={message.senderId === user?.id}
              />
            ))
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSend}>
          <Avatar name={user?.fullName} username={user?.username} size={36} />
          <textarea
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => connected && markActive()}
            placeholder={`Message ${other.fullName.split(' ')[0]}…`}
            maxLength={2000}
            aria-label={`Message ${other.fullName}`}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!text.trim() || sending}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="composer-hint">Only you and {other.fullName} can read this conversation.</p>
      </div>
    </div>
  );
}
