# Multi-stage build for Railway / container hosts
FROM node:22-alpine AS builder
WORKDIR /app
COPY server/package.json server/
COPY client/package.json client/
RUN npm install --prefix server && npm install --prefix client
COPY client ./client
COPY server ./server
RUN npm run build --prefix client

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/
RUN npm install --prefix server --omit=dev
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server/src/index.js"]
