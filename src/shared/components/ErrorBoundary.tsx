import React, { ErrorInfo, ReactNode } from 'react';
import { WarningIcon } from './icons';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    name?: string; // Para identificar dónde falló en los logs
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // @ts-expect-error - TypeScript strict mode issue with class components
        console.error(`Uncaught error in ${this.props?.name || 'component'}:`, error, errorInfo);
    }

    private handleRetry = (): void => {
        // @ts-expect-error - TypeScript strict mode issue with class components
        this.setState({ hasError: false, error: null });
    };

    public render(): ReactNode {
        if (this.state.hasError) {
            // @ts-expect-error - TypeScript strict mode issue with class components
            if (this.props?.fallback) {
                // @ts-expect-error - TypeScript strict mode issue with class components
                return this.props.fallback;
            }

            const isTimeout = this.state.error?.message.includes('Tiempo de espera') || this.state.error?.message.includes('network');

            return (
                <div className="p-6 bg-red-50 rounded-lg border border-red-100 flex flex-col items-center justify-center text-center min-h-[250px]">
                    <div className="bg-red-100 p-4 rounded-full mb-4 text-red-600 shadow-sm">
                        <WarningIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-red-800 mb-2">
                        {isTimeout ? 'Problema de conexión' : 'Algo salió mal'}
                    </h3>
                    <p className="text-sm text-red-600 mb-6 max-w-sm leading-relaxed">
                        {isTimeout 
                            ? 'La solicitud tardó demasiado. Por favor, verifica tu conexión a internet e inténtalo de nuevo.' 
                            : 'No pudimos cargar esta sección correctamente debido a un error inesperado.'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-6 py-3 bg-white border border-red-300 text-red-700 font-bold rounded-lg hover:bg-red-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            );
        }

        // @ts-expect-error - TypeScript strict mode issue with class components
        return this.props?.children;
    }
}
