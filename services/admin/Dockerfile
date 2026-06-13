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
COPY --from=builder /app/services/admin/dist ./dist
COPY --from=builder /app/services/admin/package.json ./
COPY --from=builder /app/services/shared/dist ./node_modules/@ordersync/shared/dist
COPY --from=builder /app/services/shared/package.json ./node_modules/@ordersync/shared/
RUN npm install --only=production
EXPOSE 5006
CMD ["node", "dist/index.js"]