import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface State {
  error: Error | null
}

/**
 * Atrapa cualquier error de render para que la app no quede en blanco.
 * Muestra una pantalla con botón de recargar en vez de una página vacía.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crema px-6 text-center">
        <p className="text-marca text-5xl font-black tracking-tight">Ups</p>
        <p className="max-w-xs text-sm text-tinta-2">
          Algo se rompió al mostrar esta pantalla. Recargá para seguir.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-azul-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-500"
        >
          Recargar
        </button>
      </div>
    )
  }
}
