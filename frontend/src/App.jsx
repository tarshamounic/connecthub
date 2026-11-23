import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GlobalChat from './pages/GlobalChat';
import DiscoverUsers from './pages/DiscoverUsers';
import UserProfile from './pages/UserProfile';
import ChatRequests from './pages/ChatRequests';
import PrivateMessages from './pages/PrivateMessages';
import PrivateChat from './pages/PrivateChat';
import Settings from './pages/Settings';

function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">
        <span className="brand-mark large">
          <span className="splash-glyph">C</span>
        </span>
        <div>
          <strong>ConnectHub</strong>
          <span>Preparing your workspace…</span>
        </div>
      </div>
      <span className="spinner" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { ready, token, user } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function PublicOnly({ children }) {
  const { ready, token, user } = useAuth();
  if (!ready) return <Splash />;
  if (token && user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="global" element={<GlobalChat />} />
        <Route path="discover" element={<DiscoverUsers />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="chats" element={<PrivateMessages />} />
        <Route path="chats/:id" element={<PrivateChat />} />
        <Route path="requests" element={<Navigate to="/requests/incoming" replace />} />
        <Route path="requests/incoming" element={<ChatRequests mode="incoming" />} />
        <Route path="requests/outgoing" element={<ChatRequests mode="outgoing" />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
