FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/admin ./services/admin
RUN npm install --workspace=services/shared --workspace=services/admin
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/admin

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/admin/dist ./services/admin/dist
COPY --from=builder /app/services/admin/package.json ./services/admin/package.json
RUN npm install --workspace=services/shared --workspace=services/admin --omit=dev
WORKDIR /app/services/admin
EXPOSE 5006
CMD ["node", "dist/index.js"]