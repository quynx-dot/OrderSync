# OrderSync

Food delivery platform built with microservices. Six independent Node.js services talk to each other over REST and RabbitMQ, with Socket.io for real-time updates. Customers order food, restaurants manage orders, riders deliver them.

**Live:** https://ordersync.vercel.app

---

## What it does

**Customers** — browse nearby restaurants (geolocation-based), add to cart, pay via Razorpay or Stripe, track the rider on a live map.

**Restaurant owners** — manage their menu, get notified of new orders in real-time (with sound), push orders through the kitchen pipeline.

**Riders** — go online, get notified when an order is ready nearby, accept it within 10 seconds, and navigate to the delivery address with live routing.

**Admins** — verify new restaurants and riders before they go live.

---

## Stack

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB with geospatial indexes |
| Realtime | Socket.io |
| Queues | RabbitMQ |
| Payments | Razorpay + Stripe |
| Storage | Cloudinary |
| Infra | Render (services), Vercel (frontend), AWS EC2 (RabbitMQ) |

---

## Architecture

Six services, each with its own responsibility:

```
auth        →  Google OAuth, JWT
restaurant  →  restaurants, menus, cart, orders
utils       →  payments (Razorpay/Stripe), image uploads
realtime    →  Socket.io hub
rider       →  rider profiles, location, delivery
admin       →  verification
shared      →  common middleware, types, schemas (npm workspace package)
```

Services communicate over HTTP for synchronous calls and RabbitMQ for async events:

- `utils` publishes to `payment_queue` after payment succeeds
- `restaurant` consumes it, marks order as placed, clears cart, notifies restaurant
- `restaurant` publishes to `order_ready_queue` when food is ready
- `rider` consumes it, finds nearby riders with `$near`, notifies them via Socket.io

---

## Order flow

```
add to cart → checkout → pending order created
    → pay (Razorpay/Stripe)
    → payment_queue message
    → order marked "placed", cart cleared
    → restaurant notified (Socket.io)

restaurant: placed → accepted → preparing → ready_for_rider
    → order_ready_queue message
    → nearby riders notified (500m radius)

rider accepts within 10s
    → rider_assigned → picked_up → delivered
    → rider availability reset
```

---

## A few things worth noting

**Idempotent payment handling** — the payment consumer checks `paymentStatus !== "paid"` before updating, so duplicate RabbitMQ messages don't double-process.

**Atomic rider assignment** — uses `findOneAndUpdate` with `{ riderId: null }` as the filter condition, so two riders accepting simultaneously can't both get assigned the same order.

**Cart isolation** — adding an item from a different restaurant is blocked at the API level, not just the UI.

**JWT carries restaurantId** — when a seller first fetches their restaurant, the service signs a new token that includes `restaurantId`. This lets Socket.io join the correct room without an extra DB lookup on every connection.

**Geospatial queries** — restaurants use MongoDB's `$geoNear` aggregation with a 5km radius. Riders use `$near` with a 500m radius. Both indexed with `2dsphere`.

---

## Running locally

You need Node.js 22+, MongoDB, and RabbitMQ running.

```bash
git clone https://github.com/quynx-dot/OrderSync
cd OrderSync

npm run build:shared   # shared package must be built first
npm install

# copy env files
for svc in auth restaurant utils realtime rider admin; do
  cp services/$svc/.env.example services/$svc/.env
done
```

Fill in the `.env` files, then run each service in a separate terminal:

```bash
npm run dev:auth
npm run dev:restaurant
npm run dev:utils
npm run dev:realtime
npm run dev:rider
npm run dev:admin

cd frontend && npm run dev
```

---

## Deployment

**Services → Render (Docker)**

Each service has a Dockerfile. The build context must be the repo root (`.`) because the Dockerfiles copy from `services/shared` which lives at the root level. Setting the context to the service folder breaks the build.

```
Runtime:          Docker
Dockerfile path:  ./services/<name>/Dockerfile
Docker context:   .   ← important
```

Deploy order matters: `auth` → `utils` → `realtime` → `restaurant` → `rider` → `admin`. Each service needs the URLs of the services it depends on as env vars.

**RabbitMQ → AWS EC2**

Running in a Docker container on a t3.micro. Ports 5672 (AMQP) and 15672 (management UI) open in the security group.

```bash
docker run -d --hostname rabbitmq --name rabbitmq --restart always \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=<password> \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management
```

**Frontend → Vercel**

Root directory set to `frontend`. Vite auto-detected. `vercel.json` has a catch-all rewrite to `index.html` for client-side routing.

---

## Environment variables

Three secrets must be identical across all services that use them:

```
JWT_SEC                — openssl rand -hex 64
INTERNAL_SERVICE_KEY   — openssl rand -hex 32  (service-to-service auth)
INTERNAL_SECRET        — openssl rand -hex 32  (upload endpoint)
```

External services needed: MongoDB Atlas, Google OAuth, Cloudinary, Razorpay, Stripe.

---

## Project structure

```
ordersync/
├── services/
│   ├── shared/       # @ordersync/shared — auth middleware, schemas, TryCatch
│   ├── auth/
│   ├── restaurant/
│   ├── utils/
│   ├── realtime/
│   ├── rider/
│   └── admin/
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/   # AppContext, SocketContext
│       ├── pages/
│       └── types.ts
└── package.json       # npm workspaces root
```

---

