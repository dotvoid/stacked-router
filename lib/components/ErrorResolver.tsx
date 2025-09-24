import { ErrorInfo } from 'react'
import { useRouter } from '../hooks/useRouter'

// Helper component to resolve and render the appropriate error component
export function ErrorResolver({
  viewUrl,
  error,
  errorCode,
  errorInfo,
  reset
}: {
  viewUrl: string
  error: Error
  errorCode?: number
  errorInfo?: ErrorInfo
  reset: () => void
}) {
  const { clientRouter } = useRouter()
  const ErrorComponent = clientRouter?.getErrorComponentByPath(
    clientRouter?.getPathFromUrl(viewUrl) ?? '/'
  )

  if (ErrorComponent) {
    return (
      <ErrorComponent
        error={error}
        errorCode={errorCode ?? 0}
        errorInfo={errorInfo}
        reset={reset}
      />
    )
  }

  // Fallback error UI when no _error.tsx is found
  return (
    <div style={{
      margin: '10px',
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px'
    }}>
      <h1 style={{ color: '#c92a2a', marginBottom: '10px', fontWeight: 'bold' }}>
        Unhandled error
      </h1>
      <p style={{ marginBottom: '15px', textAlign: 'center' }}>
        {error.message}
      </p>

      {/* Show error details */}
      <details style={{ marginBottom: '15px', width: '100%' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '10px', textAlign: 'center' }}>
          Technical details
        </summary>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px',
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Stack Trace:</h4>
          <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
            {error.stack}
          </pre>

          {errorInfo?.componentStack && (
            <>
              <h4 style={{ margin: '15px 0 10px 0', fontSize: '14px' }}>Component Stack:</h4>
              <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                {errorInfo.componentStack}
              </pre>
            </>
          )}
        </div>
      </details>

      <button
        onClick={reset}
        style={{
          backgroundColor: '#228be6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  )
}
