import Avatar from './Avatar';
import { formatTime } from '../utils/format';

export default function MessageBubble({ message, own, status }) {
  return (
    <div className={`message-row ${own ? 'own' : ''}`.trim()}>
      {!own ? (
        <Avatar name={message.senderName} username={message.senderUsername} size={34} />
      ) : null}
      <div className="message-body">
        <div className="message-meta">
          <span className="message-name">{message.senderName}</span>
          <span className="message-time">{formatTime(message.createdAt)}</span>
        </div>
        <div className="message-bubble">{message.content}</div>
      </div>
      {status ? <span className="sr-only">{status}</span> : null}
    </div>
  );
}
