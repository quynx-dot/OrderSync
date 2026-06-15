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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/realtime/dist ./dist
COPY --from=builder /app/services/realtime/package.json ./
COPY --from=builder /app/services/shared ./node_modules/@ordersync/shared
RUN npm install --only=production
EXPOSE 5004
CMD ["node", "dist/index.js"]