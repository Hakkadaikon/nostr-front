# Nostr Webクライアント 要件仕様（Next.js + Tailwind CSS）

この文書は、Nostr の Web クライアント（以降、本アプリ）の機能・非機能要件、対応 NIP、情報設計、UI 仕様、技術スタック、セキュリティ要件、テスト方針を定義します。実装は Next.js と Tailwind CSS を採用します。

## 1. 目的・スコープ
- 目的: ブラウザ上で Nostr ネットワークに接続し、以下の機能を安全・快適に提供する。
  - 投稿（Short Text Note）
  - リポスト（Repost）
  - リプライ（Reply / スレッド表示）
  - 引用リポスト（Quote Repost）
  - 鍵作成（Key Generation / 管理）
  - プロフィール情報の変更（Profile Metadata 更新）
- スコープ外（初期段階）:
  - DM（NIP-04）やグループチャット（NIP-28）
  - 課金/有料メッセージ（NIP-57など）
  - メディアアップロード機能（外部ホストリンクの表示は可）
  - 複雑なモデレーション（ミュート・ブロックは将来対応）

## 2. 用語・参照仕様（NIP）
- NIP-01: 基本プロトコル（イベント構造、kind、タグ）
- NIP-07: ブラウザ拡張による署名インターフェース（window.nostr）
- NIP-10: Replies, Mentions and Subjects（スレッド・リプライ関連のタグ設計）
- NIP-18: Reposts（リポスト、引用リポストの仕様）
- NIP-19: bech32 エンコード識別子（npub, nsec, note, nevent など）
- NIP-21: nostr: URI スキーム
- NIP-05: DNS ベースの ID（プロフィールに表示・検証のみ、設定は任意）
- NIP-06: 鍵生成/ニーモニック（任意。初期版はランダム生成を基本）

参考ライブラリ: nostr-tools（鍵生成、署名、接続プール、NIP-19 変換 等）

## 3. 技術スタック・アーキテクチャ
- フロントエンド: Next.js（最新安定版、App Router 推奨）、TypeScript 必須
- UI: Tailwind CSS（@tailwindcss/forms 等のプラグイン任意）
- 状態管理: Zustand（軽量で非同期・外部イベントに強い）
- 通信: WebSocket（複数リレー接続、読み/書き制御）
- 暗号・鍵管理: Web Crypto API + nostr-tools
- ストレージ: IndexedDB（localforage など）/ localStorage（安全策の上）
- テスト: Vitest/Jest（単体） + Playwright（E2E）
- 国際化: i18n（最低限の枠のみ、言語: 日本語/英語）
- アーキテクチャ: クリーンアーキテクチャ/Feature-first 構成（feature/compose, feature/timeline 等）

## 4. リレー管理
- 初期推奨リレー（設定画面で編集可能）:
  - wss://relay.damus.io
  - wss://nos.lol
  - wss://kojira.io
  - wss://yabu.me
- リレーごとにフラグ: 読み込み(Read)、書き込み(Write)
- 接続方式: nostr-tools の SimplePool 等を用いてマルチリレー購読
- 失敗時リトライ、バックオフ、ヘルス状態管理

## 5. 機能要件
### 5.1 鍵作成・管理
- 新規鍵作成:
  - ランダムな secp256k1 秘密鍵生成（nostr-tools: generatePrivateKey）
  - 生成後、npub/nsec を NIP-19 形式で表示
  - 保存前にパスフレーズで暗号化（AES-GCM、PBKDF2/Argon2）を推奨（ON/OFF 選択可）
  - ニーモニック（NIP-06）は将来オプション（初期は省略可）
- 既存鍵のインポート:
  - nsec（bech32）または HEX を貼り付け
  - ブラウザ拡張（NIP-07）を優先利用（秘密鍵はアプリに保持しない）
- 鍵ソースの優先度:
  1) NIP-07（window.nostr）
  2) アプリ内安全保管（暗号化ストレージ）
  3) セッションのみ（保存しない一時利用）
- エクスポート: nsec を表示（コピー時に確認モーダル）
- セキュリティ警告: 秘密鍵共有禁止、復号タイミングの最小化、非アクティブ時のロック

### 5.2 投稿（Short Text Note: kind=1）
- 入力: テキスト（最大文字数は UI 側で 1,000〜3,000 文字上限を推奨）
- 送信先: 書き込み可能な全選択リレーへ同報（送信失敗のトラッキング）
- タグ: 任意のメンション、リンク（nostr: URI）を自動検出し NIP-21 対応
- 下書き（任意）: ローカル保存
- 送信後: 自分のタイムラインに即時反映（楽観的更新）

### 5.3 リプライ（NIP-10）
- 対象イベントに対する返信を作成（kind=1）
- e/p タグ設計（NIP-10 準拠）:
  - "e" タグに root/reply マーカー
  - "p" タグに返信先ユーザーの pubkey
- スレッド表示: ルート→中間→返信の階層を整形（失われたノードはプレースホルダ）

### 5.4 リポスト（NIP-18）
- kind=6（Repost）を作成
- タグ: 参照先イベントの "e"（event id）と "p"（著者 pubkey）
- content:
  - 互換性のため、可能なら元イベントの JSON シリアライズを content に格納（実装切替可）
  - 空文字でも可（リレー/クライアントによる）
- 表示: 元投稿を埋め込み表示（取得不可時はリンク/ID表示）

### 5.5 引用リポスト（NIP-18 + NIP-21/NIP-19）
- 新規 kind=1 を作成し、本文にコメント + 引用対象を表現
- タグ:
  - "q" タグで引用対象を示す（nevent/note 参照または event id）
  - 併せて "e"/"p" タグも付与（互換性向上）
- 本文: nostr:nevent…（NIP-21）または note/npub リンクを挿入
- 表示: コメント本文 + 埋め込み対象ノートのプレビュー

### 5.6 プロフィール情報変更（kind=0）
- 編集可能フィールド（NIP-01 準拠）:
  - name（ハンドル名）
  - display_name（表示名）
  - about（自己紹介）
  - picture（アバター URL）
  - banner（バナー URL）
  - website（任意）
  - nip05（任意、検証リンク表示）
- 変更は kind=0 イベントとして publish
- 自分のプロフィールプレビューと即時反映（楽観的更新）

## 6. UI/UX 仕様
### 6.1 ページ/ルーティング（Next.js App Router）
- "/" ホーム/タイムライン
- "/note/[id]" ノート詳細（スレッド）
- "/profile/[npub]" プロフィール表示
- "/settings" 設定（リレー・鍵・表示）
- "/onboarding" 初期セットアップ（鍵ソース選択）

### 6.2 主要コンポーネント
- ComposeBox（投稿/リプライ/引用用入力）
- NoteCard（本文、メタ情報、アクション: 返信/リポスト/引用）
- ThreadView（NIP-10 階層表示）
- ProfileEditor（プロフィール編集フォーム）
- RelayManager（接続/読み書きフラグ、追加/削除）
- KeyManager（生成/インポート/エクスポート/ロック）
- Toast/Alert（送受信・署名・エラー通知）

### 6.3 ナビゲーション
- サイドバー（Home, Profile, Settings）
- ヘッダ（検索ボックスは将来。現在は ID/URI 直入力から遷移）

### 6.4 スタイル指針（Tailwind）
- ダーク/ライトテーマ（prefer-color-scheme 対応）
- モバイル最適化（下部タブ/FAB で投稿）
- アクセシビリティ（コントラスト比、フォーカス可視、キーボード操作）

## 7. データモデル・イベント仕様
### 7.1 イベント基本形（NIP-01）
- 共通: { id, pubkey, created_at, kind, tags, content, sig }
- 署名: 秘密鍵または NIP-07 経由で作成
- NIP-19 変換: id→note/nevent、pubkey→npub、privkey→nsec

### 7.2 投稿（kind=1）
- content: プレーンテキスト
- tags: メンション（"p"）、参照（"e"）、引用（"q"）、URL/nostr: の抽出は表示側で

### 7.3 リプライ（kind=1 + NIP-10）
- tags: ["e", <root-id>, "", "root"], ["e", <reply-to-id>, "", "reply"], ["p", <author-pubkey>]
- content: 本文

### 7.4 リポスト（kind=6, NIP-18）
- tags: ["e", <event-id>], ["p", <author-pubkey>]
- content: "<original-event-json>" or ""

### 7.5 引用リポスト（kind=1, NIP-18）
- tags: ["q", <event-id or nevent>], ["e", <event-id>], ["p", <author-pubkey>]
- content: 本文 + "nostr:nevent1..."（または note1...）

### 7.6 プロフィール（kind=0）
- content(JSON): { name, display_name, about, picture, banner, website, nip05 }

## 8. 状態管理・キャッシュ
- セッション状態: ログインユーザー（npub/nsec or NIP-07）、接続中リレー
- タイムラインキャッシュ: イベント id をキーに正規化（by id、by author）
- 署名要求のキュー制御（連打防止）
- ページ間共有: Zustand の slices（auth, relays, timeline, profile）

## 9. エラーハンドリング・リカバリ
- リレー接続失敗: バックオフ + 切替
- 投稿失敗: リトライ/ドラフト保存、失敗リレーの一覧提示
- 署名拒否（NIP-07）: 明確なガイダンス（アプリ内鍵に切替案内）
- 不正イベント: 署名検証エラー表示、埋め込み抑制

## 10. セキュリティ・プライバシー
- 秘密鍵の取り扱い最小化（NIP-07 優先）
- アプリ内鍵は暗号化保存（AES-GCM、PBKDF2/Argon2）
- クリップボードコピー時の明示確認
- XSS/リンク表示: nostr: URI のみ自動リンク、http(s) は rel=noopener/noreferrer
- 画像はプロキシ/オプトイン読み込みの設定（将来）

## 11. パフォーマンス
- リストの仮想化（大型タイムライン）
- イベント去重（id 重複排除）
- バンドル最適化（Next.js 自動分割）
- 画像遅延読み込み

## 12. ログ・計測
- 重要イベント（送信成功/失敗、署名エラー）を匿名でローカル記録（開発時）
- 本番の外部計測はオプトイン

## 13. アクセシビリティ
- WAI-ARIA 適用、フォームラベル、キーボード操作、スクリーンリーダー告知

## 14. 開発フロー・テスト
- ブランチ戦略: main（安定）/ feature/*（機能単位）
- 単体テスト: 鍵生成、NIP-19 変換、タグ構築、レンダリング
- 統合テスト: リレー接続モック（WS サーバ）で投稿/受信
- E2E: 初回セットアップ→投稿→返信→リポスト→引用→プロフィール編集の一連

## 15. 設定・環境
- 環境変数: 既定リレー一覧、機能フラグ（NIP-07 必須/任意）、計測 ON/OFF
- ビルド: Node LTS、Next.js 推奨設定

## 16. 将来拡張（候補）
- ミュート/ブロック（NIP-51 等のリスト）
- リアクション（NIP-25）
- 長文（NIP-23）
- イベント委任（NIP-26）
- 検索/発見性強化

## 17. 受け入れ基準（抜粋）
- 投稿/リプライ/リポスト/引用/プロフィール編集/鍵生成が UI から実行でき、指定の複数リレーに publish される
- 受信したイベントがタイムラインと詳細ページで正しく表示される
- NIP-07 が利用可能な環境では秘密鍵を保持せず利用できる
- アプリ内鍵保存時に暗号化 ON を選択できる
- 主要 UI がスマホ/PC で崩れず操作できる

---

この仕様は初期実装の指針です。実装中の知見に応じて、NIP 仕様の差異や互換性要件を反映して更新します。
