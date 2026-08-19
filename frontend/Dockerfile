# このPoC用のDockerfile。
# 開発用ステージ(dev)と、本番相当ビルドをローカルで検証するためのステージ(prod)の
# 2段構成。本番デプロイ(ECS Fargate等)は想定しない、あくまでローカル検証用。

# 依存関係のインストールとソースのコピーまでは dev/prod で共通
FROM node:22-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 開発用ステージ(既存)。docker-compose.yml の `frontend` サービスが使う。
# `vite dev`(react-router dev)によるSSRは開発用の挙動であり、本番相当のビルド・
# 配信とは異なる(ホットリロードのためソースはvolumeマウントで上書きされる想定)。
FROM base AS dev

EXPOSE 5173

# --host を付けないと、コンテナの外(ホストのブラウザ)からアクセスできない
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# 本番相当ステージ(PR19)。docker-compose.yml の `frontend-prod` サービスが使う。
# `npm run build`(react-router build)でサーバー/クライアント双方のビルド成果物を
# 作った上で、`npm run start`(react-router-serve)で配信する。開発用の `vite dev` の
# SSRとは異なり、本番ビルド後の挙動(バンドル・圧縮済みのコード配信)を検証できる。
FROM base AS prod

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
