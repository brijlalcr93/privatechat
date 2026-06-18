# PrivateChat - Premium Apple-Inspired Messaging Application

PrivateChat is a production-ready real-time messaging application designed for small private groups (3-10 users). It features a sleek dark-and-light layout inspired by Apple.com's aesthetic guidelines (including glassmorphism, SF-inspired font styling, responsive layout grids, and animations).

## Tech Stack
* **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, TypeScript
* **Backend**: Node.js, Express, Socket.IO, TypeScript, JWT, bcryptjs
* **Database**: MongoDB & Mongoose

---

## Directory Structure
```
privatechat/
├── backend/                  # REST APIs & Socket.IO server
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── middleware/       # JWT auth & suspension middleware
│   │   ├── models/           # Mongoose schemas (User, Chat, Message, Admin, Log)
│   │   ├── routes/           # Auth, Users, Chats, and Admin APIs
│   │   ├── socket/           # Real-time message events router
│   │   ├── seed.ts           # DB seeding script
│   │   └── server.ts         # Server entrypoint
│   └── package.json
├── frontend/                 # Next.js web application
│   ├── src/
│   │   ├── app/              # Views (Landing, Login, Register, Profile, Admin, Dashboard)
│   │   ├── components/       # Reusable components (Navbar, GlassCard, CreateGroupModal)
│   │   ├── context/          # React contexts (AuthContext, SocketContext)
│   │   └── utils/            # Axios/Fetch api wrappers
│   └── package.json
└── README.md
```

---

## Setup & Installation

### Prerequisite
* Make sure you have **Node.js (v18+)** installed.
* Make sure you have a running **MongoDB** instance (locally at `mongodb://127.0.0.1:27017/privatechat` or via a MongoDB Atlas cloud URI).

---

### Step 1: Set Up and Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Verify dependencies are installed (they are already pre-installed in the workspace, but you can run):
   ```bash
   npm install
   ```
3. Look at/configure `.env` (pre-created with default variables):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/privatechat
   JWT_SECRET=supersecretjwtkeyforprivatechat123!
   ADMIN_JWT_SECRET=adminsecretjwtkeyforprivatechat987!
   ```
4. **Seed the database** (Highly recommended to populate statistics graphs, direct and group conversations, and audit logs immediately):
   ```bash
   npm run seed
   ```
5. Launch the server in development mode:
   ```bash
   npm run dev
   ```
   *The API and Socket server will listen on `http://localhost:5000`.*

---

### Step 2: Set Up and Run the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Verify dependencies are installed:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The application will boot at `http://localhost:3000`.*

---

## Deploy on Vercel, Render, and MongoDB Atlas

This repository contains a Next.js frontend in `frontend/` and a separate backend in `backend/`. For production-ready deployment, use:

- Frontend: Vercel
- Backend: Render (Web Service)
- Database: MongoDB Atlas

### Backend: Render

1. Push this repository to your Git provider.
2. In Render, create a new **Web Service**.
3. Set the root directory to `backend`.
4. Use these commands:
   - Build command: `npm ci && npm run build`
   - Start command: `npm run start`
5. Add environment variables in Render:
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — JWT signing secret
   - `ADMIN_JWT_SECRET` — admin JWT signing secret
   - `PORT` — optional, defaults to `5000`

### Frontend: Vercel

1. In Vercel, create a new project and connect the repo.
2. Set `frontend` as the root directory when configuring the project.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_API_URL` = `https://<your-backend-domain>/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://<your-backend-domain>`
4. Deploy the app.

### Database: MongoDB Atlas

1. Create a free Atlas cluster.
2. Add an IP access list entry (for quick testing, `0.0.0.0/0` is allowed, but lock this down in production).
3. Create a database user and copy the connection string.
4. Set `MONGO_URI` in Render using the Atlas connection string.

---

## Default Seeding Accounts
Use these pre-populated credentials after running `npm run seed`:

| Username | Role | Password | Description |
| :--- | :--- | :--- | :--- |
| **admin** | Super Admin | `admin123` | System Admin Portal Login |
| **Alice** | User & Admin | `password123` | General User & Group Creator |
| **Bob** | User | `password123` | General User |
| **Charlie** | User | `password123` | General User |
| **David** | User (Suspended) | `password123` | Inactive/suspended user to test admin locks |

---

## Key Features

1. **Real-time Engine (Socket.IO)**: Track user online/offline status, broadcast writing changes via typing indicators, synchronize seen read-receipt checkmarks, and send immediate direct/group messages.
2. **Apple.com Glassmorphism Style**: Premium translucent surfaces using `backdrop-filter`, dark mode support, and micro-interactions.
3. **Reactive Suspension**: When an admin suspends a user in the control panel, a Socket.IO kick event is emitted to force-disconnect their active socket and redirect them to the login screen.
4. **Detailed Audit Trail**: Every significant action (registration, logins, channel creation, suspension overrides) writes a log event visible in the admin activity feed.
