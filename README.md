# OrderSync 🚀

A production-ready, full-stack food delivery platform built with a **microservices architecture**. Customers browse nearby restaurants, place orders, and track delivery in real-time. Restaurant owners manage menus and live orders. Riders receive delivery requests and navigate with a live map.

🌐 **Live Demo**: [ordersync-green.vercel.app](https://ordersync-green.vercel.app/)

---

## ✨ Features

### Customer
- 🔐 One-click Google OAuth login
- 📍 Auto-detects location to show nearby restaurants
- 🔍 Search restaurants by name
- 🛒 Cart with multi-item ordering (single restaurant at a time)
- 💳 Dual payment gateway — Razorpay & Stripe
- 📦 Real-time order status updates via WebSocket
- 🗺️ Live rider location on map during delivery
- 📜 Full order history

### Restaurant Owner (Seller)
- 🏪 Create and manage restaurant profile with image upload
- 🍽️ Add / remove menu items with images and availability toggle
- 🔔 Real-time new order notifications with sound alerts
- 📋 Live order management dashboard (Accept → Prepare → Ready)
- 📊 Sales dashboard — revenue, order counts, average order value

### Rider
- 🛵 Create rider profile (Aadhar, DL verification)
- 📡 Go online/offline with live location
- ⏱️ 10-second order acceptance window
- 🗺️ Turn-by-turn routing to delivery address
- 📞 One-tap customer call

### Admin
- ✅ Verify pending restaurants and riders
- 🔒 Role-based access control

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Maps** | Leaflet, React-Leaflet, OSRM routing |
| **Real-time** | Socket.io (client + server) |
| **Auth** | Google OAuth 2.0, JWT |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | MongoDB (Mongoose) + geospatial indexes |
| **Message Queue** | RabbitMQ (amqplib) |
| **Payments** | Razorpay, Stripe |
| **Image Storage** | Cloudinary |
| **Containerization** | Docker, multi-stage builds |
| **Deployment** | Render (backend), Vercel (frontend), AWS EC2 (RabbitMQ) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              React SPA (Vercel)                     │
└──────────────────┬──────────────────────────────────┘
                   │  REST + WebSocket
   ┌───────────────┼──────────────────────────────┐
   │               │                              │
   ▼               ▼                              ▼
┌──────┐  ┌──────────────┐  ┌────────┐  ┌──────┐  ┌───────┐
│ Auth │  │ Restaurant   │  │ Utils  │  │Real- │  │ Rider │
│:5000 │  │    :5001     │  │ :5002  │  │time  │  │ :5005 │
└──────┘  └──────┬───────┘  └───┬────┘  │:5004 │  └───┬───┘
                 │               │       └──────┘      │
                 └───────────────┼─────────────────────┘
                                 │  RabbitMQ (AWS EC2)
                          ┌──────▼──────┐
                          │  Admin:5006 │
                          └─────────────┘
                                 │
                     ┌───────────┼───────────┐
                     ▼           ▼           ▼
                  MongoDB    RabbitMQ    Cloudinary
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| `auth` | 5000 | Google OAuth login, JWT issuance, role assignment |
| `restaurant` | 5001 | Restaurants, menus, cart, orders, addresses |
| `utils` | 5002 | Cloudinary uploads, Razorpay & Stripe payments |
| `realtime` | 5004 | Socket.io hub — order updates, rider location |
| `rider` | 5005 | Rider profiles, order acceptance, location tracking |
| `admin` | 5006 | Verify restaurants and riders |
| `shared` | — | Shared TypeScript types, middleware, Zod schemas |

### Message Queues

| Queue | Producer | Consumer | Purpose |
|---|---|---|---|
| `payment_queue` | utils | restaurant | Confirm payment → place order |
| `order_ready_queue` | restaurant | rider | Notify nearby riders when order is ready |

---

## 🔄 Order Lifecycle

```
Cart → Checkout → [pending] ──payment──► placed
                                            │
                              Restaurant accepts ▼
                                         accepted
                                            │
                                        preparing
                                            │
                               ready_for_rider ──RabbitMQ──► riders notified
                                            │
                                  rider accepts ▼
                                      rider_assigned
                                            │
                                        picked_up
                                            │
                                        delivered ✓
```

---

## 🔐 Security Patterns

- **JWT Authentication** — all user-facing routes protected, 15-day expiry
- **Internal Service Auth** — service-to-service calls use `x-internal-key` header
- **Role Guards** — `isSeller`, `isRider`, `isAdmin` middleware
- **Rate Limiting** — 10 req/15min for orders/payments, 100-150 for browsing
- **Idempotent Payments** — duplicate payment events are safely ignored
- **Race Condition Protection** — rider assignment uses atomic `findOneAndUpdate` with `riderId: null` check
- **Privilege Escalation Prevention** — role cannot be changed after initial assignment

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 22+
- MongoDB running locally
- RabbitMQ running locally (`rabbitmq-server` or Docker)

### 1. Clone & Install

```bash
git clone https://github.com/quynx-dot/OrderSync.git
cd OrderSync

# Build shared package first — other services depend on it
npm run build:shared

# Install all workspace dependencies
npm install
```

### 2. Environment Variables

Each service has a `.env.example`. Copy to `.env` for each:

```bash
for svc in auth restaurant utils realtime rider admin; do
  cp services/$svc/.env.example services/$svc/.env
done
cp frontend/.env.example frontend/.env.local
```

Fill in required values — see [Configuration](#configuration) below.

### 3. Run Services

Open a terminal per service (or use tmux):

```bash
npm run dev:auth
npm run dev:restaurant
npm run dev:utils
npm run dev:realtime
npm run dev:rider
npm run dev:admin

# Frontend
cd frontend && npm run dev
```

---

## ⚙️ Configuration

### Required Secrets (shared across services)

| Variable | How to generate | Used in |
|---|---|---|
| `JWT_SEC` | `openssl rand -hex 64` | auth, restaurant, realtime, rider, admin |
| `INTERNAL_SERVICE_KEY` | `openssl rand -hex 32` | all services |
| `INTERNAL_SECRET` | `openssl rand -hex 32` | restaurant, utils, rider |

> ⚠️ All three must be **identical** across every service that lists them.

### External Services Required

| Service | Purpose | Free Tier |
|---|---|---|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | M0 — 512 MB |
| [Google Console](https://console.cloud.google.com) | OAuth 2.0 | Free |
| [Cloudinary](https://cloudinary.com) | Image storage | 25 GB bandwidth |
| [Razorpay](https://razorpay.com) | Payments (India) | Test mode free |
| [Stripe](https://stripe.com) | Payments (Global) | Test mode free |

---

## 🐳 Docker Deployment

Each service has its own multi-stage Dockerfile. The build uses npm workspaces to correctly resolve the shared package:

```bash
# Build a single service
docker build -f services/auth/Dockerfile -t ordersync-auth .

# Context must be repo root (.) — shared package is copied from root level
```

**Key Dockerfile pattern:**
```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY services/shared ./services/shared
COPY services/auth ./services/auth
RUN npm install --workspace=services/shared --workspace=services/auth
RUN npm run build --workspace=services/shared
RUN npm run build --workspace=services/auth

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY --from=builder /app/services/shared ./services/shared
COPY --from=builder /app/services/auth/dist ./services/auth/dist
COPY --from=builder /app/services/auth/package.json ./services/auth/package.json
RUN npm install --workspace=services/shared --workspace=services/auth --omit=dev
WORKDIR /app/services/auth
CMD ["node", "dist/index.js"]
```

---

## ☁️ Production Deployment

### Backend → Render

1. Push repo to GitHub
2. Create a **Web Service** on Render for each of the 6 services
3. Set **Runtime: Docker**, **Dockerfile Path**: `./services/<name>/Dockerfile`
4. Set **Docker Context** to `.` (repo root) — critical for shared package
5. Add all environment variables in the Render dashboard
6. Deploy in order: `auth` → `utils` → `realtime` → `restaurant` → `rider` → `admin`

### RabbitMQ → AWS EC2

```bash
# On EC2 (Ubuntu 22.04, t3.micro)
sudo apt-get update -y && sudo apt-get install docker.io -y
sudo systemctl enable docker && sudo systemctl start docker

docker run -d \
  --hostname rabbitmq-host \
  --name rabbitmq \
  --restart always \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=yourpassword \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

Set EC2 Security Group inbound rules: port `5672` (0.0.0.0/0), port `15672` (your IP).

### Frontend → Vercel

1. Import GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory**: `frontend`
3. Add all `VITE_` environment variables
4. Deploy

Add your Vercel URL to Google OAuth **Authorized JavaScript Origins**.

---

## 📁 Project Structure

```
ordersync/
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # AppContext, SocketContext
│   │   ├── pages/             # Route-level page components
│   │   ├── types.ts           # Shared TypeScript types
│   │   └── utils/             # Order flow helpers
│   └── vercel.json
│
├── services/
│   ├── shared/                # @ordersync/shared package
│   │   └── src/
│   │       ├── isAuth.ts      # JWT + internal auth middleware
│   │       ├── schemas.ts     # Zod validation schemas
│   │       ├── rateLimiter.ts
│   │       └── TryCatch.ts
│   │
│   ├── auth/                  # Authentication service
│   ├── restaurant/            # Core restaurant + order service
│   ├── utils/                 # Payments + image uploads
│   ├── realtime/              # Socket.io hub
│   ├── rider/                 # Rider management
│   └── admin/                 # Admin verification
│
├── .dockerignore
├── package.json               # npm workspaces root
└── README.md
```

---

## 🧠 Key Engineering Decisions

### Why Microservices?
Each service owns a distinct domain and can be scaled, deployed, and debugged independently. The rider service going down doesn't affect payments.

### Why RabbitMQ over direct HTTP?
Payment confirmation is decoupled from order creation. If the restaurant service restarts mid-payment, the message stays in the queue and gets processed on recovery — no lost orders.

### Why MongoDB?
The `$geoNear` aggregation pipeline and `2dsphere` indexes make proximity queries (find restaurants within 5km, find riders within 500m) simple and fast.

### Why Socket.io over polling?
Pushing events (new order, status update, rider location) is far more efficient than having clients poll every few seconds — critical for live order tracking.

### Idempotent Payment Processing
```ts
// Only update if not already paid — handles duplicate RabbitMQ messages
const order = await Order.findOneAndUpdate(
  { _id: orderId, paymentStatus: { $ne: "paid" } },
  { $set: { paymentStatus: "paid", status: "placed" } },
  { new: true }
);
```

### Atomic Rider Assignment
```ts
// Race condition: two riders accept at the same millisecond
// Only one wins — the other gets "Order already taken"
const order = await Order.findOneAndUpdate(
  { _id: orderId, riderId: null },  // atomic check-and-set
  { riderId, status: "rider_assigned" },
  { new: true }
);
```

---

## 👤 User Roles

| Role | Access |
|---|---|
| `customer` | Browse restaurants, cart, orders, live tracking |
| `seller` | Manage restaurant, menu, live orders, sales |
| `rider` | Profile, go online, accept deliveries, update status |
| `admin` | Verify pending restaurants and riders |

---


