'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { H2, LargeText, Text } from '@/components/common/Typography';
import { logger } from '@/lib/logger';

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

    if (process.env.NODE_ENV !== 'development') {
      logger.error(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <H2>問題が発生しました。ご不便をおかけして申し訳ございません。</H2>
          {/* エラーの詳細は開発環境でのみ表示する */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <LargeText>
                <summary>エラー詳細 (開発環境のみ)</summary>
              </LargeText>
              <Text>{this.state.error && this.state.error.toString()}</Text>
              <br />
              <Text>{this.state.errorInfo?.componentStack}</Text>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
