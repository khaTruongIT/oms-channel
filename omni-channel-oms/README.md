# Omni-Channel Order Management System (OMS)

A production-ready, multi-tenant SaaS Order Management System that unifies inventory and orders across multiple e-commerce platforms (Shopee, TikTok, Lazada).

## 🚀 Features

- **Multi-Tenant SaaS**: Schema-per-tenant isolation for complete data security
- **Master SKU System**: Centralized product catalog with variant support
- **Real-time Inventory**: Automatic stock deduction across all channels
- **Unified Order Dashboard**: Single view for orders from all marketplaces
- **RBAC**: Role-based access control (Owner, Warehouse Manager, Sales Staff)
- **Batch Stock Sync**: 5-minute synchronization cycle using RabbitMQ
- **Audit Logging**: Complete history of all critical operations
- **Mock Marketplace Integration**: Shopee, TikTok, Lazada simulators

## 🏗️ Tech Stack

- **Backend**: NestJS + TypeScript
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 15 + TypeORM
- **Message Queue**: RabbitMQ
- **Job Scheduler**: BullMQ (Redis)
- **Authentication**: JWT + Passport
- **Deployment**: Docker Compose

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd omni-channel-oms
```

### 2. Set up environment variables

```bash
# Root directory
cp .env.example .env

# Backend
cd backend
cp .env.example .env
cd ..

# Frontend
cd frontend
cp .env.example .env
cd ..
```

### 3. Start services with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, RabbitMQ, Backend, Frontend)
docker-compose up -d

# Or for development without Docker:
# Start PostgreSQL, Redis, RabbitMQ only
docker-compose up -d postgres redis rabbitmq
```

### 4. Install dependencies (if not using Docker)

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 5. Run database migrations

```bash
cd backend
npm run migration:run
```

### 6. Start development servers (if not using Docker)

```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **RabbitMQ Management**: http://localhost:15672 (user: oms_user, pass: oms_password)

## 📁 Project Structure

```
omni-channel-oms/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication & RBAC
│   │   ├── tenants/        # Multi-tenant management
│   │   ├── products/       # Master SKU management
│   │   ├── inventory/      # Stock tracking
│   │   ├── orders/         # Order management
│   │   ├── integrations/   # Marketplace integrations
│   │   ├── sync/           # Stock synchronization
│   │   ├── audit/          # Audit logging
│   │   └── database/       # TypeORM entities & migrations
│   └── test/
├── frontend/                # Next.js 14 App
│   ├── app/
│   │   ├── (auth)/         # Login/Register
│   │   └── (dashboard)/    # Main dashboard
│   └── components/
├── docker-compose.yml
└── .env.example
```

## 🔧 Development

### Generate TypeORM Migration

```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
```

### Run Migrations

```bash
cd backend
npm run migration:run
```

### Revert Last Migration

```bash
cd backend
npm run migration:revert
```

### Run Tests

```bash
# Backend unit tests
cd backend
npm run test

# Backend E2E tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 🎯 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile

### Tenants

- `POST /tenants` - Create new tenant (shop)
- `GET /tenants` - Get user's tenants

### Products (Master SKU)

- `GET /products` - List all products
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product (soft delete)

### Inventory

- `GET /inventory` - Get inventory levels
- `POST /inventory/adjust` - Manual stock adjustment
- `GET /inventory/audit` - Get audit logs

### Orders

- `GET /orders` - List orders (with filters)
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status

### Webhooks (Mock)

- `POST /webhooks/shopee/order-created` - Simulate Shopee order
- `POST /webhooks/tiktok/order-created` - Simulate TikTok order
- `POST /webhooks/lazada/order-created` - Simulate Lazada order

## 🔐 Environment Variables

See `.env.example` files in root, backend, and frontend directories for all available configuration options.

Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `REDIS_URL`: Redis connection string
- `RABBITMQ_URL`: RabbitMQ connection string

## 📊 Database Schema

### Public Schema (Shared)

- `users` - User accounts
- `tenants` - Shop/tenant records
- `user_tenant_roles` - RBAC mappings

### Tenant Schema (Per Shop)

- `master_skus` - Product catalog
- `inventory` - Stock levels
- `channel_mappings` - Marketplace product mappings
- `orders` - Order records
- `order_items` - Order line items
- `audit_logs` - Activity history
- `warehouses` - Warehouse locations

## 🚢 Deployment

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### Docker Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

The project includes:

- Unit tests for services
- E2E tests for API endpoints
- Frontend component tests with Playwright

Run all tests:

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

## 📝 License

UNLICENSED - Private project

## 👥 Contributors

- Your Name <your.email@example.com>

## 🤝 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ using NestJS, Next.js, and TypeORM**
