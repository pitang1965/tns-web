This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# 旅程管理ウェブアプリケーション「旅のしおり」

## 概要
旅行計画の作成から実施までをサポートするウェブアプリケーションで、Google Maps連携により効率的な旅程管理を実現します。カーナビゲーション（Android Auto・Apple CarPlay）との連携を前提に設計されており、旅行中の移動をスムーズにサポートします。

![image](https://github.com/user-attachments/assets/22973f88-6411-49fb-9f3e-6284d649bb26)

## 主な機能
- **アカウント管理**: アカウントを作成して個人の旅程を管理
- **旅程作成・共有**: 公開設定により、作成した旅程を他のユーザーと共有可能
- **複数日程対応**: 複数日にわたる旅行計画を日ごとに管理
- **地図連携**: 各アクティビティに地図情報を紐づけて視覚的に管理
- **座標データ連携**: Google Mapsから座標データ（例: 座標が埋め込まれたURLや、`34.1560076,132.3973073`）をクリップボード経由で簡単インポート
- **ナビゲーション**: 保存した位置情報からGoogle Maps起動やルート検索が可能
- **SNS共有**: 旅程をX（Twitter）で共有するボタンを実装

## 使用例
1. 旅行前: 複数日程の旅程を作成し、各スポットの位置情報を登録
2. 旅行中: 登録したスポットへのナビゲーションをワンタップで起動
3. 旅行後: 思い出の旅程をSNSで共有

Google Mapsとシームレスに連携することで、旅行計画から実際の移動までをスムーズにサポートします。

## .env.local の設定

- `AUTH0_SECRET`:
  - Auth0 SDK が使用する秘密鍵。セッションの暗号化などに使用される。
- `AUTH0_BASE_URL`:
  - アプリケーションのベース URL。ログイン後のリダイレクト先として使用される。
- `AUTH0_ISSUER_BASE_URL`:
  - Auth0 テナントの URL。認証リクエストの送信先となる。
- `AUTH0_CLIENT_ID`:
  - Auth0 アプリケーションの識別子。認証リクエストに使用される。
- `AUTH0_CLIENT_SECRET`:
  - Auth0 アプリケーションの秘密鍵。トークン取得時などに使用される。
- `AUTH0_AUDIENCE`:
  - API の識別子。アクセストークンの発行対象となる API を指定する。
  - 例: `https://api.tabi-no-shiori.com`
- `AUTH0_DOMAIN`:
  - Auth0 テナントのドメイン。認証エンドポイントの構築に使用される。
  - 例: `your-tenant.auth0.com`
- `AUTH0_SCOPE'`:
  - アプリケーションが要求する権限（スコープ）を指定する。複数のスコープはスペースで区切る。
  - 例：`openid profile email read:shows`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`:
  - Mapbox API にアクセスするためのトークン。地図の表示や機能の利用に必要。
- `MONGODB_URI`:
  - MongoDB データベースに接続するための接続文字列。
  - データベースのホスト、ポート、認証情報、データベース名などを含む。

## Docker で動かす場合

```bash
$ docker-compose up --build
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# ファイルの解説

* components.json
  * shadcn/uiライブラリを使用するNext.jsプロジェクトの設定ファイル
* sentry.*.ts
  * SentryをNext.jsアプリケーションに統合するための設定ファイル
    * sentry.client.config.ts:このファイルはクライアントサイド（ブラウザ）でのSentryの設定を行う。
    * ユーザーのブラウザで発生したエラーやパフォーマンスの問題を捕捉する。
    * sentry.edge.config.ts
      * このファイルはEdge環境（例：Vercel Edge Functions）でのSentryの設定を行う。
      * サーバーレス関数やエッジコンピューティング環境で発生したエラーを追跡する。
    * sentry.server.config.ts:
      * このファイルはサーバーサイドでのSentryの設定を行う。
      * Node.js環境で実行されるサーバーサイドのコードで発生したエラーを捕捉する。
