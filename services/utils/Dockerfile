FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/utils ./services/utils
RUN npm install --workspace=services/shared --workspace=services/utils
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/utils

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/SERVICE_NAME/dist ./dist
COPY --from=builder /app/services/SERVICE_NAME/package.json ./
COPY --from=builder /app/services/shared ./node_modules/@ordersync/shared
RUN npm install --only=production
EXPOSE 5002
CMD ["node", "dist/index.js"]