# 🧾 Maajod (แม่จด)

A simple income & expense tracking web app for small shops.  
Designed for elderly users with large buttons and easy-to-read text.

## ✨ Features

- **Multi-Store Support**: One user can access multiple stores
- **User Management**: Multiple users can collaborate on the same store
- **Role-based Access**: Owner, Admin, Member roles per store
- **Simple UI**: Large buttons, easy-to-read text for elderly users

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)

### 1. Clone & Install

```bash
# API
cd api
npm install

# Web
cd ../web
npm install
```

### 2. Setup Environment

Create `api/.env`:

```env
PORT=3001

# JWT Secret
JWT_SECRET=your-secret-key

# MongoDB (runtime database)
MONGODB_URI=mongodb://localhost:27017/maajod
```

Tip: copy from `api/.env.example` and fill values.

### 3. Database Setup

#### Option A: Fresh Start (MongoDB)
Start API with `MONGODB_URI` configured. Collections and indexes are managed by Mongoose models.

#### Option B: Restore existing MongoDB data
Import data from your MongoDB backup/Atlas snapshot using your preferred MongoDB tooling.

### 4. Run Development

```bash
# Terminal 1 - API
cd api
npm run dev
# Runs at http://localhost:3001

# Terminal 2 - Web
cd web
npm run dev
# Runs at http://localhost:3000
```

---

## 📱 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns user + stores) |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user + stores |

### Store Management (requires auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stores` | Create new store |
| GET | `/api/stores` | Get user's stores |
| GET | `/api/stores/:id` | Get store by ID |
| PUT | `/api/stores/:id` | Update store |
| POST | `/api/stores/:id/users` | Add user to store |
| DELETE | `/api/stores/:id/users/:userId` | Remove user from store |
| GET | `/api/stores/:id/users` | Get users in store |
| PUT | `/api/stores/:id/default` | Set default store |

### Transactions (requires auth + store)

> **Note**: All transaction endpoints require `x-store-id` header or `storeId` query param. If not provided, the API will use the user's default store automatically.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions?startDate=&endDate=` | Get by date range |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/summary/daily?date=` | Daily summary |
| GET | `/api/summary/monthly?year=&month=` | Monthly summary |

### Example: Creating a Transaction

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-store-id: STORE_ID" \
  -H "Content-Type: application/json" \
  -d '{"type":"income","amount":1000,"note":"ขายข้าว"}'
```

---

## 🏗 Architecture

### Multi-Tenant Model

```
User ←→ UserStore ←→ Store
              ↓
         Transaction
```

- **User**: Login credentials, profile
- **Store**: Shop/business entity
- **UserStore**: Many-to-many relationship with roles (owner/admin/member)
- **Transaction**: Belongs to one store

### Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access, can delete store, manage all users |
| `admin` | Can add/remove users, edit store, manage transactions |
| `member` | Can view and create transactions |

---

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB (Atlas/local)
- **Data Access:** Mongoose
- **Icons:** Lucide React

---

## 📝 License

MIT
