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
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/auth/dist ./services/auth/dist
COPY --from=builder /app/services/auth/package.json ./services/auth/package.json
RUN npm install --workspace=services/shared --workspace=services/auth --omit=dev
WORKDIR /app/services/auth
EXPOSE 5000
CMD ["node", "dist/index.js"]