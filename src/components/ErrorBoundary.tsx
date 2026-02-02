import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

/**
 * Evita a “tela preta” quando algum componente lança erro durante render.
 * Em produção, mostra uma tela de recuperação; em dev, ainda veremos o stack trace.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Loga sempre (inclusive em produção) para facilitar debug.
    // Não exibimos detalhes do erro para o usuário final.
    console.error("[ErrorBoundary] Uncaught render error", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="galaxy-bg" />
        <div className="glass-panel relative z-10 w-full max-w-lg p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold">Ops, algo deu errado</h1>
          <p className="text-muted-foreground">
            O app encontrou um erro inesperado. Clique em “Tentar novamente” ou “Recarregar página”.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Button variant="secondary" onClick={this.handleTryAgain}>
              Tentar novamente
            </Button>
            <Button onClick={this.handleReload}>Recarregar página</Button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs p-3 rounded-lg bg-muted/50 border border-border/50 overflow-auto max-h-40">
              {String(this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
