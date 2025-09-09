# 評価システム マイグレーション ガイド

## 概要

車中泊スポットの評価システムを主観的評価から客観的データベースに移行するためのマイグレーション手順です。

## 移行前・移行後の比較

### 旧システム（主観的評価）

```javascript
{
  quietnessLevel: 1-5,    // 主観的な静けさ評価
  securityLevel: 1-5,     // 主観的な治安評価
  overallRating: 1-5      // 主観的な総合評価
}
```

### 新システム（客観的データ）

```javascript
{
  security: {
    hasGate: boolean,       // ゲート有無
    hasLighting: boolean,   // 照明十分
    hasStaff: boolean       // 管理人・職員有無
  },
  nightNoise: {
    hasNoiseIssues: boolean,  // 夜間騒音問題有無
    nearBusyRoad: boolean,    // 交通量多い道路近く
    isQuietArea: boolean      // 静かなエリア
  }
}
```

## マイグレーション実行手順

### 1. バックアップの作成

```bash
# MongoDBデータのバックアップ
mongodump --uri="your_mongodb_uri" --out backup_before_migration
```

### 2. マイグレーションの実行

```bash
# 評価システムマイグレーション実行
cd scripts
node migrate-rating-system.js
```

### 3. 実行内容

マイグレーションスクリプトが以下を自動実行します：

- ✅ 新しい `security` フィールドを全レコードに追加
- ✅ 新しい `nightNoise` フィールドを全レコードに追加
- ✅ 既存の `hasGate` から `security.hasGate` にデータ移行
- ✅ 施設タイプ別の推論設定（RV パーク等は `hasStaff: true`）
- ✅ SA/PA は `nearBusyRoad: true` に設定
- ✅ 統計情報の表示

### 4. 既存フィールドの扱い

**段階的廃止により当面保持:**

- `quietnessLevel` - 自動計算に移行後削除予定
- `securityLevel` - 自動計算に移行後削除予定
- `overallRating` - 削除予定（総合評価は廃止）

## マイグレーション後の運用

### 新しい管理画面

- セキュリティ情報（ゲート、照明、管理人）をチェックボックスで入力
- 夜間環境情報（騒音問題、交通状況、静寂性）をチェックボックスで入力
- 治安・静けさレベルは入力データから自動計算

### 自動計算ロジック

```javascript
// 治安レベル = 施設タイプデフォルト + セキュリティ要因
securityLevel = getDefaultByType(type) + hasGate + hasStaff + hasLighting;

// 静けさレベル = 基本値 + 環境要因
quietnessLevel = 3 - hasNoiseIssues - nearBusyRoad + isQuietArea + hasGate;
```

## 将来の完全移行スケジュール

### Phase 2（データ蓄積後）

1. 十分な客観的データが蓄積
2. 旧フィールドから新システムへの完全移行
3. 旧フィールドの削除

### Phase 3（最終段階）

1. 自動計算ロジックの精度向上
2. ユーザー重み付け機能の検討
3. API 応答の最適化

## ロールバック手順

問題が発生した場合：

```bash
# バックアップからの復元
mongorestore --uri="your_mongodb_uri" backup_before_migration

# 新しいフィールドのみ削除する場合
db.campingspots.updateMany(
  {},
  {
    $unset: {
      security: "",
      nightNoise: ""
    }
  }
)
```

## 注意事項

- マイグレーション中はサービス停止を推奨
- 大量データの場合は時間がかかる可能性があります
- バックアップは必須です
- テスト環境での事前確認を推奨

## サポート

問題が発生した場合は開発チームまでお問い合わせください。
