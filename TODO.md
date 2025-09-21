# TODO: Nostr Webクライアント（Next.js + Tailwind）

本 TODO は、requirements.md と folder-structure.md をもとに、機能/非機能要件をフェーズ別・フォルダ単位で実装タスクに落とし込んだチェックリストです。原則として Feature-first 構成に従い、NIP 対応は `lib/nostr` に集約します。

優先度: P0=最優先(MVP必須) / P1=優先(初期版で入れたい) / P2=後回し可(将来拡張)

---

## フェーズ0: プロジェクト初期化（P0）
- [x] Next.js プロジェクト作成（App Router + TypeScript + Tailwind）
  - [x] `create-next-app`（app router/ts/tailwind 有効）
  - [x] `postcss.config.js`, `tailwind.config.ts`, `styles/globals.css`, `styles/tailwind.css` セット
  - [x] `next.config.js` ひな型
- [ ] 依存関係の導入
  - [x] runtime: `zustand`, `nostr-tools`, `localforage`, `i18next`, `react-i18next`
  - [ ] crypto: （必要に応じて）`@noble/curves`, `@noble/hashes`（nostr-tools 依存状況次第）
  - [x] test: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`
  - [x] lint/format: `eslint` (+ next plugin), `prettier`
- [x] 基本設定
  - [x] `.gitignore`, `.editorconfig`
  - [x] `tsconfig.json`（paths など必要であれば設定）
  - [x] `.env.example` 雛形追加（既定リレー/機能フラグ/計測ONOFF）
- [ ] CI（任意 P1）
  - [ ] GitHub Actions: lint/test/build を最低限

受け入れ基準:
- `npm run dev` で起動でき、`/` が表示される
- Tailwind が有効である

---

## フェーズ1: フォルダ構成と土台（P0）
- [x] フォルダ雛形の作成
  - [x] `app/` ルーティング雛形
    - [x] `app/layout.tsx`（テーマ適用/ナビ）
    - [x] `app/page.tsx`（ホーム/タイムライン）
    - [x] `app/note/[id]/page.tsx`
    - [x] `app/profile/[npub]/page.tsx`
    - [x] `app/settings/page.tsx`
    - [x] `app/onboarding/page.tsx`
    - [x] `app/api/health/route.ts`（簡易ヘルスチェッカー）
  - [x] `components/` 雛形
    - [x] `components/layout/{NavSidebar.tsx, Header.tsx, ThemeToggle.tsx}`
    - [x] `components/ui/{Button.tsx, Input.tsx, Textarea.tsx, Modal.tsx, Avatar.tsx, Toast.tsx, Spinner.tsx, Tabs.tsx, Switch.tsx}`
    - [x] `components/compose/{ComposeBox.tsx, QuoteComposer.tsx}`
    - [x] `components/notes/{NoteCard.tsx, EmbeddedNote.tsx, ThreadView.tsx}`
    - [x] `components/profile/ProfileEditor.tsx`
    - [x] `components/relays/RelayManager.tsx`
    - [x] `components/keys/KeyManager.tsx`
  - [x] `features/` 雛形（hooks/services/types 分割）
    - [x] `features/auth/{hooks/useAuth.ts, types.ts}`
    - [x] `features/relays/{hooks/useRelays.ts, services/relayPool.ts, types.ts}`
    - [x] `features/timeline/{hooks/useTimeline.ts, services/timeline.ts, types.ts}`
    - [x] `features/notes/{buildTags.ts, publish.ts, thread.ts, types.ts}`
    - [x] `features/profile/{fetchProfile.ts, updateProfile.ts, types.ts}`
    - [x] `features/keys/{generate.ts, import.ts, export.ts, types.ts}`
  - [x] `lib/` 雛形
    - [x] `lib/nostr/{client.ts, nip10.ts, nip18.ts, nip19.ts, signatures.ts}`
    - [x] `lib/crypto/{encrypt.ts, kdf.ts}`
    - [x] `lib/storage/{index.ts, secureStore.ts, draftStore.ts}`
    - [x] `lib/utils/{logger.ts, validators.ts, url.ts, constants.ts}`
    - [x] `lib/i18n/{index.ts, locales/en/common.json, locales/ja/common.json}`
  - [x] `stores/{auth.store.ts, relays.store.ts, timeline.store.ts, profile.store.ts, ui.store.ts}`
  - [x] `hooks/{useToast.ts, useTheme.ts, useClipboard.ts}`
  - [x] `styles/{globals.css, tailwind.css}`
  - [x] `public/{icons/, images/, favicon.ico}`
  - [x] `tests/{unit/{lib/, features/}, integration/, e2e/{fixtures/, specs/, playwright.config.ts}}`
  - [x] `mocks/{ws/mockRelayServer.ts, data/events.json}`
  - [x] `scripts/{dev-relay.ts}`（任意）

受け入れ基準:
- 主要ディレクトリが存在し、空コンポーネント/関数の雛形がビルド可能

---

## フェーズ2: プロトコル/ストレージ基盤（P0）
- [x] NIP-19/21/10/18 のヘルパを `lib/nostr/` に実装
  - [x] `nip19.ts`: npub/nsec/note/nevent 変換ユーティリティ
  - [x] `nip10.ts`: e/p タグ整形、root/reply マーカー
  - [x] `nip18.ts`: リポスト/引用リポスト用タグ/表示補助
  - [x] `url.ts`: nostr: URI 検出/生成
- [x] リレー接続クライアント
  - [x] `client.ts`: `nostr-tools` SimplePool で複数リレー購読/送信
  - [x] 接続・購読・送信の抽象化（subscribe, publish, close）
  - [x] 失敗時のリトライ/バックオフ（基本）
- [x] 署名抽象（NIP-07 優先）
  - [x] `signatures.ts`: window.nostr を優先、無い場合はアプリ内鍵
  - [x] 署名/検証ヘルパ、署名要求の直列化（多重対策）
- [x] 永続ストア
  - [x] `secureStore.ts`: AES-GCM + PBKDF2/Argon2 で秘密鍵暗号化保存
  - [x] `draftStore.ts`: 下書き保存（IndexedDB/localforage）
  - [x] `storage/index.ts`: ドライバ抽象
- [x] バリデーション/定数
  - [x] `validators.ts`: 入力/URL/nostr: 検証
  - [x] `constants.ts`: kind/タグ/既定値

受け入れ基準:
- ローカルで複数リレーに購読可能（モックでも可）
- NIP-19 変換/タグ整形の単体テストが通る

---

## フェーズ3: 機能（MVP）（P0）
### 鍵作成・管理（5.1）
- [x] `features/keys/generate.ts`: secp256k1 秘密鍵生成、npub/nsec 変換
- [x] `features/keys/import.ts`: nsec/HEX の取込、NIP-07 優先
- [x] `features/keys/export.ts`: nsec エクスポート（確認モーダル）
- [x] `components/keys/KeyManager.tsx`: UI（生成/インポ/エクスポ/ロック）
- [x] `stores/auth.store.ts`: npub/nsec/NIP-07 状態、ロック状態

受け入れ基準:
- NIP-07 環境では秘密鍵を保存せずに署名可能
- アプリ内鍵保存時は暗号化 ON/OFF を選択できる

### リレー管理（4）
- [x] `features/relays/services/relayPool.ts`: 読み/書きの管理、ヘルス、リトライ
- [x] `features/relays/hooks/useRelays.ts`: リレー一覧/追加/削除/フラグ更新
- [x] `components/relays/RelayManager.tsx`: UI（追加/削除/読み書き切替/状態表示）
- [x] 既定リレーは `.env` or 定数から初期化

受け入れ基準:
- 複数リレーの購読/送信設定が UI で管理できる

### タイムライン & ノート（5.2, 5.3, 5.4, 5.5）
- [x] `features/timeline/services/timeline.ts`: 購読クエリ、去重、正規化
- [x] `features/timeline/hooks/useTimeline.ts`: 受信/キャッシュ/更新
- [x] `features/notes/buildTags.ts`: NIP-10/18/21/19 に基づくタグ構築
- [x] `features/notes/publish.ts`: kind=1/6 publish（リプライ/リポスト/引用含む）
- [x] `features/notes/thread.ts`: スレッド整形（root/replyマーカー）
- [x] `components/compose/{ComposeBox, QuoteComposer}`: 投稿/引用UI
- [x] `components/notes/{NoteCard, EmbeddedNote, ThreadView}`: 表示/アクション
- [x] `app/page.tsx`: タイムライン（仮想化は任意）
- [x] `app/note/[id]/page.tsx`: スレッド詳細

受け入れ基準:
- 投稿/リプライ/リポスト/引用が複数リレーへ publish され、受信・表示される

### プロフィール（5.6）
- [x] `features/profile/{fetchProfile, updateProfile}`: kind=0 取得/更新
- [x] `components/profile/ProfileEditor.tsx`: 編集フォーム
- [x] `app/profile/[npub]/page.tsx`: 表示/プレビュー

受け入れ基準:
- kind=0 更新後、UI で即時反映（楽観的更新）

---

## フェーズ4: UI/UX・設定・国際化（P1）
- [x] ナビゲーション/レイアウト
  - [x] `components/layout/{NavSidebar, Header, ThemeToggle}` 実装
  - [x] アクセシビリティ対応（フォーカス、コントラスト、キーボード操作）
- [x] 設定ページ
  - [x] `app/settings/page.tsx`: リレー/鍵/表示設定まとめ
- [x] i18n
  - [x] `lib/i18n/index.ts` 初期化
  - [x] `locales/ja/common.json`, `locales/en/common.json` の最低限文言
- [x] Toast/Alert
  - [x] `hooks/useToast.ts` と `components/ui/Toast.tsx`
- [ ] モバイル最適化（下部タブ/FAB で投稿などは P2）

受け入れ基準:
- 主要 UI がスマホ/PC で崩れない

---

## フェーズ5: 非機能（P1）
- [x] エラーハンドリング
  - [x] リレー接続失敗時のバックオフ/切替
  - [x] 投稿失敗: リトライ/ドラフト保存、失敗リレーの一覧提示
  - [x] 署名拒否（NIP-07）: アプリ内鍵へ切替ガイダンス
  - [x] 不正イベント: 署名検証エラー表示、埋め込み抑制
- [x] セキュリティ/プライバシー
  - [x] 秘密鍵共有禁止の警告表示、復号タイミング最小化、非アクティブ時ロック
  - [x] クリップボードコピー時の明示確認（モーダル）
  - [x] リンク表示: nostr: のみ自動リンク、http(s) は rel=noopener/noreferrer
- [ ] パフォーマンス
  - [ ] タイムライン仮想化（必要な規模になったら）
  - [x] イベント去重の最適化
  - [x] 画像遅延読み込み
- [x] ログ/計測（開発時のみ）
  - [x] 送信成功/失敗/署名エラーの匿名ローカル記録
  - [x] 本番の外部計測はオプトイン

---

## フェーズ6: テスト・品質保証（P0〜P1）
- [ ] 単体テスト（Vitest/Jest）
  - [ ] 鍵生成（features/keys/generate）
  - [ ] NIP-19 変換（lib/nostr/nip19）
  - [ ] タグ構築（lib/nostr/nip10, nip18, features/notes/buildTags）
  - [ ] レンダリング（主要コンポーネント）
- [ ] 統合テスト
  - [ ] モック WS リレー（`mocks/ws/mockRelayServer.ts`）と連携
  - [ ] 投稿/受信フローの検証
- [ ] E2E（Playwright）
  - [ ] 初回セットアップ → 投稿 → 返信 → リポスト → 引用 → プロフィール編集
  - [ ] 主要デバイス幅での表示確認

受け入れ基準:
- requirements.md の「17. 受け入れ基準」を満たすシナリオがグリーン

---

## ストア/状態管理（8）
- [ ] `stores/auth.store.ts`: npub/nsec/NIP-07 利用可否、ロック/アンロック
- [ ] `stores/relays.store.ts`: 読み/書きフラグ、接続状態
- [ ] `stores/timeline.store.ts`: 正規化キャッシュ（by id / by author）
- [ ] `stores/profile.store.ts`: 自分/表示中プロフィール
- [ ] `stores/ui.store.ts`: トースト、モーダル、テーマ

---

## ルーティング/ページ（6.1）
- [ ] `/` タイムライン（購読 + 表示 + アクション）
- [ ] `/note/[id]` ノート詳細（スレッド）
- [ ] `/profile/[npub]` プロフィール表示
- [ ] `/settings` 設定
- [ ] `/onboarding` 初期セットアップ（鍵ソース選択）

---

## アクセシビリティ（13）（P1）
- [ ] ARIA 属性とフォームラベル
- [ ] フォーカス可視/順序
- [ ] スクリーンリーダー通知（送信成功/失敗/エラー）
- [ ] キーボード操作（投稿/モーダル）

---

## 設定・環境（15）
- [ ] `.env.example` に既定リレー一覧/機能フラグ/計測ONOFF を定義
- [ ] Node LTS / Next.js 推奨設定でビルド

---

## 受け入れ基準（17）とのトレーサビリティ
- [ ] 投稿/リプライ/リポスト/引用/プロフィール編集/鍵生成が UI から実行でき、指定の複数リレーに publish される（フェーズ3）
- [ ] 受信イベントがタイムライン/詳細で正しく表示（フェーズ3）
- [ ] NIP-07 が利用可能な環境で秘密鍵を保持しない（フェーズ2/3）
- [ ] アプリ内鍵保存時に暗号化 ON を選択（フェーズ2/3）
- [ ] 主要 UI がスマホ/PC で崩れず操作（フェーズ4）

---

## バックログ/将来拡張（16, P2）
- [ ] ミュート/ブロック（NIP-51）
- [ ] リアクション（NIP-25）
- [ ] 長文（NIP-23）
- [ ] イベント委任（NIP-26）
- [ ] 検索/発見性強化
- [ ] 画像プロキシ/オプトイン読込の設定

---

## 開発フロー（14）
- [ ] ブランチ戦略: `main` / `feature/*`
- [ ] PR テンプレート/レビュー観点（NIP 対応、セキュリティ、アクセシビリティ）
- [ ] コミット規約（任意）

---

## リスク/留意点
- [ ] NIP 実装差異（クライアント/リレー間）の互換性検討
- [ ] 複数リレー同報時の成功/失敗可視化（Toast/エラー一覧）
- [ ] 秘密鍵の取り扱い最小化（NIP-07 優先）
- [ ] テストのモック品質（WS リレー）

---

## 作業の進め方（推奨順）
1. フェーズ0 → 1（土台/雛形）
2. フェーズ2（NIP/署名/ストレージ基盤）
3. フェーズ3（MVP 機能）
4. フェーズ4（UI/UX/i18n）
5. フェーズ5/6（非機能/テスト強化）

---

メモ:
- `window.nostr` を扱う箇所は `"use client"` を付与
- クリップボードコピー/秘密鍵表示時は確認モーダルを必須化
- 例外/エラーは `useToast` でユーザーに可視化
