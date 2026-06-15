'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsClient } from '@/hooks/useIsClient';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Platform = 'android' | 'ios-safari';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const DISMISS_KEY = 'pwaInstallBannerDismissedAt';
const SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000; // 却下後7日間は再表示しない
const DWELL_MS = 5000; // 対象ページで5秒滞在してから表示

function trackEvent(event: string, platform: Platform | 'unknown') {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, { pwa_platform: platform });
  }
}

// 既にインストール済み（スタンドアロン起動）かどうか
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

// モバイルのみ対象。iOSはSafariのときだけ（他ブラウザ/webviewはインストール不可）
function detectPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || navigator.vendor || '';

  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ は Mac として報告されるため touch で判定
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    const isWebView =
      /Twitter|FBAN|FBAV|Instagram|Line|FB_IAB|KAKAOTALK|MicroMessenger/i.test(
        ua,
      );
    const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua);
    const isSafari = /Safari/i.test(ua);
    if (isSafari && !isOtherBrowser && !isWebView) return 'ios-safari';
    return null;
  }

  if (/android/i.test(ua)) return 'android';

  // デスクトップ等はモバイル限定方針のため対象外
  return null;
}

// 表示対象は閲覧系の3ページのみ（編集・新規作成・診断・投稿は除外）
function isTargetPage(pathname: string): boolean {
  if (pathname === '/itineraries') return true;

  const itinerary = pathname.match(/^\/itineraries\/([^/]+)$/);
  if (itinerary && itinerary[1] !== 'new') return true; // 旅程詳細

  const spot = pathname.match(/^\/shachu-haku\/([^/]+)$/);
  if (spot && !['shindan', 'submit'].includes(spot[1])) return true; // 車中泊スポット詳細

  return false;
}

function isSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < SUPPRESS_MS;
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const isClient = useIsClient();
  const pathname = usePathname();

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [canPromptAndroid, setCanPromptAndroid] = useState(false);
  const [armed, setArmed] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const shownTrackedRef = useRef(false);

  // クライアントでプラットフォーム・インストール済み・抑制状態を判定
  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    if (isSuppressed()) setDismissed(true);
  }, []);

  // beforeinstallprompt / appinstalled は常時マウントで購読し取りこぼしを防ぐ
  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPromptAndroid(true);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      trackEvent('pwa_banner_app_installed', detectPlatform() ?? 'unknown');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const ready =
    platform === 'ios-safari' || (platform === 'android' && canPromptAndroid);
  const eligible =
    isClient && !installed && !dismissed && ready && isTargetPage(pathname);

  // 対象ページで5秒滞在したら表示を有効化（一度有効化したら維持）
  useEffect(() => {
    if (!eligible || armed) return;
    const timer = window.setTimeout(() => setArmed(true), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [eligible, armed]);

  const visible = armed && eligible;

  // 表示は1回だけ計測（対象ページ間の遷移で重複カウントしない）
  useEffect(() => {
    if (visible && !shownTrackedRef.current && platform) {
      shownTrackedRef.current = true;
      trackEvent('pwa_banner_shown', platform);
    }
  }, [visible, platform]);

  // 表示中はバナー高さ分の余白を追加し、最下部の広告・フッターを覆わない（ADR-0002）
  useEffect(() => {
    if (!visible) return;
    const height = bannerRef.current?.offsetHeight ?? 0;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = `${height}px`;
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [visible, platform]);

  const suppress = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage 不可時は何もしない
    }
    setDismissed(true);
  }, []);

  const handleDismiss = useCallback(() => {
    suppress();
    trackEvent('pwa_banner_dismissed', platform ?? 'unknown');
  }, [suppress, platform]);

  const handleInstall = useCallback(async () => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return;
    trackEvent('pwa_banner_install_clicked', 'android');
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // プロンプト失敗時は無視
    } finally {
      // ネイティブプロンプトは一度しか使えないため抑制する
      deferredPromptRef.current = null;
      setCanPromptAndroid(false);
      suppress();
    }
  }, [suppress]);

  if (!visible || !platform) return null;

  const Icon = platform === 'android' ? Download : Share;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="アプリのインストール案内"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          {platform === 'android' ? (
            <>
              <p className="text-sm font-medium text-foreground">
                アプリとして追加
              </p>
              <p className="text-xs text-muted-foreground">
                ホーム画面から1タップで起動。旅行中もすぐ開けます。
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                ホーム画面に追加
              </p>
              <p className="text-xs text-muted-foreground">
                共有ボタン
                <Share className="mx-0.5 inline size-3.5 align-text-bottom" />
                →「ホーム画面に追加」でアプリのように使えます。
              </p>
            </>
          )}
        </div>
        {platform === 'android' && (
          <Button size="sm" onClick={handleInstall} className="shrink-0">
            インストール
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          aria-label="閉じる"
          className="shrink-0"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
