'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { H2, Text } from '@/components/common/Typography';
import { Button } from '@/components/ui/button';
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
    console.error('Uncaught error:', error, errorInfo);

    // エラー情報をstateに保存
    this.setState({
      error,
      errorInfo,
    });

    // 本番環境ではSentryにログ送信
    if (process.env.NODE_ENV !== 'development') {
      logger.error(error, {
        componentStack: errorInfo.componentStack,
        digest: (error as any).digest, // Server Components error digest
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center min-h-[400px] p-6'>
          <H2 className='mb-4'>
            問題が発生しました。ご不便をおかけして申し訳ございません。
          </H2>

          {/* アクションボタン */}
          <div className='mt-6 mb-8'>
            <Button onClick={() => window.location.reload()} variant='outline'>
              ページをリロード
            </Button>
          </div>

          {/* エラーの詳細は開発環境でのみ表示する */}
          {process.env.NODE_ENV === 'development' && (
            <details
              className='w-full max-w-3xl'
              style={{ whiteSpace: 'pre-wrap' }}
            >
              <summary className='text-lg mb-6 text-gray-700 dark:text-gray-300 cursor-pointer'>
                エラー詳細 (開発環境のみ)
              </summary>
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
