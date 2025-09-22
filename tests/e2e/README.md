# E2E Tests

このディレクトリにはPlaywrightを使用したEnd-to-Endテストが含まれています。

## テスト構成

### テストファイル
- `specs/notifications.spec.ts` - 通知機能のテスト
- `specs/media-embeds.spec.ts` - メディア埋め込み機能のテスト
- `specs/responsive.spec.ts` - レスポンシブデザインとアクセシビリティのテスト
- `specs/app.spec.ts` - 基本的なアプリケーション機能のテスト

### ヘルパー
- `helpers/test-utils.ts` - 共通のテストユーティリティ関数
- `fixtures/notification-fixtures.ts` - テスト用のモックデータ

## テストの実行

```bash
# すべてのE2Eテストを実行
npm run test:e2e

# 特定のテストファイルを実行
npx playwright test tests/e2e/specs/notifications.spec.ts

# UIモードでテストを実行（デバッグに便利）
npx playwright test --ui

# 特定のブラウザでテストを実行
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# ヘッドレスモードを無効にして実行（ブラウザが表示される）
npx playwright test --headed

# デバッグモードで実行
npx playwright test --debug
```

## テストカバレッジ

### 通知機能
- ✅ 通知ページの基本表示
- ✅ 各種通知タイプの表示（いいね、返信、リポスト、フォロー、メンション、Zap）
- ✅ タブによる通知のフィルタリング
- ✅ 通知の既読/未読の切り替え
- ✅ 埋め込みコンテンツの表示（nostr:npub、nostr:nevent、画像）

### メディア埋め込み
- ✅ YouTube動画の埋め込み（サムネイル表示、クリックで再生）
- ✅ X/Twitterの投稿埋め込み
- ✅ Spotifyトラック/アルバムの埋め込み
- ✅ Apple Podcastsの埋め込み
- ✅ 画像とGIFの直接埋め込み
- ✅ 複数メディアの同時埋め込み
- ✅ セキュリティ属性の確認（sandbox、lazy loading）

### レスポンシブデザイン
- ✅ モバイル、タブレット、デスクトップの各ビューポート
- ✅ ダークモードの切り替えと維持
- ✅ アクセシビリティ（ARIAラベル、見出し階層、キーボードナビゲーション）
- ✅ パフォーマンス最適化（遅延読み込み）

## 新しいテストの追加

1. `specs/`ディレクトリに新しいテストファイルを作成
2. 必要に応じて`fixtures/`にテストデータを追加
3. `helpers/test-utils.ts`に共通関数を追加

### テストの書き方の例

```typescript
import { test, expect } from '@playwright/test';
import { navigateToNotifications, findNotificationByType } from '../helpers/test-utils';

test.describe('新機能のテスト', () => {
  test('新機能が正しく動作する', async ({ page }) => {
    await navigateToNotifications(page);
    
    // テストロジック
    const element = await findNotificationByType(page, 'like');
    await expect(element).toBeVisible();
  });
});
```

## デバッグのヒント

1. **スクリーンショット**: テストが失敗した場合、Playwrightは自動的にスクリーンショットを撮影します
2. **トレース**: `playwright.config.ts`で`trace: 'on-first-retry'`が設定されているため、失敗時にトレースが記録されます
3. **VSCode拡張**: Playwright Test for VSCodeを使用すると、エディタ内でテストを実行・デバッグできます
4. **セレクタの確認**: `npx playwright codegen`を使用してセレクタを生成できます

## CI/CD

GitHubActions等でCIを設定する場合は、以下の環境変数を設定してください：

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```