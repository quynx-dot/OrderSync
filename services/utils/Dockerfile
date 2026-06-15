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
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/utils/dist ./services/utils/dist
COPY --from=builder /app/services/utils/package.json ./services/utils/package.json
RUN npm install --workspace=services/shared --workspace=services/utils --omit=dev
WORKDIR /app/services/utils
EXPOSE 5002
CMD ["node", "dist/index.js"]