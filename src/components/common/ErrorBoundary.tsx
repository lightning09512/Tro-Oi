import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '20px' }}>
              ⚠️ Đã xảy ra lỗi khi khởi chạy ứng dụng
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.5' }}>
              {this.state.error?.message || 'Lỗi không xác định trong quá trình render.'}
            </p>
            <pre style={{
              background: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#334155',
              overflow: 'auto',
              maxHeight: '260px'
            }}>
              {this.state.error?.stack || 'Không có stack trace.'}
            </pre>
            <button
              onClick={() => {
                window.localStorage.clear()
                window.sessionStorage.clear()
                window.location.reload()
              }}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#245f3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Xóa cache & Tải lại trang
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
