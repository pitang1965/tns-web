/**
 * ブラウザ検出とクロスブラウザ対応のユーティリティ
 */

/**
 * Facebook In-App Browserを検出
 */
export function isFacebookBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /FBAN|FBAV/.test(navigator.userAgent);
}

/**
 * Instagram In-App Browserを検出
 */
export function isInstagramBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Instagram/.test(navigator.userAgent);
}

/**
 * Line In-App Browserを検出
 */
export function isLineBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Line/.test(navigator.userAgent);
}

/**
 * Twitter In-App Browserを検出
 */
export function isTwitterBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Twitter/.test(navigator.userAgent);
}

/**
 * 任意のIn-App Browserを検出
 */
export function isInAppBrowser(): boolean {
  return (
    isFacebookBrowser() ||
    isInstagramBrowser() ||
    isLineBrowser() ||
    isTwitterBrowser()
  );
}

/**
 * AndroidのWebViewを検出
 */
export function isAndroidWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android/.test(ua) && /wv/.test(ua);
}

/**
 * 安全なpostMessage実行
 * Facebook In-App Browserなどでのエラーを防ぐ
 */
export function safePostMessage(
  targetWindow: Window,
  message: any,
  origin: string = '*'
): boolean {
  if (typeof window === 'undefined') return false;

  // In-App Browserでは制限があるためpostMessageをスキップ
  if (isInAppBrowser()) {
    console.log('postMessage skipped in In-App Browser environment');
    return false;
  }

  try {
    targetWindow.postMessage(message, origin);
    return true;
  } catch (error) {
    console.warn('postMessage failed:', error);
    return false;
  }
}

/**
 * 安全なwindow.open実行
 * In-App Browserでの制限を考慮
 */
export function safeWindowOpen(
  url: string,
  target: string = '_blank',
  features?: string
): Window | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.open(url, target, features);
  } catch (error) {
    console.warn('window.open failed, falling back to location change:', error);

    // フォールバック: 現在のウィンドウでページを開く
    if (target === '_blank') {
      window.location.href = url;
    } else {
      window.location.assign(url);
    }
    return null;
  }
}

/**
 * 安全なnavigator.share実行
 */
export function safeSocialShare(data: ShareData): Promise<boolean> {
  return new Promise((resolve) => {
    // Web Share API対応チェック
    if (typeof navigator === 'undefined' || !navigator.share) {
      resolve(false);
      return;
    }

    // In-App Browserでは制限がある場合があるため、エラーハンドリングを強化
    navigator
      .share(data)
      .then(() => resolve(true))
      .catch((error) => {
        console.warn('Social share failed:', error);
        resolve(false);
      });
  });
}

/**
 * 安全なclipboard.writeText実行
 */
export function safeClipboardWrite(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      resolve(false);
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => resolve(true))
      .catch((error) => {
        console.warn('Clipboard write failed:', error);
        resolve(false);
      });
  });
}

/**
 * In-App Browser環境での警告メッセージを生成
 */
export function getInAppBrowserWarning(): string {
  if (isFacebookBrowser()) {
    return 'Facebook内のブラウザをご利用中です。一部機能が制限される場合があります。';
  }
  if (isInstagramBrowser()) {
    return 'Instagram内のブラウザをご利用中です。一部機能が制限される場合があります。';
  }
  if (isLineBrowser()) {
    return 'LINE内のブラウザをご利用中です。一部機能が制限される場合があります。';
  }
  if (isTwitterBrowser()) {
    return 'Twitter内のブラウザをご利用中です。一部機能が制限される場合があります。';
  }
  return 'アプリ内ブラウザをご利用中です。一部機能が制限される場合があります。';
}
