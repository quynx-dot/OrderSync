FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/realtime ./services/realtime
RUN npm install --workspace=services/shared --workspace=services/realtime
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/realtime

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/realtime/dist ./services/realtime/dist
COPY --from=builder /app/services/realtime/package.json ./services/realtime/package.json
RUN npm install --workspace=services/shared --workspace=services/realtime --omit=dev
WORKDIR /app/services/realtime
EXPOSE 5004
CMD ["node", "dist/index.js"]