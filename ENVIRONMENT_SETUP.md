# 環境変数の安全な管理方法

このドキュメントでは、開発環境と本番環境のデータベースを安全に管理するための手順を説明します。

## 環境の分離

このプロジェクトでは、以下のように環境を分離しています：

```
MongoDB Atlas Cluster0
├── itinerary_db (本番環境)
│   ├── itineraries
│   ├── campingspots
│   └── campingspotsubmissions
└── itinerary_db_dev (開発環境)
    ├── itineraries
    ├── campingspots
    └── campingspotsubmissions
```

## 環境変数ファイル

### `.env.local` (開発環境用)

開発時に使用します。このファイルは `itinerary_db_dev` データベースに接続します。

```bash
MONGODB_URI='mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/itinerary_db_dev?retryWrites=true&w=majority&appName=Cluster0'
AUTH0_BASE_URL='http://localhost:3000'
# その他の開発環境用設定...
```

### `.env.production.local` (本番環境用)

本番デプロイ時に使用します。このファイルは `itinerary_db` データベースに接続します。

```bash
MONGODB_URI='mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/itinerary_db?retryWrites=true&w=majority&appName=Cluster0'
AUTH0_BASE_URL='https://tabi.over40web.club'
# その他の本番環境用設定...
```

**重要**: これらのファイルは `.gitignore` に含まれており、Gitリポジトリにコミットされません。

## データベース初期化の安全対策

`npm run init-db` スクリプトには以下の安全機能が実装されています：

### 1. 本番環境データベースの保護

スクリプトは接続先のデータベース名を自動的にチェックし、本番環境データベース（`itinerary_db`）への接続を検出した場合は、以下のエラーメッセージを表示して**自動的に停止**します：

```
❌ ERROR: Attempting to initialize PRODUCTION database!
❌ エラー：本番環境データベースを初期化しようとしています！

⚠️  Current database: itinerary_db
⚠️  Expected database: itinerary_db_dev

💡 Please update MONGODB_URI in .env.local to use itinerary_db_dev
```

### 2. 開発環境でも確認プロンプト

開発環境データベースでも、実行前に以下の確認を求めます：

```
⚠️  This will DELETE ALL data in "itinerary_db_dev" and insert sample data.
⚠️  "itinerary_db_dev" の全データを削除し、サンプルデータを挿入します。

Do you want to continue? (y/N):
```

`y` または `yes` を入力しない限り、処理は実行されません。

### 3. 接続先の可視化

スクリプト実行時に、以下の情報を表示します：

```
📍 Target database: itinerary_db_dev
📍 Connection URI: mongodb+srv://USER:****@cluster0.xxxxx.mongodb.net/itinerary_db_dev?...
```

パスワードは自動的にマスクされます（`****`）。

## 開発の流れ

### 初回セットアップ

1. `.env.local` を確認し、`itinerary_db_dev` に接続していることを確認
2. `npm run init-db` を実行してサンプルデータを投入
3. `npm run dev` で開発サーバーを起動（必ず http://localhost:3000 を使用）

### 日常的な開発

- ローカル開発時は常に `.env.local` を使用
- `.env.production.local` は本番環境専用（誤って使用しないこと）

### 本番環境へのデプロイ

1. デプロイ先（Vercel等）の環境変数に `.env.production.local` の内容を設定
2. ローカルでは **絶対に** `.env.production.local` を `.env.local` にコピーしない
3. 本番環境では `npm run init-db` を実行しない

## トラブルシューティング

### 誤って本番データベースに接続してしまった場合

1. **慌てずに** `npm run init-db` を実行しない
2. `.env.local` の `MONGODB_URI` を確認
3. データベース名が `itinerary_db_dev` になっているか確認
4. 必要に応じて修正

### Claude Codeが本番データを触ろうとした場合

`initDB.ts` の安全機能により、本番環境データベースへの接続は自動的にブロックされます。

## バックアップ（今後の実装予定）

現在、手動でのバックアップが必要です：

### MongoDB Atlasでの手動バックアップ

1. MongoDB Atlas にログイン
2. Cluster0 を選択
3. "..." メニュー → "Backup" → "Take Snapshot"

### 本番環境データのエクスポート（MCPツール使用）

開発環境で本番データを確認する必要がある場合は、MCPツールを使用してください。

## セキュリティ上の注意

- **絶対に** `.env.local` や `.env.production.local` をGitにコミットしない
- 接続文字列にはパスワードが含まれているため、共有時は必ずマスクする
- 本番環境の接続情報は、チーム内でも最小限の人数のみが知るべき

## まとめ

この構成により、以下が保証されます：

✅ 開発環境と本番環境の完全な分離
✅ 本番データベースへの誤った操作の自動ブロック
✅ 初期化スクリプト実行時の明示的な確認
✅ 環境変数の安全な管理
