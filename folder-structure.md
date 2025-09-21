# Nostr Webクライアント フォルダ構成（Next.js + Tailwind CSS）

要件定義（requirements.md）をもとにした、App Router + TypeScript + Tailwind CSS 前提の推奨フォルダ構成です。Feature-firstを基本に、共通ライブラリ/ストア/コンポーネントを分離し、NIP対応ヘルパを `lib/nostr` に集約します。

```text
.
├─ app/                               # Next.js App Router（ルーティング/UI骨格）
│  ├─ layout.tsx                      # ルートレイアウト（テーマ適用、ナビ等）
│  ├─ page.tsx                        # "/" ホーム/タイムライン
│  ├─ note/
│  │  └─ [id]/
│  │     └─ page.tsx                 # ノート詳細（スレッド）
│  ├─ profile/
│  │  └─ [npub]/
│  │     └─ page.tsx                 # プロフィール表示
│  ├─ settings/
│  │  └─ page.tsx                    # 設定（リレー・鍵・表示）
│  ├─ onboarding/
│  │  └─ page.tsx                    # 初期セットアップ（鍵ソース選択）
│  ├─ api/                            # 必要に応じたRoute Handlers（SSR/ISRや補助API）
│  │  └─ health/route.ts             # 例: ヘルスチェック
│  └─ (routes groupingなど任意)
│
├─ components/                        # 再利用可能なUIコンポーネント
│  ├─ compose/
│  │  ├─ ComposeBox.tsx              # 投稿/リプライ/引用入力
│  │  └─ QuoteComposer.tsx           # 引用リポスト用入力
│  ├─ notes/
│  │  ├─ NoteCard.tsx                # 本文、メタ、アクション（返信/リポスト/引用）
│  │  ├─ EmbeddedNote.tsx            # 埋め込みノート表示
│  │  └─ ThreadView.tsx              # スレッド（NIP-10階層表示）
│  ├─ profile/
│  │  └─ ProfileEditor.tsx           # プロフィール編集フォーム（kind=0）
│  ├─ relays/
│  │  └─ RelayManager.tsx            # リレー管理UI（読み/書き、追加/削除）
│  ├─ keys/
│  │  └─ KeyManager.tsx              # 鍵生成/インポート/エクスポート/ロック
│  ├─ layout/
│  │  ├─ NavSidebar.tsx              # サイドバー
│  │  ├─ Header.tsx                  # ヘッダ
│  │  └─ ThemeToggle.tsx             # ライト/ダーク切替
│  └─ ui/                            # UIプリミティブ（Tailwindベース）
│     ├─ Button.tsx
│     ├─ Input.tsx
│     ├─ Textarea.tsx
│     ├─ Modal.tsx
│     ├─ Avatar.tsx
│     ├─ Toast.tsx
│     ├─ Spinner.tsx
│     ├─ Tabs.tsx
│     └─ Switch.tsx
│
├─ features/                          # 機能ドメイン（ビジネスロジック/フロー）
│  ├─ auth/
│  │  ├─ hooks/useAuth.ts            # サインイン状態、NIP-07可用性、アカウント切替
│  │  └─ types.ts
│  ├─ relays/
│  │  ├─ hooks/useRelays.ts          # リレー一覧、読み/書きフラグ、ヘルス状態
│  │  ├─ services/relayPool.ts       # nostr-tools SimplePool 管理
│  │  └─ types.ts
│  ├─ timeline/
│  │  ├─ hooks/useTimeline.ts        # タイムライン購読、正規化キャッシュ
│  │  ├─ services/timeline.ts        # 購読クエリ、去重、仮想化補助
│  │  └─ types.ts
│  ├─ notes/
│  │  ├─ buildTags.ts                # NIP-10/18/21/19対応タグ構築
│  │  ├─ publish.ts                  # 投稿/リプライ/リポスト/引用 送信
│  │  ├─ thread.ts                   # スレッド整形（root/replyマーカー）
│  │  └─ types.ts
│  ├─ profile/
│  │  ├─ fetchProfile.ts             # プロフィール取得
│  │  ├─ updateProfile.ts            # kind=0 更新
│  │  └─ types.ts
│  └─ keys/
│     ├─ generate.ts                 # 秘密鍵生成（secp256k1）
│     ├─ import.ts                   # nsec/HEX インポート
│     ├─ export.ts                   # nsec エクスポート（確認モーダル）
│     └─ types.ts
│
├─ lib/                               # 共通ライブラリ（プロトコル/暗号/保管/補助）
│  ├─ nostr/
│  │  ├─ client.ts                   # リレー接続/購読/送信（nostr-tools）
│  │  ├─ nip10.ts                    # リプライ/メンション/スレッドタグ
│  │  ├─ nip18.ts                    # リポスト/引用リポスト支援
│  │  ├─ nip19.ts                    # bech32 変換（npub/nsec/note/nevent）
│  │  └─ signatures.ts               # NIP-07連携、署名/検証
│  ├─ crypto/
│  │  ├─ encrypt.ts                  # AES-GCM 暗号化/復号
│  │  └─ kdf.ts                      # PBKDF2/Argon2 ラッパ
│  ├─ storage/
│  │  ├─ index.ts                    # ストレージ抽象（driver選択）
│  │  ├─ secureStore.ts              # 鍵の暗号化保存（IndexedDB/localforage）
│  │  └─ draftStore.ts               # 下書き保存
│  ├─ utils/
│  │  ├─ logger.ts
│  │  ├─ validators.ts               # 入力/URL/nostr: URI検証
│  │  ├─ url.ts                      # nostr:リンク、外部リンク処理
│  │  └─ constants.ts                # NIP関連 kind/タグ定数、既定値
│  └─ i18n/
│     ├─ index.ts                    # i18n 初期化
│     └─ locales/
│        ├─ en/common.json
│        └─ ja/common.json
│
├─ stores/                            # Zustand ストア（slices）
│  ├─ auth.store.ts
│  ├─ relays.store.ts
│  ├─ timeline.store.ts
│  ├─ profile.store.ts
│  └─ ui.store.ts
│
├─ hooks/                             # 汎用 React Hooks
│  ├─ useToast.ts
│  ├─ useTheme.ts
│  └─ useClipboard.ts
│
├─ styles/
│  ├─ globals.css                     # Tailwind ベースの全体スタイル
│  └─ tailwind.css                    # @tailwind directives
│
├─ public/                            # 静的アセット
│  ├─ icons/
│  ├─ images/
│  └─ favicon.ico
│
├─ tests/                             # テスト（単体/統合/E2E）
│  ├─ unit/
│  │  ├─ lib/
│  │  └─ features/
│  ├─ integration/
│  └─ e2e/
│     ├─ playwright.config.ts
│     ├─ fixtures/
│     └─ specs/
│
├─ mocks/                             # モック/スタブ（WSリレー等）
│  ├─ ws/mockRelayServer.ts           # WebSocketリレーのモック
│  └─ data/events.json
│
├─ scripts/                           # 開発/CI補助スクリプト
│  ├─ dev-relay.ts                    # 開発用ローカルリレー（任意）
│  └─ tmp_rovodev_*                   # 作業用一時スクリプト（後で削除）
│
├─ .env.example                       # 環境変数の例（リレー一覧、機能フラグ等）
├─ next.config.js
├─ tailwind.config.ts
├─ postcss.config.js
├─ tsconfig.json
├─ vitest.config.ts                   # or jest.config.js
├─ package.json
├─ README.md
└─ requirements.md
```

## 設計メモ（要件との対応）
- ルーティング（app/）: requirements.md の以下に対応
  - "/"（Home/Timeline）, "/note/[id]", "/profile/[npub]", "/settings", "/onboarding"
  - window.nostr（NIP-07）を扱うコンポーネントは `"use client"` を付与
- NIP対応ヘルパ（lib/nostr/）:
  - NIP-10: リプライ/スレッドタグ整形、root/replyマーカー
  - NIP-18: リポスト（kind=6）/引用リポスト（kind=1 + リンク）のタグ/表示補助
  - NIP-19/21: bech32/nostr: URI 変換・解析
- 鍵管理（features/keys + components/keys）:
  - 生成/インポート/エクスポート、暗号化保存（AES-GCM + PBKDF2/Argon2）
  - NIP-07優先の署名フローを `lib/nostr/signatures.ts` で抽象化
- タイムライン（features/timeline）:
  - 複数リレー購読、去重、正規化キャッシュ（stores/）
  - 失敗時リトライ/バックオフは `features/relays/services/relayPool.ts` で制御
- 投稿/返信/リポスト/引用（features/notes + components/compose/notes）:
  - タグ構築、publish、埋め込み表示、スレッド整形
- プロフィール編集（features/profile + components/profile）:
  - kind=0 の取得/更新とプレビュー
- 状態管理（stores/）:
  - slices: auth, relays, timeline, profile, ui
- スタイル（Tailwind, styles/ + components/ui）:
  - ダーク/ライトテーマ、アクセシビリティ配慮
- テスト（tests/ + mocks/）:
  - 単体: 鍵生成、NIP-19変換、タグ構築
  - 統合: リレー接続モックで投稿/受信
  - E2E: セットアップ→投稿→返信→リポスト→引用→プロフィール編集
- 環境変数（.env.example）:
  - 既定リレー、機能フラグ（NIP-07必須/任意）、計測ON/OFF

## 実装上の注意
- クライアント専用コンポーネントとサーバーコンポーネントを意識し、署名やwindow依存処理はクライアント側に分離
- 複数リレーへの同報送信時、成功/失敗を UI の Toast/Alert で可視化
- クリップボードコピーや秘密鍵表示時は確認モーダルを必須化
- i18nは必要最低限から開始（ja/en）
- 将来拡張（ミュート/ブロック、リアクション、長文 等）に備え、features 配下を拡張前提で分割

```
開発を始める際は、Next.js プロジェクト作成（ts/app router/tailwind）→ stores と lib/nostr の土台 → features/keys/relays/timeline の最小実装 → UI 組み立て、の順で進めるのがおすすめです。
```
