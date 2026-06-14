import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(url = 'ws://localhost:4000', onOrder) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => { setConnected(true); retryCount.current = 0; };
      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
        retryCount.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      };
      ws.onerror = () => { ws.close(); };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.id) onOrder?.(data);
        } catch { /* ignore parse errors */ }
      };
    } catch { setConnected(false); }
  }, [url, onOrder]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
