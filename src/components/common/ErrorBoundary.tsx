import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Hunkar24 ErrorBoundary] Uncaught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-red-700 dark:text-red-400 tracking-wider">
                हुंकार 24 — सिस्टम सूचना
              </span>
              <h2 className="text-xl font-bold font-newspaper-headline text-stone-900 dark:text-stone-100">
                {this.props.fallbackTitle || 'पृष्ठ लोड करने में अस्थायी समस्या'}
              </h2>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              पाठक अनुभव को सुरक्षित रखने हेतु इस घटक को पृथक कर दिया गया है। मुख्य वेबसाइट की अन्य सेवाएं निर्बाध रूप से चालू हैं।
            </p>

            {this.state.error && (
              <details className="text-left text-[11px] font-mono bg-stone-100 dark:bg-stone-800/80 p-3 rounded-lg text-stone-600 dark:text-stone-400 overflow-x-auto max-h-32">
                <summary className="cursor-pointer font-bold text-stone-700 dark:text-stone-300 mb-1">
                  तकनीकी विवरण देखें
                </summary>
                {this.state.error.message}
              </details>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>पुनः प्रयास करें</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>मुख्य पृष्ठ पर जाएं</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
