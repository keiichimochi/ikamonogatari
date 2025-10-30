<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# イカ物語 - スロットゲーム

スロットゲーム「イカ物語」のソースコードです。

## ローカルで実行

**前提条件:** Node.js

1. 依存関係をインストール:
   ```bash
   npm install
   ```

2. アプリを実行:
   ```bash
   npm run dev
   ```

## Vercelで公開（推奨）

Vercelを使えば、ランキング機能が自動的に動作します。Firebaseなどの外部サービスは不要です。

### デプロイ手順

1. [Vercel](https://vercel.com/)にログイン（GitHubアカウントでログイン可能）
2. 新しいプロジェクトを作成
3. GitHubリポジトリをインポート
4. 設定はそのままで「Deploy」をクリック
5. デプロイが完了すると自動的にURLが発行されます

### ランキング機能

VercelのServerless FunctionsとVercel KVを使用してランキング機能を実装しています。
- 最高得点をランキングに送信できます
- ランキングはVercel KVに永続的に保存されます
- Vercel KVの設定が必要です

#### Vercel KVの設定手順

1. Vercelダッシュボードでプロジェクトを開く
2. Settings > Storage に移動
3. "Create Database" をクリック
4. "KV" を選択して作成
5. データベース名を入力（例: `ikamonogatari-kv`）
6. 作成後、環境変数が自動的に設定されます

**本番環境（Vercel）**: 環境変数は自動的に設定されているため、追加の設定は不要です。`@vercel/kv`が自動的に環境変数を読み込みます。

**ローカル開発でテストする場合**: Vercelダッシュボードで表示されている環境変数を`.env.local`ファイルにコピーしてください：

```bash
KV_URL="your-kv-url"
KV_REST_API_TOKEN="your-token"
KV_REST_API_URL="your-api-url"
KV_REST_API_READ_ONLY_TOKEN="your-read-only-token"
REDIS_URL="your-redis-url"
```

これでランキングが永続的に保存され、Vercelの再起動後も消えません。

## GitHub Pagesで公開（オプション）

このリポジトリはGitHub Pagesでも公開できますが、ランキング機能は動作しません。

### デプロイ手順

1. GitHubリポジトリの設定を開く
2. Settings > Pages に移動
3. Source を "GitHub Actions" に設定
4. `main`ブランチにプッシュすると自動的にデプロイされます

デプロイが完了すると、以下のURLでアクセスできます:
```
https://keiichimochi.github.io/ikamonogatari/
```

## ビルド

```bash
npm run build
```

ビルド成果物は`dist`フォルダに出力されます。
