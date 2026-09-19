# Vercel から VPS への移行手順

本番（`tabi.over40web.club`）を Vercel から ConoHa VPS のコンテナへ移す手順と、移行後の運用方法。
検証の経緯は [poc-log.md](poc-log.md)（ミニPC案・Docker 構成）と [vps-poc-log.md](vps-poc-log.md)（VPS）を参照。

> 秘密情報（接続文字列・トークン・パスワード）の**値は書かない**。置き場所と手順だけを記録する。

## 方針: いつでも Vercel に戻せる状態を保つ

**切り替えは DNS の1レコードだけで行う。** `tabi.over40web.club` の向き先を変えるだけで、
アプリのコードも Vercel のプロジェクトもそのまま残す。

| 向き先 | DNS レコード（Cloudflare） | プロキシ |
| --- | --- | --- |
| Vercel（現状） | `tabi` CNAME → `cname.vercel-dns.com` | DNS only（灰色） |
| VPS（移行後） | `tabi` CNAME → `<トンネルID>.cfargotunnel.com` | **プロキシ（橙色）必須** |

- Cloudflare Tunnel の公開ホスト名を追加すると、このレコードは**自動で作られる**（手で作る必要はない）
- 戻すときは、Cloudflare の DNS 画面でレコードを Vercel の CNAME に戻すだけ。**数十秒で反映**される
  （プロキシ経由なので、利用者側のキャッシュにほとんど左右されない）
- Vercel 側は**消さない**。プロジェクト・環境変数・デプロイを残しておけば、いつでも戻せる

### Vercel をどう残すか

- **本番プロジェクトは残す**（ドメインの設定も残す）。トラフィックが来なくなるだけなので、使用量はほぼゼロになる
- **staging（プレビュー）も残す**のがよい。PR やブランチの確認は Vercel のプレビューが手軽で、
  VPS を止めているときの代替にもなる。使用量はビルド分だけで、本番トラフィックに比べれば小さい
- ただし、Vercel のビルドは push のたびに走る。使用量を抑えたい場合は、Vercel の
  「Ignored Build Step」で対象ブランチを絞る

## 移行前にやること

### 1. 環境変数（本番用）を用意する

VPS 上の `~/apps/tns-web/.env.docker` を本番用に差し替える。開発PCの `.env.production.local` が元になる。

| 変数 | 試験中（今） | 本番切り替え後 |
| --- | --- | --- |
| `APP_BASE_URL` | `https://vps.over40web.club` | `https://tabi.over40web.club` |
| `APP_MONGODB_URI` / `MONGODB_URI` | `itinerary_db_dev` | **`itinerary_db`（本番DB）** |
| `NEXT_PUBLIC_POSTHOG_KEY` | 未設定 | 本番のキーを設定（アクセス解析を戻す） |
| `SENTRY_AUTH_TOKEN` | 未設定 | ビルド時に設定すればソースマップが上がる（任意） |
| `APP_ENV` | `staging` | `production`（下記） |

**`VERCEL_ENV` 依存の置き換え**（移行前に対応する）:

- `sentry.server.config.ts` / `sentry.edge.config.ts`: `enabled: process.env.VERCEL_ENV === 'production'`
  → Vercel の外では常に無効になる。**サーバー側のエラーが Sentry に届かない**
- `next.config.mjs`: CSP レポートの環境名（`development` になる）、`vercel.live` の許可（本番CSPに不要な許可が入る）
- **対応済み（2026-09-19）**: `src/lib/appEnv.ts` を追加し、`APP_ENV → VERCEL_ENV → development` の順に見る。
  Sentry（server / edge）と `next.config.mjs`（CSP のレポート環境名・`vercel.live` の許可）がこれを使う。
  Vercel 側は `APP_ENV` を設定しなければ従来どおり動く。`next.config.mjs` はビルド時評価なので **`APP_ENV` はビルド時にも渡す**

### 2. Auth0 / Mapbox（本番URLは登録済みのはず）

- Auth0 の Callback / Logout / Web Origins に `https://tabi.over40web.club` が入っていること（既存）
- Mapbox の URL 制限に `https://tabi.over40web.club` が入っていること（既存）
- **staging・vps の URL は消さない**（切り戻し・検証用）

### 3. Cloudflare Access（重要）

- `tabi.over40web.club` は**一般公開**なので、Access のアプリケーションの宛先に**加えてはいけない**
- 宛先は `staging.over40web.club` と `vps.over40web.club` のみ

### 4. 本番トラフィックに耐えるかの確認

- [vps-poc-log.md](vps-poc-log.md) の計測では、同時50件で 320〜560 件/秒（エラー0）。現在のアクセス規模なら余裕がある
- ISR のキャッシュはコンテナを作り直すと消える。切り替え直後は初回アクセスが遅い

## 切り替え手順（当日）

**公開ホスト名（DNS）の切り替えは最後の一手であって、それだけでは足りない。**
先に「中身を本番用にして、本番DBを見た状態で確認する」ところまで済ませる。

### 第1段階: 中身を本番用にする（まだ利用者には見えない）

1. **コードの準備**（切り替え日より前に済ませておく）
   - `VERCEL_ENV` 依存を `APP_ENV` に置き換える（Sentry・CSP）。これをしないと**サーバー側のエラーが Sentry に届かない**
   - コミットして、VPS 側も同じコミットにしておく
2. **本番用の環境変数ファイルを作る**（開発PCで用意して転送する）

   | 変数 | 値 |
   | --- | --- |
   | `APP_MONGODB_URI` / `MONGODB_URI` | **本番 `itinerary_db`** |
   | `APP_BASE_URL` | `https://tabi.over40web.club,https://vps.over40web.club`（確認のため両方。切り替え後に本番のみへ戻してもよい） |
   | `NEXT_PUBLIC_POSTHOG_KEY` | 本番のキー（アクセス解析を戻す） |
   | `APP_ENV` | `production`（Sentry と CSP のため） |

   ```bash
   # 開発PCから
   scp .env.production.vps deploy@<VPS>:~/apps/tns-web/.env.docker
   ```
3. **イメージを作り直す**（`NEXT_PUBLIC_*` と CSP はビルド時に焼き込まれるため、再ビルドが必須）
   ```bash
   ssh deploy@<VPS> 'cd ~/apps/tns-web && APP_IMAGE_TAG=$(git rev-parse --short HEAD) docker compose build && docker compose up -d'
   ```
4. **本番DBを見た状態で動作確認する**（この時点ではまだ `vps.over40web.club` から。Access で保護されている）
   - トップ・地図・スポット詳細・旅程・ログイン・**管理画面の更新**（本番データを触るので慎重に）
   - Sentry にサーバー側のエラーが届くか（意図的に確認する手段があれば）

### 第2段階: 通信を切り替える（ここから利用者に見える）

5. Zero Trust（左メニューの「Zero Trust」）→「ネットワーク」→「Tunnels」→ VPS のトンネル →「公開ホスト名」に追加
   - サブドメイン `tabi` / ドメイン `over40web.club` / タイプ `HTTP` / URL `app:3000`
   - 保存すると **Cloudflare の DNS に `tabi` の CNAME（`<トンネルID>.cfargotunnel.com`、プロキシ有効）が自動で作られる**
   - 既存の `tabi` → `cname.vercel-dns.com` と衝突する。置き換えを促されたら承諾する。
     促されない場合は、DNS 画面で古いレコードを削除してからやり直す
6. **`tabi` を Access の宛先に入れないこと**（一般公開のため）。宛先は `staging` と `vps` のみ
7. 反映を確認する
   ```bash
   dig +short tabi.over40web.club        # Cloudflare のプロキシ用 IP（104.21.x / 172.67.x 等）になる
   curl -sI https://tabi.over40web.club | head -3   # 200 が返り、Access のログイン画面に飛ばされないこと
   ```
8. ブラウザで確認: トップ・地図・スポット詳細・旅程・ログイン・管理画面・PWA
9. しばらく監視する（ログ・メモリ・応答時間・Sentry）
10. Vercel 側はそのまま放置（**削除しない**。切り戻しの手段になる）

### 切り戻し手順

1. Cloudflare ダッシュボードで DNS レコードの画面へ（**Zero Trust ではない方**。メニューが分かりにくいので手順を明記）
   1. 左メニューの「**ドメイン**」
   2. 一覧から「**over40web.club**」を選ぶ（「最近」の欄からでもよい）
   3. 左メニューの内容が入れ替わるので、下の方の「**DNS**」→「**レコード**」
2. `tabi` のレコードを編集し、`cname.vercel-dns.com` / **DNS のみ（灰色）** に戻す
3. 数十秒で Vercel に戻る
4. 必要なら、トンネルの公開ホスト名から `tabi` を外す

> 切り戻すと DB は本番のまま、アプリだけ Vercel 側に戻る。データの不整合は起きない。

## 移行後の運用

### デプロイ（Vercel の「push するだけ」に相当）

VPS では、次のいずれかになる。**最初は A、慣れたら B** を勧める。

**A. 手動デプロイ（スクリプト1本）**

開発PCから1コマンドで実行する。中身は「git pull → ビルド → 入れ替え → 健全性の確認 → ダメなら前の版へ戻す」。

```bash
ssh deploy@<VPS> 'cd ~/apps/tns-web && ./scripts/deploy.sh'
```

- スクリプトは未作成（移行前に作る）。`APP_IMAGE_TAG` にコミットハッシュを付けてビルドし、
  `/api/health` が healthy になるまで待ち、ならなければ直前のタグへ戻す
- ビルドは VPS 上で 約214秒・メモリ 3.6GB＋スワップ 1.1GB（[vps-poc-log.md](vps-poc-log.md)）。
  ぎりぎりなので、**開発PCでビルドして `docker save` / `docker load` で送る方式**も選べる

**B. GitHub Actions（push で自動）**

- VPS に**セルフホストランナー**を入れる方式が、ファイアウォールを開けずに済む（ランナーが GitHub へ外向きに接続する）
- push → ランナーがビルド → 入れ替え、まで自動化できる。Vercel の使用感に近い
- 注意: ランナーは VPS の CPU を使う。ビルド中はサイトの応答が遅くなりうる

### 環境変数の変更（Vercel のダッシュボードに相当）

- 置き場所は **VPS 上の `~/apps/tns-web/.env.docker`**（権限 600、Git 管理外）
- 手順: 開発PCの手元のファイルを編集 → `scp` で置き換え → `docker compose up -d`（再作成）で反映
- **`NEXT_PUBLIC_*` と `next.config.mjs` が読む値はビルド時に埋め込まれる**ので、変更したら**再ビルドが必要**
- 正となる控えは開発PC（`.env.production.local` など）。VPS 側だけを直すと、次のビルドで戻ってしまう

### ログ・監視

```bash
ssh deploy@<VPS> 'cd ~/apps/tns-web && docker compose logs -f app'      # ログ
ssh deploy@<VPS> 'docker stats --no-stream'                             # CPU・メモリ
ssh deploy@<VPS> 'cd ~/apps/tns-web && docker compose ps'               # 状態
```

- Sentry を有効化すれば、エラーは今までどおり Sentry に集まる（`APP_ENV` の対応が前提）
- **ヘルスチェックが失敗しても Docker は再起動しない**。ハング対策として autoheal 系のコンテナか、
  systemd timer での監視を入れる（未対応）
- 死活監視は Cloudflare 側でも設定できる（無料の Health Checks は制限あり。要検討）

### バックアップ

- DB は MongoDB Atlas のまま（本番 `itinerary_db`）。VPS が壊れてもデータは残る
- VPS 側で失って困るのは `.env.docker` と `.env.tunnel` のみ。**開発PCに控えを持つ**
- ConoHa のスナップショット（有料）を使うかは、運用が落ち着いてから判断

## DB は Atlas のまま（VPS に載せない）

2026-09-19、VPS 内に MongoDB を置く案を検討したが、**Atlas のままにする**（ユーザー判断）。

実測（VPS のコンテナから Atlas へ）:

| 項目 | 結果 |
| --- | --- |
| 往復の待ち時間（ping） | 15ms（最小14 / 最大18） |
| 件数取得（campingspots 2,010件） | 27ms |
| 初回の接続確立 | 877ms（起動時に1回） |

- VPS 内に移すとこの 15ms が 1ms 未満になるが、ページ全体が 47〜65ms なので**1〜2割しか速くならない**
- 移さない理由:
  - Atlas のダッシュボード（と MCP ツールでの調査）が使えなくなる
  - **Vercel に戻せなくなる**（DB が VPS 内だと Vercel から接続できない）。切り戻しの手段を失う
  - バックアップと障害時の復旧を自分で抱えることになる。今は VPS が壊れてもデータは残る
  - メモリ4GB を MongoDB と取り合う（ビルド時点ですでにぎりぎり）
- 速度が問題になったときは、DB を動かすより先に ISR や IndexedDB のキャッシュを広げる方が効く

## 費用の見込み

| 項目 | 費用 |
| --- | --- |
| ConoHa VPS 4GB（時間課金） | 6.6円/時、月額上限 3,608円 |
| ConoHa VPS 4GB（まとめトク 1か月） | 1,751円/月 |
| Cloudflare（DNS・Tunnel・Access） | 無料 |
| MongoDB Atlas（M0） | 無料 |
| Vercel（残しておく） | 無料枠内（トラフィックが来なくなるため） |

**2週間以上使うなら、まとめトクへ切り替えた方が安い。**

## 未了の作業

- [x] `VERCEL_ENV` 依存を `APP_ENV` に置き換える（Sentry・CSP）
- [ ] `scripts/deploy.sh`（健全性の確認と自動切り戻し付き）を作る
- [ ] ハング時の再起動（autoheal など）
- [ ] 本番用 `.env.docker` の用意（本番DB・PostHog）
- [ ] AI 生成の所要時間を VPS で確認（Cloudflare の応答待ち上限 約100秒に収まるか）
- [ ] 一晩の連続運転の結果確認（メモリ・トンネル・経由拠点）
