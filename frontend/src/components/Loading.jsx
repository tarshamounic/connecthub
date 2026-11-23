export default function Loading({ label = 'Loading…', inline = false }) {
  return (
    <div className={`loading ${inline ? 'loading-inline' : ''}`.trim()} role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
