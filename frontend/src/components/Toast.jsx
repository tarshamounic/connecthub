import { AlertCircle, CheckCircle2, Info, UserPlus, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  request: UserPlus,
  info: Info,
};

export default function Toast() {
  const { toast, dismissToast } = useSocket();
  if (!toast) return null;
  const Icon = ICONS[toast.tone] || Info;

  return (
    <div className={`toast toast-${toast.tone}`} role="status">
      <Icon size={18} />
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={dismissToast} aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}
