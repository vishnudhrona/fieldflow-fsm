import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type NetworkMode = 'ONLINE' | 'OFFLINE';

interface NetworkContextType {
  isOnline: boolean;
  browserOnline: boolean;
  networkMode: NetworkMode;
  reconnectCount: number;
  setNetworkMode: (mode: NetworkMode) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [networkMode, setNetworkModeState] = useState<NetworkMode>(() => {
    return (localStorage.getItem('fsm_simulated_network') as NetworkMode) || 'ONLINE';
  });
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    const pingUrl = 'https://clients3.google.com/generate_204';

    const checkConnectivity = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setBrowserOnline(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(pingUrl, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        setBrowserOnline((prev) => {
          if (!prev && networkMode !== 'OFFLINE') {
            setReconnectCount((c) => c + 1);
            window.dispatchEvent(new CustomEvent('app:online_reconnect'));
          }
          return true;
        });
      } catch (err) {
        setBrowserOnline(false);
      }
    };

    const handleOnline = () => {
      checkConnectivity();
      if (networkMode !== 'OFFLINE') {
        setReconnectCount((c) => c + 1);
        window.dispatchEvent(new CustomEvent('app:online_reconnect'));
      }
    };

    const handleOffline = () => {
      setBrowserOnline(false);
    };

    checkConnectivity();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const intervalId = setInterval(checkConnectivity, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [networkMode]);

  const setNetworkMode = (mode: NetworkMode) => {
    localStorage.setItem('fsm_simulated_network', mode);
    setNetworkModeState(mode);
    if (mode === 'ONLINE' && browserOnline) {
      setReconnectCount((c) => c + 1);
      window.dispatchEvent(new CustomEvent('app:online_reconnect'));
    }
  };

  const isOnline = browserOnline && networkMode !== 'OFFLINE';

  return (
    <NetworkContext.Provider value={{ isOnline, browserOnline, networkMode, reconnectCount, setNetworkMode }}>
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useNetwork must be used within a NetworkProvider');
  return context;
}
