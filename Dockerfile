FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install

COPY . .

# Render provides PORT (normally 10000). The existing source uses port 3000,
# so patch the built server inside the image to honor Render's PORT without
# changing the application's routes or frontend/backend logic.
RUN npm run build \
  && sed -i 's/const PORT = 3000;/const PORT = Number(process.env.PORT) || 3000;/' dist/server.cjs

ENV NODE_ENV=production
EXPOSE 10000

CMD ["npm", "start"]
