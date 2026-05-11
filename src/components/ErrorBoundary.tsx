import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error);
    }
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold">
            {this.props.fallbackTitle ?? "Une erreur est survenue"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {this.props.fallbackMessage ??
              "Désolé, quelque chose ne s'est pas passé comme prévu. Veuillez réessayer."}
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={this.reset}>Réessayer</Button>
            <Button variant="outline" asChild>
              <a href="/">Retour à l'accueil</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
