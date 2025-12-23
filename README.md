# 🧾 Maajod (แม่จด)

A simple income & expense tracking web app for small shops.  
Designed for elderly users with large buttons and easy-to-read text.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

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
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/maajod?retryWrites=true&w=majority
```

### 3. Run Development

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions?startDate=&endDate=` | Get by date range |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/summary/daily?date=` | Daily summary |
| GET | `/api/summary/monthly?year=&month=` | Monthly summary |

---

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Icons:** Lucide React

---

## 📝 License

MIT
