import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121316] text-[#ece9e3] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="max-w-md bg-[#1a1c20] border border-[#2b2e34] rounded-lg p-8 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-amber-400">Something went wrong</h2>
            <p className="text-xs text-[#8d9199]">
              An error occurred while displaying the application. Click below to reload and restore state.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-red-400 bg-black/50 p-3 rounded text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#8b7bff] text-white text-xs font-bold rounded-full hover:opacity-90 cursor-pointer transition-all"
            >
              Reload Portfolio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
