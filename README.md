This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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
