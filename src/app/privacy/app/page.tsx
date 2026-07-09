import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー（車中泊スポットマップ アプリ） | 車旅のしおり',
  description:
    'モバイルアプリ「車中泊スポットマップ」のプライバシーポリシー。収集する情報、位置情報の扱い、アクセス解析について記載しています。',
  alternates: {
    canonical: '/privacy/app',
  },
};

export default function AppPrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">
        プライバシーポリシー（車中泊スポットマップ アプリ）
      </h1>

      <div className="prose max-w-none">
        <p className="mb-6">
          本ポリシーは、モバイルアプリ「車中泊スポットマップ」（以下「本アプリ」）における情報の取り扱いについて定めるものです。Webサイト「車旅のしおり」の取り扱いについては、
          <a href="/privacy" className="text-primary hover:underline">
            Webサイトのプライバシーポリシー
          </a>
          をご覧ください。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          1. アカウント情報について
        </h2>
        <p className="mb-6">
          本アプリはアカウント登録を必要とせず、氏名・メールアドレス・電話番号などの個人を特定する情報を収集しません。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. 位置情報について</h2>
        <p className="mb-4">
          本アプリは、現在地周辺の車中泊スポットを「近い順」に表示するために、端末の位置情報を使用します。位置情報の取り扱いは以下のとおりです。
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>
            位置情報（緯度・経度）は端末内でのみ処理され、当サービスのサーバーや第三者へ送信されることはありません。
          </li>
          <li>
            位置情報の利用許可は、いつでも端末のOS設定から変更できます。
          </li>
          <li>
            位置情報を許可しない場合でも、地図の表示中心を起点として、本アプリのすべての機能をご利用いただけます。
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          3. 利用状況の計測（アクセス解析）
        </h2>
        <p className="mb-4">
          本アプリでは、サービスの改善を目的として、後述のPostHogを用いて匿名の利用状況を計測します。収集する主な内容は次のとおりで、いずれも特定の個人を識別しない匿名の統計情報です。
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>画面の切り替え、絞り込みの操作、リンクのタップなどの操作</li>
          <li>
            表示・選択したスポットの識別子・種別・都道府県、および現在地からのおおよその距離（0.1km単位に丸めた値）
          </li>
          <li>
            アクセス解析サービスが自動的に取得する端末情報（OS・機種等）およびIPアドレス
          </li>
        </ul>
        <p className="mb-6">
          生の位置情報（緯度・経度）が送信されることはありません。位置情報に由来して送信されるのは、上記の丸めた距離の値のみです。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          4. スポットデータの取得
        </h2>
        <p className="mb-6">
          本アプリは、車中泊スポットの情報を「車旅のしおり」のサーバーから取得して表示します。この通信において、ユーザーの個人情報を送信することはありません。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          5. 利用する第三者サービス
        </h2>
        <p className="mb-4">本アプリでは、以下の第三者サービスを利用しています。</p>
        <ul className="list-disc pl-6 mb-6">
          <li>PostHog（アクセス解析）</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          6. Webサイトへの遷移について
        </h2>
        <p className="mb-6">
          本アプリの一覧・地図・情報の各画面から、スポットの詳細ページやお知らせなど「車旅のしおり」のWebページを、端末の外部ブラウザで開くことがあります。遷移後のWebサイトにおける情報の取り扱いは、
          <a href="/privacy" className="text-primary hover:underline">
            Webサイトのプライバシーポリシー
          </a>
          に従います。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          7. プライバシーポリシーの変更
        </h2>
        <p className="mb-6">
          当サービスは、必要に応じて本ポリシーの内容を変更することがあります。重要な変更を行う場合は、適切な方法により周知します。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. お問い合わせ窓口</h2>
        <p className="mb-6">
          本ポリシーに関するお問い合わせは、
          <a
            href="https://tabi.over40web.club/contact"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            お問い合わせフォーム
          </a>
          よりお願いいたします。
        </p>

        <p className="text-sm text-gray-600 mt-8">制定日: 2026年7月9日</p>
      </div>
    </div>
  );
}
