import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Settings as SettingsIcon,
  Users,
  Inbox,
  X,
} from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/global', label: 'Global Chat', icon: MessageCircle },
  { to: '/discover', label: 'Discover Users', icon: Users },
  { to: '/chats', label: 'Private Messages', icon: MessagesSquare },
  { to: '/requests/incoming', label: 'Chat Requests', icon: Inbox, match: '/requests' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { statuses } = useSocket();
  const navigate = useNavigate();
  const ownStatus = statuses[user?.id] || 'ONLINE';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`.trim()}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <MessageCircle size={20} />
          </span>
          <div>
            <span className="brand-name">ConnectHub</span>
            <span className="brand-tagline">Real-time messaging</span>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Workspace</span>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, match }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link ${isActive || (match && window.location.pathname.startsWith(match)) ? 'active' : ''}`.trim()
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user?.fullName} username={user?.username} size={38} status={ownStatus} />
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.fullName}</span>
              <span className="sidebar-user-handle">@{user?.username}</span>
            </div>
            <button type="button" className="icon-button" onClick={handleLogout} title="Log out" aria-label="Log out">
              <LogOut size={17} />
            </button>
          </div>
          <p className="sidebar-note">Signed in securely with JWT</p>
        </div>
      </aside>
      {open ? <button type="button" className="sidebar-backdrop" onClick={onClose} aria-label="Close menu" /> : null}
    </>
  );
}
