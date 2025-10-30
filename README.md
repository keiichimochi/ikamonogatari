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

VercelのServerless Functionsを使用しているため、追加設定なしでランキング機能が動作します。
- 最高得点をランキングに送信できます
- ランキングは自動的に保存・表示されます
- 追加のデータベース設定は不要です

**注意**: 現在の実装ではメモリ内にランキングを保存しているため、複数のインスタンス間でデータが共有されません。本番環境で永続化が必要な場合は、Vercel KVやPostgreSQLなどのデータベースを使用することを推奨します。

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
