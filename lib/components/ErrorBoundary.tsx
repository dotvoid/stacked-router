import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorResolver } from './ErrorResolver'

interface Props {
  children: ReactNode
  viewUrl: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in view ${this.props.viewUrl}:`, error, errorInfo)
    // Store the errorInfo in state so it can be passed to the error component
    this.setState({ errorInfo })
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    return (!this.state.hasError || !this.state.error)
      ? this.props.children
      : (
        <ErrorResolver
          viewUrl={this.props.viewUrl}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={this.reset}
        />
      )
  }
}
