import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ||
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3001');

export const useWebSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    // Listen for notifications
    socketRef.current.on('new_commission', (data) => {
      setNotifications(prev => [...prev, {
        type: 'commission',
        ...data,
        id: Date.now()
      }]);
    });

    socketRef.current.on('new_referral', (data) => {
      setNotifications(prev => [...prev, {
        type: 'referral',
        ...data,
        id: Date.now()
      }]);
    });

    socketRef.current.on('achievement_unlocked', (data) => {
      setNotifications(prev => [...prev, {
        type: 'achievement',
        ...data,
        id: Date.now()
      }]);
    });

    socketRef.current.on('rank_up', (data) => {
      setNotifications(prev => [...prev, {
        type: 'rank_up',
        ...data,
        id: Date.now()
      }]);
    });

    socketRef.current.on('withdrawal_update', (data) => {
      setNotifications(prev => [...prev, {
        type: 'withdrawal',
        ...data,
        id: Date.now()
      }]);
    });

    socketRef.current.on('security_alert', (data) => {
      setNotifications(prev => [...prev, {
        type: 'security',
        ...data,
        id: Date.now()
      }]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    emit,
    clearNotification,
    clearAllNotifications
  };
};

export default useWebSocket;
