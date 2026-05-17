# 🏟️ GoTurf – Smart Turf Booking & Management System

A full-stack sports turf booking platform with dynamic pricing, real-time chat, team management, and an admin analytics dashboard.

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
|------------|------------------------------------------------|
| Frontend   | React 18 + Vite + TailwindCSS + Recharts       |
| Backend    | Node.js + Express.js + Socket.IO               |
| Database   | MongoDB + Mongoose ODM                         |
| Auth       | JWT (JSON Web Tokens) + bcryptjs               |
| Real-time  | Socket.IO (WebSockets)                         |
| Styling    | TailwindCSS v4 + Radix UI + Motion             |

---

## 📁 Project Structure

```
goturf/
├── frontend/                    # React app (from Figma design)
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/           # All 8 screen pages
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   ├── TurfListingPage.tsx
│   │   │   │   ├── SlotSelectionPage.tsx
│   │   │   │   ├── TeamRegistrationPage.tsx
│   │   │   │   ├── ChatRoomPage.tsx
│   │   │   │   ├── InvitePage.tsx
│   │   │   │   └── AdminDashboardPage.tsx
│   │   │   ├── components/
│   │   │   │   └── ui/          # Radix UI components (shadcn)
│   │   │   ├── services/
│   │   │   │   └── api.js       # API service layer
│   │   │   ├── context/
│   │   │   │   └── AuthContext.jsx  # Global auth state
│   │   │   ├── App.tsx
│   │   │   └── routes.tsx
│   │   └── styles/
│   ├── .env
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js          # MongoDB User schema
│   │   │   ├── Turf.js          # Turf + slots schema
│   │   │   ├── Booking.js       # Booking with pricing
│   │   │   ├── Team.js          # Team + member invites
│   │   │   └── Message.js       # Chat messages
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── turfController.js
│   │   │   ├── bookingController.js
│   │   │   └── teamController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── turfs.js
│   │   │   ├── bookings.js
│   │   │   ├── teams.js
│   │   │   └── chat.js
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT middleware
│   │   ├── utils/
│   │   │   └── seed.js          # DB seeder
│   │   └── index.js             # Server entry point
│   ├── .env
│   └── package.json
│
└── docker-compose.yml           # One-command startup
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone / extract the project
cd goturf

# Start everything
docker-compose up -d

# Seed the database with sample data
docker exec goturf-backend node src/utils/seed.js
```

Visit:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

### Option 2: Manual Setup

#### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

#### 1. Backend Setup
```bash
cd backend
npm install

# Copy and configure env
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start dev server
npm run dev

# Seed database (optional but recommended)
npm run seed
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Copy env
cp .env.example .env

# Start dev server
npm run dev
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Turfs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/turfs` | List turfs (with filters) |
| GET | `/api/turfs/:id` | Get turf details |
| GET | `/api/turfs/:id/slots?date=` | Get available slots |
| POST | `/api/turfs` | Create turf (owner/admin) |
| PUT | `/api/turfs/:id` | Update turf |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | User's bookings |
| GET | `/api/bookings/:id` | Get booking details |
| PUT | `/api/bookings/:id/confirm` | Confirm + pay |
| DELETE | `/api/bookings/:id` | Cancel booking |
| GET | `/api/bookings/admin/all` | All bookings (admin) |
| GET | `/api/bookings/admin/stats` | Revenue analytics (admin) |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/teams` | Create team |
| GET | `/api/teams/:id` | Get team |
| GET | `/api/teams/invite/:code` | Get by invite code |
| POST | `/api/teams/:id/invite` | Invite member |
| PUT | `/api/teams/:id/respond` | Accept/decline invite |

### Chat (REST + Socket.IO)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/:chatRoomId/messages` | Get messages |
| POST | `/api/chat/:chatRoomId/messages` | Send message |

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ chatRoomId, userId, userName }` | Join chat room |
| `send_message` | `{ chatRoomId, message, senderId, senderName }` | Send message |
| `typing` | `{ chatRoomId, userName, isTyping }` | Typing indicator |
| `leave_room` | `{ chatRoomId, userId }` | Leave room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | Message object | New message received |
| `room_users` | Array of users | Updated user list |
| `user_joined` | `{ userName, message }` | User joined notification |
| `user_typing` | `{ userName, isTyping }` | Typing indicator |

---

## 🗄️ MongoDB Schemas

### User
```
name, email, password (hashed), phone, avatar, role, location, bookingHistory[]
```

### Turf
```
name, description, owner, location, sports[], images[], amenities[], 
surface, capacity, rating, pricePerHour, peakHourMultiplier, 
weatherMultiplier{ sunny, cloudy, rainy }, peakHours{ start, end }, slots[]
```

### Booking
```
bookingId, user, turf, date, startTime, endTime, duration, sport, playerCount,
pricing{ basePrice, peakMultiplier, weatherMultiplier, finalPrice, isPeak },
team, status, payment{ status, transactionId, paidAt }, chatRoomId
```

### Team
```
name, captain, booking, sport, maxPlayers, members[{ user, email, status }], inviteCode, isComplete
```

### Message
```
chatRoomId, booking, sender, senderName, message, type, readBy[]
```

---

## 💰 Dynamic Pricing Logic

```
Final Price = Base Price × Peak Multiplier × Weather Multiplier

Peak Hours (5PM–9PM): × 1.3
Sunny Weather: × 1.2
Cloudy Weather: × 1.0  
Rainy Weather: × 0.8

Example:
Base: ₹1200/hr | Peak: ×1.3 | Sunny: ×1.2
Final = ₹1200 × 1.3 × 1.2 = ₹1,872/hr
```

---

## 👤 Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@goturf.com | admin123 |

---

## 🎨 Design System

- **Primary**: Emerald Green `#10B981`
- **Dark Green**: `#065F46`
- **Accent Blue**: `#3B82F6`
- **Peak Orange**: `#F59E0B`
- **Background**: `#F8FAFC`

---

## 📱 Pages

1. **Homepage** – Hero, search bar, trending turfs
2. **Auth** – Split-screen login/signup
3. **Turf Listing** – Filter sidebar, turf cards with dynamic pricing
4. **Slot Selection** – Calendar + time picker + price breakdown
5. **Team Registration** – Captain + invite system with progress bar
6. **Chat Room** – Real-time Socket.IO chat per booking
7. **Invite Page** – Accept/decline team invites
8. **Admin Dashboard** – Revenue charts, occupancy stats, booking table

---

## 🔧 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/goturf
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
