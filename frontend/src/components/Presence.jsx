export function PresenceLabel({ status = 'OFFLINE', showText = true }) {
  const normalized = (status || 'OFFLINE').toLowerCase();
  const text = status === 'LIVE' ? 'LIVE' : status === 'ONLINE' ? 'Online' : 'Offline';
  return (
    <span className={`presence presence-${normalized}`}>
      <span className="presence-dot" />
      {showText ? text : null}
    </span>
  );
}

export function LiveBadge() {
  return <span className="live-badge">LIVE</span>;
}

export default PresenceLabel;
