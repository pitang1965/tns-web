import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 車旅のしおり',
  description: '車旅のしおりのプライバシーポリシー',
};

export default function PrivacyPage() {
  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <h1 className='text-3xl font-bold mb-8'>プライバシーポリシー</h1>

      <div className='prose max-w-none'>
        <p className='mb-6'>
          車旅のしおり（以下「当サービス」）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>1. 収集する情報</h2>
        <p className='mb-4'>
          当サービスは、以下の情報を収集する場合があります：
        </p>
        <ul className='list-disc pl-6 mb-6'>
          <li>お名前、メールアドレス</li>
          <li>旅行計画に関する情報</li>
          <li>サービス利用に関するログ情報</li>
          <li>Cookieおよび類似の技術による情報</li>
        </ul>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>2. 情報の利用目的</h2>
        <p className='mb-4'>収集した個人情報は、以下の目的で利用いたします：</p>
        <ul className='list-disc pl-6 mb-6'>
          <li>サービスの提供・運営のため</li>
          <li>ユーザーからのお問い合わせに回答するため</li>
          <li>サービスの改善・開発のため</li>
          <li>
            利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため
          </li>
        </ul>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>
          3. 個人情報の第三者提供
        </h2>
        <p className='mb-6'>
          当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
        </p>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>4. Cookieの使用</h2>
        <p className='mb-6'>
          当サービスは、ユーザーの利便性向上のためCookieを使用することがあります。ユーザーはブラウザの設定により、Cookieの受け取りを拒否することができます。
        </p>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>
          5. 第三者サービスの利用
        </h2>
        <p className='mb-4'>
          当サービスでは、以下の第三者サービスを利用しています：
        </p>
        <ul className='list-disc pl-6 mb-6'>
          <li>Google Analytics（アクセス解析）</li>
          <li>Auth0（認証サービス）</li>
          <li>Mapbox（地図サービス）</li>
          <li>MongoDB Atlas（データベースサービス）</li>
        </ul>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>
          6. プライバシーポリシーの変更
        </h2>
        <p className='mb-6'>
          当サービスは、必要に応じて、このプライバシーポリシーの内容を変更することがあります。この場合、変更後のプライバシーポリシーの施行時期と内容を適切な方法により周知または通知します。
        </p>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>
          7. アカウントの削除
        </h2>
        <p className='mb-4'>
          アカウントの削除をご希望の場合は、以下の手順で行うことができます：
        </p>
        <ol className='list-decimal pl-6 mb-6'>
          <li>アカウントページにログイン</li>
          <li>下記のお問い合わせ窓口までアカウント削除をご依頼ください</li>
          <li>確認後、すべての個人データを完全に削除いたします</li>
        </ol>
        <p className='mb-6'>
          削除されるデータには、プロフィール情報、作成された旅程、ログイン履歴等、すべての個人に関連するデータが含まれます。
        </p>

        <h2 className='text-2xl font-semibold mt-8 mb-4'>
          8. お問い合わせ窓口
        </h2>
        <p className='mb-6'>
          本ポリシーに関するお問い合わせやアカウント削除のご依頼は、
          <a
            href='https://tabi.over40web.club/contact'
            className='text-primary hover:underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            お問い合わせフォーム
          </a>
          よりお願いいたします。
        </p>
        <p className='text-sm text-gray-600 mt-8'>
          制定日: 2025年9月23日
          <br />
          最終更新日: 2025年9月23日
        </p>
      </div>
    </div>
  );
}
