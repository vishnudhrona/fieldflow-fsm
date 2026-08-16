import type { FC } from 'react';
import { Wifi, WifiOff, type LucideIcon } from 'lucide-react';
import { useNetwork, type NetworkMode } from '../context/NetworkContext';
import { Button } from './ui';

interface ModeConfig {
  value: NetworkMode;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}

const MODES: ModeConfig[] = [
  {
    value: 'ONLINE',
    label: 'Online',
    icon: Wifi,
    activeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold'
  },
  {
    value: 'OFFLINE',
    label: 'Offline',
    icon: WifiOff,
    activeClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20 font-bold'
  }
];

interface NetworkSimulatorProps {
  mode?: 'badge' | 'simulator';
}

export const NetworkSimulator: FC<NetworkSimulatorProps> = ({ mode = 'simulator' }) => {
  const { networkMode, setNetworkMode, browserOnline, isOnline } = useNetwork();
  const currentActiveMode = browserOnline ? networkMode : 'OFFLINE';

  return (
    <>
      {mode === 'badge' ? (
        <div className="mb-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all duration-300 ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-250' 
              : 'bg-rose-50 text-rose-600 border-rose-250 animate-pulse'
          }`}>
            <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      ) : (
        <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-full p-1 shadow-sm">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = currentActiveMode === m.value;
            const isDisabled = !browserOnline && m.value !== 'OFFLINE';
            
            return (
              <Button
                key={m.value}
                variant='ghost'
                size='sm'
                disabled={isDisabled}
                onClick={() => !isDisabled && setNetworkMode(m.value)}
                leftIcon={<Icon className="w-3.5 h-3.5" />}
                className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 shadow-none hover:bg-transparent ${
                  isActive 
                    ? m.activeClass 
                    : isDisabled
                      ? 'text-slate-300 opacity-40 border-transparent'
                      : 'text-slate-400 hover:text-slate-600 border-transparent'
                }`}
              >
                {m.label}
              </Button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default NetworkSimulator;
