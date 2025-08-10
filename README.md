This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# 旅程管理ウェブアプリケーション「旅のしおり」

## 概要

旅行計画の作成から実施までをサポートするウェブアプリケーションで、Google Maps 連携により効率的な旅程管理を実現します。カーナビゲーション（Android Auto・Apple CarPlay）との連携を前提に設計されており、旅行中の移動をスムーズにサポートします。

![image](https://github.com/user-attachments/assets/22973f88-6411-49fb-9f3e-6284d649bb26)

## 主な機能

- **アカウント管理**: アカウントを作成して個人の旅程を管理
- **旅程作成・共有**: 公開設定により、作成した旅程を他のユーザーと共有可能
- **複数日程対応**: 複数日にわたる旅行計画を日ごとに管理
- **地図連携**: 各アクティビティに地図情報を紐づけて視覚的に管理
- **座標データ連携**: Google Maps から座標データ（例: 座標が埋め込まれた URL や、`34.1560076,132.3973073`）をクリップボード経由で簡単インポート
- **ナビゲーション**: 保存した位置情報から Google Maps 起動やルート検索が可能
- **SNS 共有**: 旅程を X（Twitter）で共有するボタンを実装

## 使用例

1. 旅行前: 複数日程の旅程を作成し、各スポットの位置情報を登録
2. 旅行中: 登録したスポットへのナビゲーションをワンタップで起動
3. 旅行後: 思い出の旅程を SNS で共有

Google Maps とシームレスに連携することで、旅行計画から実際の移動までをスムーズにサポートします。

## 主要技術

### フレームワーク

- [Next.js](https://nextjs.org/) - React ベースのフルスタックフレームワーク

### UI/UX ライブラリ
- [React](https://react.dev/) - ユーザーインターフェース構築用ライブラリ
- [Radix UI](https://www.radix-ui.com/) - アクセシビリティに優れたヘッドレス UI コンポーネント
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストの CSS フレームワーク
- [Lucide React](https://lucide.dev/) - アイコンライブラリ

### 地図関連
- [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) - インタラクティブな地図実装
- [React Leaflet](https://react-leaflet.js.org/) - React 用地図コンポーネント

### データ処理
- [MongoDB](https://www.mongodb.com/) - NoSQL データベース
- [Mongoose](https://mongoosejs.com/) - MongoDB のオブジェクトモデリングツール

### 状態管理
- [Jotai](https://jotai.org/) - プリミティブで柔軟なReact向け状態管理ライブラリ

### フォーム処理/バリデーション
- [React Hook Form](https://react-hook-form.com/) - フォーム状態管理
- [Zod](https://github.com/colinhacks/zod) - TypeScript ファーストのスキーマバリデーション

- **認証**:
- [@auth0/nextjs-auth0](https://github.com/auth0/nextjs-auth0) - Auth0 による認証機能

### モニタリング
- [Sentry](https://sentry.io/) - エラー追跡と監視

## 開発ツール

- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **リンター**: [ESLint](https://eslint.org/)
- **環境変数**: [dotenv](https://github.com/motdotla/dotenv)

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

- components.json
  - shadcn/ui ライブラリを使用する Next.js プロジェクトの設定ファイル
- sentry.\*.ts
  - Sentry を Next.js アプリケーションに統合するための設定ファイル
    - sentry.client.config.ts:このファイルはクライアントサイド（ブラウザ）での Sentry の設定を行う。
    - ユーザーのブラウザで発生したエラーやパフォーマンスの問題を捕捉する。
    - sentry.edge.config.ts
      - このファイルは Edge 環境（例：Vercel Edge Functions）での Sentry の設定を行う。
      - サーバーレス関数やエッジコンピューティング環境で発生したエラーを追跡する。
    - sentry.server.config.ts:
      - このファイルはサーバーサイドでの Sentry の設定を行う。
      - Node.js 環境で実行されるサーバーサイドのコードで発生したエラーを捕捉する。

# MongoDB MCP Server セットアップガイド

Claude CodeでMongoDB Atlas データベースを安全に探索・分析するためのセットアップ手順

## 概要

Model Context Protocol (MCP) を使用して、Claude CodeからMongoDB Atlasデータベースに読み取り専用でアクセスできるようにする設定方法です。これにより、自然言語でデータベースの探索、スキーマ分析、データ分析が可能になります。

## 前提条件

- **MongoDB Atlas** アカウントとクラスター
- **Node.js** バージョン20.19.0以降
- **Claude Code** がインストール済み

## セットアップ手順

### 1. MongoDB Atlas での読み取り専用ユーザー作成

1. **MongoDB Atlas管理画面**にログイン
2. **Security** → **Database Access** に移動
3. **Add New Database User** をクリック
4. 以下の設定でユーザーを作成：
   ```
   Authentication Method: Password
   Username: claude_readonly
   Password: 強力なパスワード（保存しておく）
   Database User Privileges: Only read any database
   ```

### 2. ネットワークアクセスの設定

1. **Security** → **Network Access** に移動
2. 現在のIPアドレスまたは`0.0.0.0/0`（開発用）を追加

### 3. 接続文字列の確認

1. **Database** → **Connect** → **Connect your application**
2. 接続文字列をコピー：
   ```
   mongodb+srv://claude_readonly:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=ClaudeMCP
   ```

### 4. 環境変数の設定

機密情報を安全に管理するため、接続文字列を環境変数で設定します。

#### .env.mcp ファイルの作成
```bash
# プロジェクトルートに .env.mcp ファイルを作成
echo "MONGODB_URI_READONLY=mongodb+srv://claude_readonly:your_password@cluster0.xxxxx.mongodb.net/?appName=ClaudeMCP" > .env.mcp
```

#### .gitignore への追加
```bash
# .gitignore に機密情報ファイルを追加
echo ".env.mcp" >> .gitignore
echo "setting.local.json" >> .gitignore
```

### 5. Claude Code MCP サーバーの追加

#### 方法A: 環境変数ファイルを使用（推奨）
```bash
# プロジェクトルートディレクトリで実行
claude mcp add -s project mongodb-readonly \
  --env-file .env.mcp \
  -e MDB_MCP_READ_ONLY="true" \
  -- npx -y @mongodb-js/mongodb-mcp-server --readOnly
```

#### 方法B: 直接指定（開発時のみ）
```bash
# 機密情報を直接指定（本番環境では非推奨）
claude mcp add -s project mongodb-readonly \
  -e MDB_MCP_CONNECTION_STRING="mongodb+srv://claude_readonly:your_password@cluster0.xxxxx.mongodb.net/?appName=ClaudeMCP" \
  -e MDB_MCP_READ_ONLY="true" \
  -- npx -y @mongodb-js/mongodb-mcp-server --readOnly
```

### 6. 接続確認

```bash
# MCP サーバー一覧を確認
claude mcp list

# 出力例：
# mongodb-readonly: npx -y @mongodb-js/mongodb-mcp-server - ✓ Connected
```

## 使用方法

### Claude Code の起動

```bash
claude
```

### MCP 接続状況の確認

```
/mcp
```

### 基本的なデータベース操作

#### データベース一覧の表示
```
データベース一覧を表示して
```

#### コレクション一覧の表示
```
itinerary_dbデータベースのコレクション一覧を教えて
```

#### スキーマ分析
```
itinerariesコレクションのフィールド一覧と各フィールドのデータ型を教えて
```

#### データ統計
```
itinerariesコレクションに何件のドキュメントがありますか？
```

#### サンプルデータの確認
```
itinerariesコレクションのサンプルデータを3件表示して
```

## プロジェクト例：旅行計画アプリ

### データベース構造

- **データベース**: `itinerary_db`
- **コレクション**: `itineraries` (4件のドキュメント)

### スキーマ詳細

| フィールド | データ型 | 説明 |
|-----------|----------|------|
| `_id` | ObjectId | MongoDB標準ID |
| `createdAt` | String/Date | 作成日時 |
| `dayPlans` | Array | 日別プラン |
| `description` | String | 旅行の説明 |
| `isPublic` | Boolean | 公開設定 |
| `numberOfDays` | Number | 旅行日数 |
| `owner` | Document | 作成者情報 |
| `sharedWith` | Array | 共有ユーザー |
| `startDate` | String | 開始日 |
| `title` | String | 旅行タイトル |
| `transportation` | Document | 交通手段情報 |
| `updatedAt` | Date | 更新日時 |

## 高度な活用例

### データ分析クエリ
```
「最も人気のある旅行先を分析して」
「過去1ヶ月の新規作成された旅行プラン数は？」
「平均的な旅行日数を教えて」
```

### 開発支援
```
「このスキーマに基づいてTypeScript型定義を生成して」
「Next.jsでitinerariesを取得するAPIルートのコードを書いて」
「MongoDB Aggregationパイプラインで人気の旅行先TOP5を取得するクエリを作成して」
```

### コード生成
```
「MongooseスキーマでItineraryモデルを定義して」
「React コンポーネントでitinerary一覧を表示するコードを書いて」
```

## トラブルシューティング

### 接続エラーの場合

1. **ユーザー権限の確認**
   - MongoDB Atlasで読み取り権限が設定されているか確認

2. **ネットワークアクセス**
   - IPアドレスがAtlasのアクセスリストに含まれているか確認

3. **接続文字列**
   - パスワードに特殊文字が含まれる場合はURLエンコードが必要

### MCPサーバーのリセット

```bash
# サーバーを削除
claude mcp remove mongodb-readonly

# 再度追加
claude mcp add -s project mongodb-readonly \
  -e MDB_MCP_CONNECTION_STRING="your-connection-string" \
  -e MDB_MCP_READ_ONLY="true" \
  -- npx -y @mongodb-js/mongodb-mcp-server --readOnly
```

## セキュリティとファイル管理

### Git管理の設定

#### コミットするファイル
- ✅ `.mcp.json` - チーム共有のMCP設定（機密情報なし）
- ✅ `README.md` - セットアップ手順

#### コミットしないファイル (.gitignore)
```gitignore
# MCP関連の機密情報
.env.mcp
setting.local.json

# Next.js環境変数
.env.local
.env.*.local

# その他
node_modules/
.next/
```

### 環境変数の管理

#### Next.jsアプリ用
```bash
# .env.local
MONGODB_URI=mongodb+srv://app_user:password@cluster0.xxxxx.mongodb.net/itinerary_db
```

#### Claude MCP用
```bash
# .env.mcp
MONGODB_URI_READONLY=mongodb+srv://claude_readonly:password@cluster0.xxxxx.mongodb.net/?appName=ClaudeMCP
```

### セキュアな.mcp.json設定

チーム共有用の設定（機密情報を環境変数で参照）：
```json
{
  "mcpServers": {
    "mongodb-readonly": {
      "command": "npx",
      "args": [
        "-y",
        "@mongodb-js/mongodb-mcp-server",
        "--readOnly"
      ],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "${MONGODB_URI_READONLY}",
        "MDB_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

## セキュリティ注意事項

- ✅ **読み取り専用ユーザー**を使用
- ✅ **専用パスワード**を設定
- ✅ **IPアクセス制限**を適用（本番環境）
- ✅ **環境変数**で機密情報を管理
- ✅ **機密情報はGitコミットしない**
- ❌ **本番データベースでの書き込み権限は付与しない**

## 設定ファイル

### .mcp.json（コミットする）
```json
{
  "mcpServers": {
    "mongodb-readonly": {
      "command": "npx",
      "args": [
        "-y",
        "@mongodb-js/mongodb-mcp-server",
        "--readOnly"
      ],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "${MONGODB_URI_READONLY}",
        "MDB_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

### .env.mcp（.gitignoreに追加）
```bash
# Claude Code MCP用の読み取り専用接続文字列
MONGODB_URI_READONLY=mongodb+srv://claude_readonly:your_password@cluster0.xxxxx.mongodb.net/?appName=ClaudeMCP
```

## 参考リンク

- [MongoDB MCP Server 公式ドキュメント](https://www.mongodb.com/docs/mcp-server/)
- [Claude Code MCP ガイド](https://docs.anthropic.com/ja/docs/claude-code/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)