# Shop API

REST API for a small online shop. Built with **Node.js, Express, TypeScript, PostgreSQL, JWT and Zod**.

## Database

Designed from the ER diagram: `users`, `products`, `orders`, `order_items`.
Also added: `categories` (products belong to a category) and `refresh_tokens` (created in the migration, not used by the API yet).

- `users` 1 - many `orders`, `orders` 1 - many `order_items`, `products` 1 - many `order_items`
- `users.role` is an enum: `customer` or `admin` (role-based access)
- `order_items.unit_price` stores the price at the time of purchase
- `order_items.subtotal` is calculated by the database (`quantity * unit_price`)

## Setup (local PostgreSQL)

The API connects to the PostgreSQL server **installed on your computer** (there is no Postgres container).

1. Create the database in your local PostgreSQL (pgAdmin or psql): `CREATE DATABASE shop_db;`
2. Copy `.env.example` to `.env` and fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and `JWT_SECRET`
3. Run:
   ```
   npm install
   npm run migrate     # creates the tables (once, on a fresh database)
   npm run seed        # sample users, categories, products
   npm run dev
   ```
   On start the console prints `Connected to local PostgreSQL: ...` if the connection works.

Seed logins: `admin@example.com` / `Admin@12345` and `customer@example.com` / `Customer@12345`

### Running with Docker (Kafka + API container)

`docker compose up --build` starts Kafka and the API. The API container reaches your local PostgreSQL through
`host.docker.internal`, so your local PostgreSQL must accept connections from Docker:

- `postgresql.conf`: `listen_addresses = '*'`
- `pg_hba.conf`: add `host  all  all  172.16.0.0/12  scram-sha-256` (Docker's network range), then restart PostgreSQL

Run the migrations from a container with `docker compose --profile tools run --rm tools` (or just `npm run migrate` on your computer).

## Tests and CI

```
npm run test:unit       # 27 unit tests (fake database and Kafka, nothing real is touched)
npm run test:db:up      # starts REAL Postgres + Kafka containers (docker-compose.test.yml)
npm run test:integration # 23 integration tests against those real containers
npm run test:coverage   # all 50 tests + coverage report (fails below 95%)
npm run test:db:down    # stops and removes the test containers
npm run typecheck
```

`.github/workflows/ci-cd.yml` runs on every push / pull request to `main`: typecheck, build and tests, then the SQL migrations
and seed on a throwaway PostgreSQL, then the Docker image build (published to ghcr.io on `main`), then an optional deploy hook.

## Endpoints

| Method | URL | Who | What it does |
|--------|-----|-----|--------------|
| POST | /api/auth/register | public | create an account (always a customer) |
| POST | /api/auth/login | public | get a JWT token |
| GET | /api/products | public | list products (`?page=&limit=&search=`) |
| GET | /api/products/:id | public | one product |
| POST | /api/products | admin | add a product |
| POST | /api/orders | logged in | place an order |
| GET | /api/orders | logged in | my orders (`?page=&limit=`) |
| GET | /api/orders/:id | owner or admin | one order with items |
| GET | /api/orders/admin/all | admin | all orders of all users |
| PATCH | /api/orders/:id/status | admin | change order status |

Send the token as `Authorization: Bearer <token>`.
Lists return `{ data, page, limit, total, totalPages }`.

## Security

- **JWT** login, passwords hashed with **bcrypt**
- **Role-based access**: `authenticate` checks the token, `adminOnly` checks the role
- **Zod** validation for body, query and `:id`
- **helmet** (security headers), **cors** (only `CORS_ORIGIN`), **rate limiting** (100 requests / 15 min, and 10 / 15 min for login and register)
- All SQL uses `$1, $2` placeholders (no SQL injection)

Not done yet: refresh tokens, logging.

## Folder structure

```
db/migrations, db/seeds   SQL files
scripts/                  migrate.ts, seed.ts
tests/                    unit/ (fakes) and integration/ (real Postgres + Kafka containers)
.github/workflows/        ci-cd.yml (CI + Docker image + deploy)
src/
  index.ts                starts the server
  app.ts                  express setup (helmet, cors, rate limit, routes, errors)
  config/env.ts           settings from .env
  db/pool.ts              connection to the local PostgreSQL
  schemas/                Zod rules (auth, product, order, common)
  middleware/             validate, authenticate, authorize, rateLimiter, errorHandler
  routes/                 url -> middleware -> controller
  controllers/            read the request, call a service, send the response
  services/               the logic and SQL queries
  utils/                  HttpError, pagination helpers
  types/                  req.user type
```

Request flow: `route -> middleware (token, role, validation) -> controller -> service -> database`
