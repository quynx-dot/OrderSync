FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/rider ./services/rider
RUN npm install --workspace=services/shared --workspace=services/rider
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/rider

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/rider/dist ./services/rider/dist
COPY --from=builder /app/services/rider/package.json ./services/rider/package.json
RUN npm install --workspace=services/shared --workspace=services/rider --omit=dev
WORKDIR /app/services/rider
EXPOSE 5005
CMD ["node", "dist/index.js"]