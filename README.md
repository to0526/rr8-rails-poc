# rr8-rails-poc

React Router v8(Data Mode) + Rails(APIモード)の検証用リポジトリです。
詳しい方針・スコープは [CLAUDE.md](./CLAUDE.md)、実装のロードマップは
[docs/implementation-plan.md](./docs/implementation-plan.md) を参照してください。

## 構成

- `backend/` : `rails new --api` で作成した、このリポジトリ専用のRails APIアプリ
- `frontend/` : Vite + React 19 + react-router v8(Data Mode)のフロントエンド
- `docker-compose.yml` : frontend/backend/db をまとめて起動するローカル開発環境

## 動作確認方法(docker-compose)

### 事前準備

```bash
cp .env.example .env
```

### 起動

```bash
docker-compose up
```

期待結果:
- `db` コンテナがヘルスチェックを通過してから `backend` が起動する
- `backend` は起動時に自動でDB作成・マイグレーション(`db:prepare`)を行う
- 最終的に以下がそれぞれ起動する
  - フロントエンド: http://localhost:5173
  - バックエンドAPI: http://localhost:3000

### 確認ポイント

- ブラウザで http://localhost:5173 を開き、トップページ(「rr8-rails-poc」の見出し)が表示されること
- 別ターミナルで `curl -i http://localhost:3000/up` を叩き、`HTTP/1.1 200 OK` が返ること
  (backendが単体で正常に起動し、MySQLにも接続できていることの確認)

### 後片付け

```bash
docker-compose down
```

DBのデータも含めて完全に消したい場合:

```bash
docker-compose down -v
```

### トラブルシューティング

#### `bind host port 0.0.0.0:3306: address already in use`

ホストの3306番ポートが他のプロセス(ローカルにインストール済みのMySQLなど)に
使われている場合に発生する。`.env` に以下を追加してから `docker-compose up` を
やり直す(コンテナ同士の通信には影響しない)。

```bash
echo "DB_PORT=3307" >> .env
```
