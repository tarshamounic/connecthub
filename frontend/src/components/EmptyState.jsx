export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty-state">
      {Icon ? (
        <span className="empty-icon">
          <Icon size={22} />
        </span>
      ) : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {children ? <div className="empty-actions">{children}</div> : null}
    </div>
  );
}
