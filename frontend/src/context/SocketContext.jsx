import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { WS_URL } from '../services/config';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const currentUserId = user?.id;

  const [connected, setConnected] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [toast, setToast] = useState(null);

  const clientRef = useRef(null);
  const globalListeners = useRef(new Set());
  const privateListeners = useRef(new Set());
  const requestListeners = useRef(new Set());
  const toastTimer = useRef(null);

  const notify = useCallback((message, tone = 'info') => {
    setToast({ id: Date.now(), message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5200);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  useEffect(() => {
    if (!token || !currentUserId) {
      setConnected(false);
      setStatuses({});
      return undefined;
    }

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      setConnected(true);
      setStatuses((previous) => ({ ...previous, [currentUserId]: 'ONLINE' }));

      client.subscribe('/topic/presence', (frame) => {
        try {
          const event = JSON.parse(frame.body);
          setStatuses((previous) => ({ ...previous, [event.userId]: event.status }));
        } catch {
          // Ignore malformed presence frames.
        }
      });

      client.subscribe('/topic/global', (frame) => {
        try {
          const message = JSON.parse(frame.body);
          globalListeners.current.forEach((listener) => listener(message));
        } catch {
          // Ignore malformed message frames.
        }
      });

      client.subscribe('/user/queue/private', (frame) => {
        try {
          const message = JSON.parse(frame.body);
          privateListeners.current.forEach((listener) => listener(message));
        } catch {
          // Ignore malformed message frames.
        }
      });

      client.subscribe('/user/queue/requests', (frame) => {
        try {
          const request = JSON.parse(frame.body);
          requestListeners.current.forEach((listener) => listener(request));
          if (request.receiverId === currentUserId && request.status === 'PENDING') {
            notify(`${request.senderName} sent you a chat request`, 'request');
          } else if (request.senderId === currentUserId && request.status === 'ACCEPTED') {
            notify(`${request.receiverName} accepted your chat request`, 'success');
          } else if (request.senderId === currentUserId && request.status === 'REJECTED') {
            notify(`${request.receiverName} declined your chat request`, 'error');
          }
        } catch {
          // Ignore malformed request frames.
        }
      });

      client.subscribe('/user/queue/errors', (frame) => {
        try {
          const error = JSON.parse(frame.body);
          notify(error.message || 'Message could not be delivered', 'error');
        } catch {
          notify('Message could not be delivered', 'error');
        }
      });
    };

    client.onStompError = () => {
      setConnected(false);
    };
    client.onWebSocketClose = () => {
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      setConnected(false);
      client.deactivate();
    };
  }, [token, currentUserId, notify]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const publish = useCallback((destination, body = {}) => {
    const client = clientRef.current;
    if (!client || !client.connected) return false;
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  }, []);

  const markActive = useCallback(() => {
    publish('/app/presence.active', {});
  }, [publish]);

  const subscribe = useCallback((registry, listener) => {
    registry.current.add(listener);
    return () => registry.current.delete(listener);
  }, []);

  const subscribeGlobal = useCallback(
    (listener) => subscribe(globalListeners, listener),
    [subscribe],
  );
  const subscribePrivate = useCallback(
    (listener) => subscribe(privateListeners, listener),
    [subscribe],
  );
  const subscribeRequests = useCallback(
    (listener) => subscribe(requestListeners, listener),
    [subscribe],
  );

  const value = useMemo(
    () => ({
      connected,
      statuses,
      toast,
      notify,
      dismissToast,
      publish,
      markActive,
      subscribeGlobal,
      subscribePrivate,
      subscribeRequests,
    }),
    [
      connected,
      statuses,
      toast,
      notify,
      dismissToast,
      publish,
      markActive,
      subscribeGlobal,
      subscribePrivate,
      subscribeRequests,
    ],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
