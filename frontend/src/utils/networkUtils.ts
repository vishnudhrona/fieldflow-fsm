export const isDeviceOnline = (): boolean => {
  try {
    const simulated = localStorage.getItem('fsm_simulated_network');
    if (simulated === 'OFFLINE') return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  } catch {
    return true;
  }
};

