import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Toast from './Toast';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TITLES = [
  { match: /^\/$/, title: 'Dashboard', eyebrow: 'Workspace' },
  { match: /^\/global/, title: 'Global Chat', eyebrow: 'Community' },
  { match: /^\/discover/, title: 'Discover Users', eyebrow: 'Community' },
  { match: /^\/users\//, title: 'Member Profile', eyebrow: 'Community' },
  { match: /^\/chats\/\d+/, title: 'Private Chat', eyebrow: 'Messages' },
  { match: /^\/chats/, title: 'Private Messages', eyebrow: 'Messages' },
  { match: /^\/requests\/incoming/, title: 'Incoming Requests', eyebrow: 'Chat Requests' },
  { match: /^\/requests\/outgoing/, title: 'Outgoing Requests', eyebrow: 'Chat Requests' },
  { match: /^\/settings/, title: 'Settings', eyebrow: 'Account' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { connected, statuses } = useSocket();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const page = TITLES.find((item) => item.match.test(location.pathname)) || TITLES[0];
  const ownStatus = statuses[user?.id] || 'ONLINE';

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <span className="topbar-eyebrow">{page.eyebrow}</span>
              <span className="topbar-title">{page.title}</span>
            </div>
          </div>
          <div className="topbar-right">
            <span
              className={`socket-pill ${connected ? 'socket-on' : 'socket-off'}`}
              title={connected ? 'Real-time connection active' : 'Reconnecting to real-time updates'}
            >
              <span className="socket-dot" />
              {connected ? 'Live' : 'Connecting'}
            </span>
            <Link to="/settings" className="topbar-profile" aria-label="Open settings">
              <Avatar name={user?.fullName} username={user?.username} size={34} status={ownStatus} />
              <span>{user?.fullName?.split(' ')[0]}</span>
            </Link>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
