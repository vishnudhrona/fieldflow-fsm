import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center'>
          <div className='bg-white max-w-md w-full rounded-3xl p-8 border border-slate-200 shadow-xl space-y-5'>
            <div className='w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D12026] mx-auto shadow-xs'>
              <AlertTriangle className='w-7 h-7 stroke-[2.2]' />
            </div>

            <div className='space-y-1.5'>
              <h2 className='text-xl font-black text-slate-900 tracking-tight'>
                Something went wrong
              </h2>
              <p className='text-xs text-slate-500 leading-relaxed'>
                An unexpected application error occurred. Your offline changes in IndexedDB storage remain safely preserved.
              </p>
            </div>

            {this.state.error?.message && (
              <div className='p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono text-slate-600 max-h-24 overflow-y-auto'>
                {this.state.error.message}
              </div>
            )}

            <Button
              fullWidth
              size='md'
              leftIcon={<RefreshCw className='w-4 h-4 stroke-[2.2]' />}
              onClick={this.handleReload}
              className='bg-[#D12026] hover:bg-[#B11A1F] text-white font-extrabold rounded-xl py-3 border-0 shadow-md cursor-pointer'
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
