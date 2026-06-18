import React from 'react';

// Per-subsection error boundary (Spec J "Resilience"): if one metric throws
// (NaN/undefined), the rest of the dashboard stays visible. Fallback is a small
// inline notice, never a blank page or a crash.
export default class StatsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || 'Unknown error' };
  }

  componentDidCatch(err, info) {
    // Non-fatal — log for debugging only.
    console.warn('[TeacherStatistics] subsection error:', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {this.props.label || 'This section'} couldn’t be displayed.
          <span className="block text-xs text-gray-400 mt-1">{this.state.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
