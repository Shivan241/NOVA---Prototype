/*
 * React ErrorBoundary catching runtime rendering exceptions with recovery action.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected interface error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('NOVA ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--nova-bg)] text-[var(--nova-text)]">
          <div className="nova-surface max-w-md w-full rounded-2xl p-6 space-y-4">
            <h1 className="text-lg font-semibold">Something interrupted NOVA</h1>
            <p className="text-sm text-[var(--nova-text-muted)]">
              {this.state.message}
            </p>
              <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 rounded-xl nova-btn-primary text-sm transition-colors nova-accent-ring cursor-pointer"
            >
              Recover View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
