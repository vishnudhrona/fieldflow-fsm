let verifiedConnectivity: boolean | null = null;

export const setVerifiedConnectivityStatus = (isOnline: boolean | null): void => {
  verifiedConnectivity = isOnline;
};

export const isDeviceOnline = (): boolean => {
  try {
    const simulated = localStorage.getItem('fsm_simulated_network');
    if (simulated === 'OFFLINE') return false;
    if (verifiedConnectivity !== null) return verifiedConnectivity;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  } catch {
    return true;
  }
};


