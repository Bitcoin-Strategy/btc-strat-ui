import { AlertTriangle, RotateCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { reportError } from '../../lib/errors';

type Props = {
  children: ReactNode;
  section?: string;
};

type State = { error: Error | null };

/** Keeps the rest of the app usable when a component throws. Recovery is a reload. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(this.props.section ?? 'render', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const described = reportError(this.props.section ?? 'render', error);

    return (
      <div className="border-border bg-card mx-4 my-6 rounded-xl border p-6 sm:mx-6 sm:p-8 lg:mx-8">
        <div className="mb-3 flex items-center gap-3">
          <AlertTriangle size={22} className="text-orange shrink-0" />
          <h2 className="text-lg font-bold text-white">
            {this.props.section
              ? `The ${this.props.section} page stopped working`
              : 'This page stopped working'}
          </h2>
        </div>
        <p className="text-muted mb-1 text-sm">{described.detail}</p>
        <p className="text-muted mb-6 text-sm">
          Nothing on chain was affected — this is the interface, not the
          protocol. The rest of the app still works.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="border-border bg-dark inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-white hover:border-white/30"
        >
          <RotateCw size={14} />
          Reload
        </button>
      </div>
    );
  }
}
