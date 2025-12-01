
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WarningIcon } from './icons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string; // Para identificar dónde falló en los logs
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
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-6 bg-red-50 rounded-lg border border-red-100 flex flex-col items-center justify-center text-center min-h-[200px]">
                    <div className="bg-red-100 p-3 rounded-full mb-3 text-red-600">
                        <WarningIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Algo salió mal</h3>
                    <p className="text-sm text-red-600 mb-4 max-w-xs">
                        No pudimos cargar esta sección correctamente.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors text-sm shadow-sm"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
