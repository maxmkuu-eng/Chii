FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Render provides $PORT, while the existing MKUU server listens on 3000.
# Keep the application unchanged and bridge Render's port to port 3000.
RUN apt-get update \
  && apt-get install -y --no-install-recommends socat \
  && rm -rf /var/lib/apt/lists/*

CMD ["sh", "-c", "socat TCP-LISTEN:${PORT},fork,reuseaddr TCP:127.0.0.1:3000 & exec npm start"]
