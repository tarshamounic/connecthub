import { useCallback, useEffect, useRef, useState } from 'react';
import { Hash, MessageCircle, Send } from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import MessageBubble from '../components/MessageBubble';
import { LiveBadge, PresenceLabel } from '../components/Presence';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getApiError, globalApi } from '../services/api';

export default function GlobalChat() {
  const { user } = useAuth();
  const { statuses, connected, publish, markActive, subscribeGlobal, notify } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const ownStatus = statuses[user?.id] || 'ONLINE';

  const appendMessage = useCallback((message) => {
    setMessages((previous) =>
      previous.some((item) => item.id === message.id) ? previous : [...previous, message],
    );
  }, []);

  useEffect(() => {
    let active = true;
    globalApi
      .messages()
      .then((data) => {
        if (active) setMessages(data);
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

  useEffect(() => subscribeGlobal(appendMessage), [subscribeGlobal, appendMessage]);

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

    if (publish('/app/global.send', { content })) {
      setText('');
      markActive();
      return;
    }

    setSending(true);
    try {
      const message = await globalApi.send(content);
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

  return (
    <div className="chat-page">
      <div className="card chat-card">
        <div className="chat-header">
          <div className="chat-room">
            <span className="room-icon">
              <Hash size={20} />
            </span>
            <div>
              <h2>
                Global Chat {ownStatus === 'LIVE' ? <LiveBadge /> : null}
              </h2>
              <p>Everyone can join · real-time community room</p>
            </div>
          </div>
          <div className="chat-header-right">
            <PresenceLabel status={ownStatus} />
            <span className={`realtime-pill ${connected ? 'on' : 'off'}`.trim()}>
              <span className={`socket-dot ${connected ? '' : 'off'}`.trim()} />
              {connected ? 'Live updates' : 'Reconnecting'}
            </span>
          </div>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {loading ? (
            <Loading label="Loading messages…" />
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              description="Kick things off — send the first message to the whole community."
            />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                own={message.senderId === user?.id}
                status={statuses[message.senderId]}
              />
            ))
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSend}>
          <Avatar name={user?.fullName} username={user?.username} size={36} status={ownStatus} />
          <textarea
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => connected && markActive()}
            placeholder="Message the community…"
            maxLength={2000}
            aria-label="Message the global chat"
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
        <p className="composer-hint">Enter to send · Shift + Enter for a new line</p>
      </div>
    </div>
  );
}
