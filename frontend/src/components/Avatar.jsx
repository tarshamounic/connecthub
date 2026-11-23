import { avatarColor, initials } from '../utils/format';

export default function Avatar({ name, username, size = 44, status, className = '' }) {
  const label = initials(name, username);
  const color = avatarColor(username || name || '');
  return (
    <span
      className={`avatar ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: color }}
      aria-hidden="true"
    >
      {label}
      {status ? <span className={`avatar-status ${status.toLowerCase()}`} /> : null}
    </span>
  );
}
