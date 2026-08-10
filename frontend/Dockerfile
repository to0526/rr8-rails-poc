# このPoC用の開発向けDockerfile(本番ビルド・配信は想定しない)
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host を付けないと、コンテナの外(ホストのブラウザ)からアクセスできない
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
