'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo); // TODO： 最終的に削除？

    logger.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>問題が発生しました。ご不便をおかけして申し訳ございません。</h1>
          {/* エラーの詳細は開発環境でのみ表示する */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>エラー詳細 (開発環境のみ)</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
