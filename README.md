<div align="center">

# 🚀 CareerSync — Backend

**The REST API powering the CareerSync career platform.**  
Built with Node.js · Express · MongoDB · Resend · Adzuna API

</div>

---

## 📖 About

CareerSync Backend is the server-side API that powers user authentication (OTP-based), job searching, user profile management, and AI-assisted resume analysis. It is designed as a stateless REST API consumed by the [CareerSync Frontend](https://github.com/itsmrajguru/CareerSync_Frontend).

---

## 🧰 Tech Stack

| Technology | Purpose |
|------------|---------|
| Express 5 | HTTP framework |
| Mongoose 9 | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT creation & verification |
| Joi | Request validation |
| Resend | Transactional email delivery |
| Multer | PDF file upload (memory storage) |
| pdf-parse | Extract text from uploaded PDFs |
| Axios | Adzuna API HTTP client |
| dnscache | DNS caching for Atlas performance |
| dotenv | Environment variable management |

---

## ✨ Features

- 🔐 **OTP-Based Login** — Credentials verified → 6-digit OTP sent via email (Resend) → JWT issued on verification
- ♻️ **Token Refresh** — Short-lived access tokens (15m) silently refreshed using an `httpOnly` refresh-token cookie (1d)
- 🔑 **Forgot / Reset Password** — Secure SHA-256 hashed reset tokens with 15-minute expiry
- 💼 **Job Search** — Powered by the [Adzuna API](https://developer.adzuna.com/); supports keyword, pagination, country, and sort filters
- 👤 **User Profiles** — Full CRUD for user career profiles (one-to-one with User)
- 📄 **Resume Analysis** — PDF upload → text extraction (`pdf-parse`) → ATS keyword scoring (30 tech skills vocabulary)
- 🌐 **Production-Ready CORS** — Whitelist-based origin control; supports Netlify + localhost
- ⚡ **DNS Caching** — `dnscache` caches MongoDB Atlas DNS for 5 minutes to reduce cold-start latency

---

## 🗂️ Project Structure

```
CareerSync-Backend/
├── controllers/
│   ├── authController.js       # Signup, Login (OTP), Verify OTP, Forgot/Reset Password
│   ├── jobController.js        # Job search via Adzuna
│   ├── userProfileController.js # Profile CRUD
│   └── resumeController.js     # PDF upload & ATS analysis
├── models/
│   ├── User.js                 # User schema (bcrypt pre-save hook)
│   ├── Otp.js                  # OTP schema with MongoDB TTL auto-expiry
│   └── Profile.js              # Career profile (1-to-1 with User)
├── routes/
│   ├── auth.routes.js
│   ├── jobs.routes.js
│   ├── userProfile.routes.js
│   └── resumeUpload.routes.js
├── middleware/
│   └── authMiddleware.js       # JWT Bearer token guard
├── services/
│   ├── emailService.js         # Resend email delivery
│   ├── adzunaService.js        # Adzuna job search API client
│   └── resumeService.js        # PDF parsing & ATS scoring
├── database/
│   └── db.js                   # MongoDB Atlas connection
├── .env.example                # Environment variable template
└── server.js                   # App entry point
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Server
PORT=8000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/careersync

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Adzuna Job Search API
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Frontend URL (for CORS & email links)
CLIENT_URL=https://careersyncplatform.netlify.app
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster
- A [Resend](https://resend.com) account (free tier works)
- An [Adzuna Developer](https://developer.adzuna.com) account

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/itsmrajguru/CareerSync_Backend.git
cd CareerSync_Backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start development server
npm run dev
```

The server will start at `http://localhost:8000`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |

---

## 🔐 Authentication Flow

```
User enters email + password
        │
        ▼
POST /api/auth/login
  → Validates credentials (Joi + bcrypt)
  → Generates 6-digit OTP
  → Stores OTP in DB (TTL: 10 min)
  → Sends OTP email via Resend
  → Returns { requiresOtp: true }
        │
        ▼
User enters OTP from email
        │
        ▼
POST /api/auth/verify-otp
  → Looks up OTP record
  → Validates & deletes OTP (one-time use)
  → Issues accessToken (15m) + refreshToken (1d cookie)
  → Returns { accessToken, user }
```

---

## 🛡️ Security

- Passwords hashed with **bcryptjs** (salt rounds: 10) via Mongoose `pre('save')` hook
- Email verification & password reset tokens hashed with **SHA-256** before DB storage
- OTPs automatically expired by **MongoDB TTL index** (no manual cleanup needed)
- Refresh token stored in **`httpOnly`** cookie (inaccessible to JavaScript)
- Input validated using **Joi** schemas on all auth endpoints

---

## 🤝 Related

- **Frontend:** [CareerSync Frontend](https://github.com/itsmrajguru/CareerSync_Frontend)
- **Live App:** [careersyncplatform.netlify.app]()

---

<div align="center">

Made with ❤️ by **Mangesh Rajguru**

</div>
