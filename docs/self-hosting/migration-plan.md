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

## 移行を検討する前にやったこと（アプリ側の CPU 削減）

Vercel の無料枠の警告は、今回が初めてではない。

| 時期 | 内容 |
| --- | --- |
| 2026-02-04 | **Function Invocations が無料枠の100%**（10万回）に到達 |
| 2026-08-16 以降 | **Fluid Active CPU（4時間）の超過**。以後くり返し通知が届き、**最大で150%程度**まで達した |
| 2026-09-13 | 同上の通知を受けて、アプリ側の CPU 削減に着手（下記） |
| 2026-09-18 | 削減後も Usage 画面で 5時間40分 / 4時間（約142%）と超過が続く |

**一時的な急増ではなく、通常の利用で無料枠に収まらなくなってきている**ことが、移行を決めた理由。

2026-09-13 の通知を受けて、**まずアプリ側で CPU を減らす**ことから着手した。
Observability のルート別内訳では、`/` が約40%、`/shachu-haku/[spotId]` が約29%、`/shachu-haku` が約16% を占めていた。

### 実施した対策

**1. スポット詳細ページを ISR 化**

`revalidate = 86400` と `generateStaticParams` を設定し、匿名アクセスのたびにページ全体を生成する構成を見直した。

ISR を成立させるため、セッションを参照しない匿名表示用の `getPublicFieldReportsBySpot` を新設した。
ログインユーザー向けの情報は、`FieldReportSection` からクライアント側で改めて取得する構成に分離した。

**2. トップページのデータ取得をキャッシュ**

トップページで実行していた2件のクエリを `unstable_cache` でキャッシュし、有効期間を1時間、タグを `camping-spots` とした。

スポットを変更する Server Action では `updateTag('camping-spots')` を実行し、併せて詳細ページを `revalidatePath` で再検証する。
Next.js 16 では `revalidateTag` の第2引数が必須となったため、Server Action からの即時無効化には `updateTag` を使用した。

**3. 地図操作時の不要な RSC リクエストを削減**

地図の表示範囲を URL へ反映する処理を、`router.replace` から `window.history.replaceState` へ変更した。

`router.replace` では地図を動かすたびに Next.js のナビゲーションが発生し、RSC リクエストが送信されていた。
履歴だけを更新することで、サーバーへのリクエストを発生させずに URL を同期できるようにした。
ページタイトルは `document.title` で更新した。

これらは移行後の VPS でも有効な改善だが、通常利用で無料枠の超過通知が繰り返される状況になったため、
最適化だけで無料枠内に収め続けるのではなく、移行先の検討を進めることにした。
（VPS では**1コアあたりの性能が効く**ため、CPU を減らす価値はむしろ上がっている。[vps-poc-log.md](vps-poc-log.md)）

## 現在の構成（2026-09-20 移行完了）

```mermaid
flowchart LR
    U["利用者・Androidアプリ"] --> CF["Cloudflare<br/>（プロキシ・キャッシュ）"]
    CF --> T["Cloudflare Tunnel<br/>conoha-vps"]
    T --> D["ConoHa VPS の Docker<br/>Next.js standalone"]
    D --> M["MongoDB Atlas<br/>itinerary_db（本番）"]
```

| 項目 | 値 |
| --- | --- |
| 本番URL | `tabi.over40web.club`（Access なし＝一般公開） |
| 検証用URL | `vps.over40web.club`（Access 保護。**本番DBを見るので操作に注意**） |
| トンネル名 | `conoha-vps`（当初 `vps-trial`。改名しても ID・トークンは変わらず、再設定は不要だった） |
| VPS | ConoHa 4GB / 4Core / SSD 100GB、まとめトク1か月（2,189円、自動更新 ON、2026-10-19 まで） |
| ネームタグ | `tns-web-staging`（作成時の名前。実態は本番） |
| 切り戻し | Cloudflare の DNS で `tabi` を Vercel の CNAME に戻す（下記） |

## 検討して見送った選択肢

| 候補                     | 見送った理由                                                                                                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Netlify**            | 試験デプロイ（2026-09-15）まで行ったが、日本からアクセスした場合の応答速度が実用上厳しかった。配信元リージョンの選択には有料プランが必要となり、費用面でVercelから移行する利点が小さいため候補から外した。なお、この検証を通じて、トップページで発生した500エラーの原因がNext.js 16.2.10のLinuxビルドにおけるマニフェスト欠落であり、16.3.5への更新で解消することを確認できた。 |
| **Cloudflare Workers** | PoC（2026-09-14）の結果、現状の構成のままでは運用できないと判断した。Mongooseの共有接続が並列アクセス時に不安定になり、データアクセス層の書き換えが必要だった。また、生成されたWorkerが6.7MiBとなり、無料プランのサイズ上限も超過した。                                                                           |
| **自宅ミニPC**             | セルフホスティング自体の検証は完了した（[poc-log.md](poc-log.md)）。ただし初期費用が約7万円かかり、月額1,751円のVPSとの単純比較でも損益分岐点は約4年後となる。さらに、侵害された場合の家庭内ネットワークへの影響、停電・回線障害、アクセス増加時の上り回線負荷を自宅で引き受ける必要があるため、VPSを優先した。                                       |
| **Vercel Pro**         | 移行作業が不要で、Next.jsとの親和性や運用の容易さでは最も有力だった。しかし、基本料金に加えて利用量に応じた課金が発生し得るため、広告収入を中心とした小規模サービスでは収支を予測しにくい。今回選定した月額固定のVPSと比較し、継続費用を抑えやすいVPSを選んだ。                                                                         |

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

### 4. CDN キャッシュの違いに対応する（2026-09-19 に判明）

`/api/camping-spots`（[route.ts](../../src/app/api/camping-spots/route.ts)）は `s-maxage=3600` を付けて
**Vercel の CDN にキャッシュさせ、DB への到達を抑える**設計になっている。ところが **Cloudflare は初期設定でこれをキャッシュしない**。

実測（2026-09-19）:

| 環境 | 2回目のアクセス |
| --- | --- |
| 本番 Vercel | `x-vercel-cache: HIT`（キャッシュが効く） |
| VPS（Cloudflare 経由） | `cf-cache-status: DYNAMIC`（毎回オリジンまで届く） |

- このままだと、これらの API のアクセスが**毎回 VPS と Atlas に届く**
- **対応済み（2026-09-19）**: Cloudflare の「Cache Rules」を作成（無料プランで設定可）
  - 条件: `http.request.uri` が `/api/camping-spots` または `/api/v1/spots` で始まる
  - キャッシュの適格性: キャッシュの対象／エッジ TTL: **キャッシュ制御ヘッダーがあれば使用**（`s-maxage` に従わせる）
  - 確認: 2回目以降 `cf-cache-status: HIT`。ページ（`/`）は `DYNAMIC` のままで正しい

**重要（2026-09-20 に判明し、修正済み）: `/api/v1/spots` はキャッシュしてはいけない**

- Cache Rules に `/api/v1/spots` を含めたところ、**API キー無しでも 200 が返るようになった**（キャッシュから返るため）
- 理由: Vercel ではキー検証（`src/proxy.ts`）が CDN キャッシュより手前で毎回走るが、
  **Cloudflare のキャッシュはアプリの完全に手前**にあり、ヒットすると `proxy.ts` に届かない
- 対応: Cache Rules の条件を `/api/camping-spots` のみに変更（`starts_with(http.request.uri, "/api/camping-spots")`）
  - 確認: キー無し 401、キーあり 200（`cf-cache-status: DYNAMIC`）、`/api/camping-spots` は `HIT` のまま
- **実施済み（2026-09-26）**: Cloudflare の WAF カスタムルール（セキュリティ → WAF → カスタムルール）で
  `/api/v1/*` のキーをエッジで検証するようにし、Cache Rules に `/api/v1/spots` を追加し直した
  - WAF ルール（`api-v1-key-check`）: `starts_with(http.request.uri.path, "/api/v1") and http.request.headers["x-api-key"][0] ne "<値>"` を**ブロック**
    （`http_request_firewall_custom` フェーズは Cache Rules より先に評価されるため、キャッシュ済みレスポンスもキー無しには返らない）
  - Cache Rules（`api-v1-spots-cache`）: `starts_with(http.request.uri.path, "/api/v1/spots")` を対象に、
    `/api/camping-spots` ルールと同じ「キャッシュ制御ヘッダーが存在する場合は使用」で追加
  - 確認: キー無し/誤ったキー → **403**（WAFがオリジンに届く前に遮断するため、`proxy.ts` が返す401ではなくCloudflareの403になる。正しい挙動）、
    正しいキー → 200、2回目以降 `cf-cache-status: HIT`
  - なお `/api/camping-spots` ルート削除（2026-09-21）時に対応する Cache Rule も削除済みのため、
    このタイミングでは Cache Rules が一時的に0件になっていた（想定どおり）

この2つの API の利用状況（2026-09-19 調査）:

| API | 使っているもの |
| --- | --- |
| `/api/v1/spots` | **Android アプリ**（`tns-mobile`。`https://tabi.over40web.club/api/v1/spots` を直接指定） |
| `/api/camping-spots` | **どこからも使われていない**（Web アプリ内に呼び出し無し、モバイルにも無し。バックエンドの利用者はこの Web アプリと Android アプリだけ、とユーザー確認済み） |

- Android アプリは URL を直接持っているため、**移行してもアプリ側の変更は不要**（同じ `tabi.over40web.club` を見る）
- `/api/camping-spots` の削除は、移行とは別の作業として検討する（移行時に消すと切り分けが難しくなる）
  - **実施済み（2026-09-21）**: ルート（`src/app/api/camping-spots/route.ts`）と、対応する Cloudflare の Cache Rule をいずれも削除した。このページ内の `/api/camping-spots` への言及は、削除前の設定の記録として残す

### 5. 本番トラフィックに耐えるかの確認

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

   - 実行用（VPS の `.env.docker`）とビルド用（開発PCの `BUILD_ENV_FILE`）の**両方**を本番用にする
   ```bash
   # 開発PCから（実行用）
   scp -i ~/.ssh/id_ed25519_conoha .env.production.vps deploy@<VPSのIP>:apps/tns-web/.env.docker
   # ビルド用は .env.deploy.vps の BUILD_ENV_FILE を本番用ファイルに向ける
   ```
3. **イメージを作り直して入れ替える**（`NEXT_PUBLIC_*` と CSP はビルド時に焼き込まれるため、再ビルドが必須）
   ```bash
   bash scripts/deploy-vps.sh
   ```
4. **本番DBを見た状態で動作確認する**（この時点ではまだ `vps.over40web.club` から。Access で保護されている）
   - トップ・地図・スポット詳細・旅程・ログイン・**管理画面の更新**（本番データを触るので慎重に）
   - Sentry にサーバー側のエラーが届くか（意図的に確認する手段があれば）

### 第2段階: 通信を切り替える（ここから利用者に見える）

5. Zero Trust（左メニューの「Zero Trust」）→「ネットワーク」→「Tunnels」→ VPS のトンネル →「公開ホスト名」に追加
   - サブドメイン `tabi` / ドメイン `over40web.club` / タイプ `HTTP` / URL `app:3000`
   - 画面の場所: 左メニュー「ネットワーク」→「**コネクタ**」→ トンネル名 →「**公開アプリケーションルート**」タブ →
     右上の「**＋ 公開アプリケーションルートを追加**」（既存の `vps` の行の「編集」ではない。`vps` は検証用に残す）
   - 保存すると **Cloudflare の DNS に `tabi` の CNAME（`<トンネルID>.cfargotunnel.com`、プロキシ有効）が自動で作られる**
   - **既存の `tabi`（Vercel 向け）があると `A DNS record with this name already exists.` で保存できない。**
     先に DNS 画面で古いレコードを削除してから、もう一度保存する
   - **削除する前に、切り戻し用に値を控える**（下の「切り戻し手順」の表と同じ内容）:
     名前 `tabi` / タイプ `CNAME` / ターゲット `cname.vercel-dns.com` / プロキシ **DNS のみ** / TTL 自動
   - 削除してから作り直すまでの数十秒〜数分は、`tabi.over40web.club` の名前解決ができない（サイトが見られない）
6. **`tabi` を Access の宛先に入れないこと**（一般公開のため）。宛先は `staging` と `vps` のみ
7. 反映を確認する
   ```bash
   dig +short tabi.over40web.club        # Cloudflare のプロキシ用 IP（104.21.x / 172.67.x 等）になる
   curl -sI https://tabi.over40web.club | head -3   # 200 が返り、Access のログイン画面に飛ばされないこと
   ```
8. ブラウザで確認: トップ・地図・スポット詳細・旅程・ログイン・管理画面・PWA
   - **Android アプリ用の `/api/v1/spots` が 200 を返すか**も確認する（`x-api-key` 必要）
9. しばらく監視する（ログ・メモリ・応答時間・Sentry）
10. Vercel 側はそのまま放置（**削除しない**。切り戻しの手段になる）

### 切り戻し手順

1. Cloudflare ダッシュボードで DNS レコードの画面へ（**Zero Trust ではない方**。メニューが分かりにくいので手順を明記）
   1. 左メニューの「**ドメイン**」
   2. 一覧から「**over40web.club**」を選ぶ（「最近」の欄からでもよい）
   3. 左メニューの内容が入れ替わるので、下の方の「**DNS**」→「**レコード**」
2. `tabi` のレコードを、**切り替え前と同じ次の内容**に戻す（レコードが無ければ新規作成する）

   | 項目 | 値 |
   | --- | --- |
   | 名前 | `tabi` |
   | タイプ | `CNAME` |
   | ターゲット | `cname.vercel-dns.com` |
   | プロキシ ステータス | **DNS のみ**（灰色） |
   | TTL | 自動 |
3. 数十秒で Vercel に戻る
4. 必要なら、トンネルの公開ホスト名から `tabi` を外す

> 切り戻すと DB は本番のまま、アプリだけ Vercel 側に戻る。データの不整合は起きない。

## 移行後の運用

### デプロイ（Vercel の「push するだけ」に相当）

VPS では、次のいずれかになる。**最初は A、慣れたら B** を勧める。

**A. 手動デプロイ（`scripts/deploy-vps.sh`）— 2026-09-19 作成・動作確認済み**

開発PCから1コマンドで実行する。**ビルドは開発PCで行う**ので、VPS の CPU を奪わず、サイトの応答に影響しない。

```bash
pnpm deploy            # デプロイ（= bash scripts/deploy-vps.sh）
pnpm deploy:rollback   # 直前の版に戻す
```

**デプロイされるのは「今チェックアウトしているブランチの内容」**（`main` に限定されない）。
事故防止のため、次の場合は確認を求める（`--yes` で飛ばせる。例: `pnpm deploy -- --yes`）:

| 状況 | 確認 |
| --- | --- |
| `main` でコミット済み | なし（そのまま実行） |
| `main` 以外のブランチ | あり |
| 未コミットの変更がある | あり。版名に時刻を足す（例 `4a7f188-dirty-09201442`）。同じ名前が重なると切り戻し先が同じになってしまうため |
| 切り戻し | **常にあり**（現在の版と戻す先を表示する） |

流れ:

1. 開発PCで `APP_IMAGE_TAG=<コミットハッシュ>` を付けてビルド（作業ツリーが汚れていれば `-dirty-<時刻>` が付く）
2. `docker save | gzip | ssh ... docker load` でイメージを転送
3. `compose.yaml` を手元の内容に同期してから入れ替え（VPS 側が古いと設定変更が反映されないため）
4. コンテナが healthy になるまで待ち（最大90秒）、外からの `/api/health` も確認
5. どちらかが失敗したら、**直前の版へ自動で戻す**（切り戻し先はコンテナのラベル `app.image.tag` から取得）

設定は `.env.deploy.vps`（Git 管理外）に書く:

```
VPS_HOST=deploy@<VPSのIP>
VPS_SSH_KEY=~/.ssh/id_ed25519_conoha
VPS_APP_DIR=apps/tns-web          # ホームからの相対パス（~ は使わない。Git Bash がパスを変換してしまう）
BUILD_ENV_FILE=.env.vps           # ビルド時に読ませる環境変数ファイル（開発PC側）
HEALTH_URL=https://vps.over40web.club/api/health
```

- **ビルド用と実行用で環境変数ファイルが別**: ビルドは開発PCの `BUILD_ENV_FILE`、実行は VPS の `.env.docker`。
  `NEXT_PUBLIC_*` と CSP はビルド時に焼き込まれるので、**本番へ出すときは本番用のファイルでビルドする**
- **つまずき2件（2026-09-20、修正済み）**: ビルドが開発用の設定で行われ、次の症状が出た
  - `NEXT_PUBLIC_POSTHOG_KEY` が埋め込まれず、**アクセス解析が動かない**
  - ビルド時に DB を読む処理（`sitemap.ts`・`generateStaticParams`）が開発用 DB を見て、
    **sitemap に本番に存在しない URL が載る**（2,010件。本番は 2,042件）
  - 原因1: スクリプトが設定ファイルを読み込むだけで `export` しておらず、`BUILD_ENV_FILE` が
    `docker compose` に渡っていなかった（secret に既定値の `.env.docker`＝開発用が使われていた）
  - 原因2: **BuildKit の secret はキャッシュキーに含まれない**ため、環境変数ファイルを変えても
    `pnpm build` のレイヤーが再利用される。`ENV_HASH`（ファイルのハッシュ）を build args で渡して検知させる
    （ARG は参照されていないとキャッシュ判定に入らないので、`ENV ENV_HASH=${ENV_HASH}` で参照する）
  - 確認方法: `curl -s https://tabi.over40web.club/sitemap.xml | grep -c 'shachu-haku/[0-9a-f]\{24\}'` が本番の件数と一致すること、
    コンテナ内で `grep -rl phc_ .next/static` が1件以上あること
- 所要時間: 変更なしの再ビルド＋転送で約2分（初回ビルドを含む場合は約4分）
- 観察: 開発PCで作って送ったイメージは 794MB、VPS で直接ビルドしたものは 532MB（理由は未調査。ディスクには余裕がある）
- 動作確認済み: 正常時の完了、`HEALTH_URL` をわざと誤らせた場合の自動切り戻し、`--rollback` の単体実行

参考（VPS 上で直接ビルドする場合）: 約214秒・メモリ 3.6GB＋スワップ 1.1GB（[vps-poc-log.md](vps-poc-log.md)）。
開発PCが使えないときの予備手段とする。

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
ssh deploy@<VPSのIP> 'cd ~/apps/tns-web && docker compose logs -f app'      # ログ
ssh deploy@<VPSのIP> 'docker stats --no-stream'                             # CPU・メモリ
ssh deploy@<VPSのIP> 'cd ~/apps/tns-web && docker compose ps'               # 状態
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
- [x] `scripts/deploy-vps.sh`（健全性の確認と自動切り戻し付き）を作る

- [x] 本番用 `.env.docker` の用意（本番DB・PostHog。Vercel の Sensitive 変数は `vercel env pull` で空になるため、手元の控えから作成）
- [x] AI 生成の所要時間を VPS で確認: **38秒**（開発PCは約40秒）。Cloudflare の上限 125秒に余裕あり。
      待ち時間の大半は Anthropic API の応答待ちで、VPS の CPU 性能の差がほぼ出ない
- [x] 一晩の連続運転の結果確認: 18時間でメモリ 160.9MiB（増加なし）・再起動0回・トンネル接続4本維持・エラー0件
- [x] Cloudflare の Cache Rules（`/api/camping-spots` のみ。`/api/v1/spots` はキー検証のため対象外）
- [x] ハング時の再起動（systemd タイマー + scripts/vps-healthcheck.sh。ハングからの自動復旧を実測: 検知〜復旧 約2分）
