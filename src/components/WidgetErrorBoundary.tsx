/**
 * Widget Error Boundary
 * 
 * Catches JavaScript errors in widget components and displays
 * a fallback UI instead of crashing the entire application.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
    children: ReactNode;
    widgetId: string;
    widgetTitle?: string;
    onRemove?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error for debugging (could be sent to error tracking service)
        console.error('Widget Error:', {
            widgetId: this.props.widgetId,
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleRemove = (): void => {
        if (this.props.onRemove) {
            this.props.onRemove();
        }
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-900/20 to-orange-900/20">
                    {/* Error Icon */}
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>

                    {/* Error Title */}
                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                        Widget Yüklenemedi
                    </h3>

                    {/* Widget Info */}
                    {this.props.widgetTitle && (
                        <p className="text-sm text-gray-400 mb-4">
                            {this.props.widgetTitle}
                        </p>
                    )}

                    {/* Error Message */}
                    <div className="max-w-xs text-center mb-6">
                        <p className="text-xs text-gray-500 break-words">
                            {this.state.error?.message || 'Bilinmeyen hata'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
                        >
                            <RefreshCw size={16} />
                            Tekrar Dene
                        </button>

                        {this.props.onRemove && (
                            <button
                                onClick={this.handleRemove}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                            >
                                <X size={16} />
                                Kaldır
                            </button>
                        )}
                    </div>

                    {/* Developer Info (only in development) */}
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <details className="mt-6 max-w-full">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                Geliştirici Bilgisi
                            </summary>
                            <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-gray-400 overflow-auto max-h-32 max-w-xs">
                                {this.state.error?.stack?.slice(0, 500)}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default WidgetErrorBoundary;
