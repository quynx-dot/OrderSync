FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/restaurant ./services/restaurant
RUN npm install --workspace=services/shared --workspace=services/restaurant
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/restaurant

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/restaurant/dist ./services/restaurant/dist
COPY --from=builder /app/services/restaurant/package.json ./services/restaurant/package.json
RUN npm install --workspace=services/shared --workspace=services/restaurant --omit=dev
WORKDIR /app/services/restaurant
EXPOSE 5001
CMD ["node", "dist/index.js"]