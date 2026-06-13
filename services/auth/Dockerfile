FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/auth ./services/auth
RUN npm install --workspace=services/shared --workspace=services/auth
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/auth

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/services/auth/dist ./dist
COPY --from=builder /app/services/auth/package.json ./
COPY --from=builder /app/services/shared/dist ./node_modules/@ordersync/shared/dist
COPY --from=builder /app/services/shared/package.json ./node_modules/@ordersync/shared/
RUN npm install --only=production
EXPOSE 5000
CMD ["node", "dist/index.js"]