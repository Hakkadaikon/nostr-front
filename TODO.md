# TODO: Xクローン Webアプリケーション（Next.js + Tailwind）

本 TODO は、X（旧Twitter）のようなソーシャルメディアプラットフォームを Next.js と Tailwind CSS で実装するためのタスクリストです。Feature-first 構成に従い、段階的に機能を追加していきます。

優先度: P0=最優先(MVP必須) / P1=優先(初期版で入れたい) / P2=後回し可(将来拡張)

---

## フェーズ0: プロジェクト初期化（P0）
- [ ] Next.js プロジェクト作成（App Router + TypeScript + Tailwind）
  - [ ] `create-next-app`（app router/ts/tailwind 有効）
  - [ ] `postcss.config.js`, `tailwind.config.ts`, `styles/globals.css`, `styles/tailwind.css` セット
  - [ ] `next.config.js` ひな型
- [ ] 依存関係の導入
  - [ ] runtime: `zustand`, `axios`, `socket.io-client`, `date-fns`, `zod`, `react-hook-form`
  - [ ] auth: `next-auth`, `bcryptjs`, `jsonwebtoken`
  - [ ] database: `prisma`, `@prisma/client`
  - [ ] ui: `@radix-ui/react-*`, `react-hot-toast`, `react-intersection-observer`
  - [ ] test: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`
  - [ ] lint/format: `eslint` (+ next plugin), `prettier`
- [ ] 基本設定
  - [ ] `.gitignore`, `.editorconfig`
  - [ ] `tsconfig.json`（paths など必要であれば設定）
  - [ ] `.env.example` 雛形追加（DB接続、JWT秘密鍵、OAuth設定）
- [ ] CI（任意 P1）
  - [ ] GitHub Actions: lint/test/build を最低限

受け入れ基準:
- `npm run dev` で起動でき、`/` が表示される
- Tailwind が有効である

---

## フェーズ1: フォルダ構成と土台（P0）
- [ ] フォルダ雛形の作成
  - [ ] `app/` ルーティング雛形
    - [ ] `app/layout.tsx`（認証状態管理、ナビ）
    - [ ] `app/page.tsx`（ホーム/タイムライン）
    - [ ] `app/(auth)/login/page.tsx`
    - [ ] `app/(auth)/signup/page.tsx`
    - [ ] `app/status/[id]/page.tsx`（ツイート詳細）
    - [ ] `app/[username]/page.tsx`（プロフィール）
    - [ ] `app/[username]/status/[id]/page.tsx`（ユーザーのツイート）
    - [ ] `app/settings/page.tsx`
    - [ ] `app/messages/page.tsx`（DM）
    - [ ] `app/notifications/page.tsx`
    - [ ] `app/api/health/route.ts`
    - [ ] `app/api/auth/[...nextauth]/route.ts`
    - [ ] `app/api/tweets/route.ts`
    - [ ] `app/api/users/route.ts`
  - [ ] `components/` 雛形
    - [ ] `components/layout/{Sidebar.tsx, Header.tsx, MobileNav.tsx, SearchBar.tsx}`
    - [ ] `components/ui/{Button.tsx, Input.tsx, Textarea.tsx, Modal.tsx, Avatar.tsx, Toast.tsx, Spinner.tsx, Tabs.tsx, Dropdown.tsx}`
    - [ ] `components/tweets/{TweetCard.tsx, TweetComposer.tsx, TweetActions.tsx, TweetThread.tsx}`
    - [ ] `components/profile/{ProfileCard.tsx, ProfileEditor.tsx, FollowButton.tsx}`
    - [ ] `components/auth/{LoginForm.tsx, SignupForm.tsx, AuthModal.tsx}`
    - [ ] `components/notifications/NotificationItem.tsx`
    - [ ] `components/messages/MessageThread.tsx`
  - [ ] `features/` 雛形（機能別整理）
    - [ ] `features/auth/{hooks/useAuth.ts, services/auth.ts, types.ts}`
    - [ ] `features/tweets/{hooks/useTweets.ts, services/tweets.ts, types.ts}`
    - [ ] `features/timeline/{hooks/useTimeline.ts, services/timeline.ts, types.ts}`
    - [ ] `features/profile/{hooks/useProfile.ts, services/profile.ts, types.ts}`
    - [ ] `features/follow/{hooks/useFollow.ts, services/follow.ts, types.ts}`
    - [ ] `features/notifications/{hooks/useNotifications.ts, services/notifications.ts, types.ts}`
    - [ ] `features/messages/{hooks/useMessages.ts, services/messages.ts, types.ts}`
  - [ ] `lib/` 雛形
    - [ ] `lib/api/{client.ts, endpoints.ts}`
    - [ ] `lib/auth/{jwt.ts, session.ts}`
    - [ ] `lib/db/{prisma.ts}`
    - [ ] `lib/utils/{validators.ts, formatters.ts, constants.ts}`
    - [ ] `lib/websocket/{client.ts, events.ts}`
  - [ ] `stores/{auth.store.ts, ui.store.ts, notifications.store.ts}`
  - [ ] `hooks/{useToast.ts, useTheme.ts, useInfiniteScroll.ts, useDebounce.ts}`
  - [ ] `prisma/schema.prisma`（データモデル定義）
  - [ ] `styles/{globals.css, tailwind.css}`
  - [ ] `public/{icons/, images/, favicon.ico}`
  - [ ] `tests/{unit/, integration/, e2e/}`

受け入れ基準:
- 主要ディレクトリが存在し、空コンポーネント/関数の雛形がビルド可能

---

## フェーズ2: 認証・データベース基盤（P0）
- [ ] Prisma スキーマ定義
  - [ ] User モデル（id, username, email, password, bio, avatar, createdAt）
  - [ ] Tweet モデル（id, content, userId, createdAt, updatedAt）
  - [ ] Like モデル（userId, tweetId, createdAt）
  - [ ] Retweet モデル（userId, tweetId, createdAt）
  - [ ] Follow モデル（followerId, followingId, createdAt）
  - [ ] Notification モデル（type, userId, actorId, tweetId, createdAt, read）
  - [ ] Message モデル（senderId, receiverId, content, createdAt, read）
- [ ] NextAuth.js 設定
  - [ ] 認証プロバイダー設定（Credentials, Google, GitHub）
  - [ ] JWT/Session 管理
  - [ ] ミドルウェアでのルート保護
  - [ ] カスタムサインイン/サインアップページ
- [ ] API エンドポイント基本実装
  - [ ] 認証エンドポイント（login, signup, logout）
  - [ ] ユーザー管理エンドポイント（profile取得/更新）
- [ ] バリデーション
  - [ ] Zod スキーマ定義
  - [ ] フォームバリデーション（react-hook-form）

受け入れ基準:
- ユーザー登録・ログイン・ログアウトが動作
- 認証状態が維持される

---

## フェーズ3: コア機能実装（MVP）（P0）
### ツイート機能
- [ ] `features/tweets/` 実装
  - [ ] ツイート投稿（テキスト、画像添付は P1）
  - [ ] ツイート削除（自分のツイートのみ）
  - [ ] ツイート表示（単体、スレッド）
  - [ ] 文字数制限（280文字）とカウンター
- [ ] `components/tweets/` 実装
  - [ ] TweetComposer（投稿フォーム）
  - [ ] TweetCard（ツイート表示）
  - [ ] TweetActions（返信、RT、いいね、共有）

### タイムライン
- [ ] `features/timeline/` 実装
  - [ ] ホームタイムライン（フォロー中のツイート）
  - [ ] 無限スクロール実装
  - [ ] リアルタイム更新（WebSocket）
  - [ ] プルトゥリフレッシュ（モバイル）

### いいね・リツイート
- [ ] いいね機能（追加/削除、カウント表示）
- [ ] リツイート機能（追加/削除、カウント表示）
- [ ] 引用リツイート（P1）
- [ ] 楽観的更新の実装

### プロフィール
- [ ] `features/profile/` 実装
  - [ ] プロフィール表示（ツイート、フォロー/フォロワー数）
  - [ ] プロフィール編集（名前、bio、アバター）
  - [ ] ユーザーのツイート一覧
- [ ] `features/follow/` 実装
  - [ ] フォロー/アンフォロー機能
  - [ ] フォロー/フォロワー一覧表示

受け入れ基準:
- ツイートの投稿・表示・削除が可能
- タイムラインが表示される
- いいね・リツイートが動作
- プロフィールの表示・編集が可能
- フォロー機能が動作

---

## フェーズ4: 追加機能（P1）
### 返信・スレッド
- [ ] 返信機能（ツイートへの返信）
- [ ] スレッド表示（会話の流れ）
- [ ] 返信数カウント

### 通知
- [ ] 通知システム実装
  - [ ] いいね通知
  - [ ] リツイート通知
  - [ ] フォロー通知
  - [ ] 返信通知
- [ ] 通知の既読管理
- [ ] プッシュ通知（P2）

### 検索
- [ ] ユーザー検索
- [ ] ツイート検索（全文検索）
- [ ] ハッシュタグ機能
- [ ] トレンド表示（P2）

### DM（ダイレクトメッセージ）
- [ ] メッセージ送受信
- [ ] 会話一覧
- [ ] リアルタイムチャット（WebSocket）
- [ ] 既読機能

受け入れ基準:
- 返信とスレッド表示が動作
- 通知が表示される
- 検索機能が動作
- DMの送受信が可能

---

## フェーズ5: UI/UX改善（P1）
- [ ] レスポンシブデザイン
  - [ ] モバイルビュー最適化
  - [ ] タブレットビュー
  - [ ] デスクトップビュー（3カラムレイアウト）
- [ ] ダークモード
  - [ ] テーマ切り替え機能
  - [ ] システム設定連動
- [ ] アクセシビリティ
  - [ ] キーボードナビゲーション
  - [ ] スクリーンリーダー対応
  - [ ] ARIA属性
- [ ] パフォーマンス最適化
  - [ ] 画像の遅延読み込み
  - [ ] 仮想スクロール（大量ツイート対応）
  - [ ] キャッシュ戦略

受け入れ基準:
- 各デバイスサイズで適切に表示
- ダークモードが動作
- Lighthouse スコア改善

---

## フェーズ6: 非機能要件（P1）
### セキュリティ
- [ ] CSRF対策
- [ ] XSS対策（入力サニタイズ）
- [ ] レート制限
- [ ] SQL インジェクション対策

### エラーハンドリング
- [ ] グローバルエラーハンドラー
- [ ] ユーザーフレンドリーなエラーメッセージ
- [ ] エラー境界（Error Boundary）
- [ ] 404/500ページ

### ロギング・モニタリング
- [ ] エラーロギング
- [ ] パフォーマンスモニタリング
- [ ] ユーザー行動分析（オプトイン）

受け入れ基準:
- セキュリティ脆弱性がない
- エラーが適切にハンドリングされる

---

## フェーズ7: テスト（P0〜P1）
- [ ] 単体テスト
  - [ ] コンポーネントテスト
  - [ ] hooks テスト
  - [ ] API ルートテスト
  - [ ] ユーティリティ関数テスト
- [ ] 統合テスト
  - [ ] 認証フロー
  - [ ] ツイート投稿フロー
  - [ ] フォロー機能
- [ ] E2Eテスト（Playwright）
  - [ ] ユーザー登録〜ツイート投稿
  - [ ] タイムライン表示
  - [ ] プロフィール編集

受け入れ基準:
- テストカバレッジ 70% 以上
- CI でテストが自動実行される

---

## ストア/状態管理
- [ ] `stores/auth.store.ts`: ログイン状態、ユーザー情報
- [ ] `stores/ui.store.ts`: モーダル、トースト、テーマ
- [ ] `stores/notifications.store.ts`: 通知状態、未読数

---

## ルーティング/ページ
- [ ] `/` ホームタイムライン
- [ ] `/explore` 話題のツイート
- [ ] `/notifications` 通知
- [ ] `/messages` ダイレクトメッセージ
- [ ] `/[username]` ユーザープロフィール
- [ ] `/status/[id]` ツイート詳細
- [ ] `/settings` 設定

---

## バックログ/将来拡張（P2）
- [ ] ブックマーク機能
- [ ] リスト機能
- [ ] スペース（音声チャット）
- [ ] ツイート予約投稿
- [ ] アナリティクス（ツイート分析）
- [ ] 広告システム
- [ ] ブルーバッジ（認証マーク）
- [ ] コミュニティノート
- [ ] 投票機能
- [ ] GIF/動画投稿
- [ ] 絵文字リアクション

---

## 開発フロー
- [ ] ブランチ戦略: `main` / `develop` / `feature/*`
- [ ] PR テンプレート
- [ ] コードレビュー必須
- [ ] コミット規約（conventional commits）

---

## 技術的な注意点
- [ ] パフォーマンス: 大量のツイートでも高速動作
- [ ] スケーラビリティ: ユーザー数増加に対応
- [ ] リアルタイム性: WebSocket による即時更新
- [ ] SEO対策: メタタグ、OGP設定
- [ ] 国際化（i18n）対応準備

---

## 作業の進め方（推奨順）
1. フェーズ0 → 1（環境構築）
2. フェーズ2（認証・DB）
3. フェーズ3（MVP機能）
4. フェーズ7（テスト）※ 各機能と並行
5. フェーズ4（追加機能）
6. フェーズ5（UI/UX）
7. フェーズ6（非機能要件）

---

メモ:
- モバイルファーストで設計
- パフォーマンスを常に意識（React.memo、useMemo、useCallback の適切な使用）
- アクセシビリティは初期から考慮
- セキュリティは妥協しない