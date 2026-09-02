FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 10000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 10000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.cjs"]
