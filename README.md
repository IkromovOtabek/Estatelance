<div align="center">

<img src="estatelance-next/public/logo.svg" alt="BuFu Logo" width="220" />

# BuFu — Build Future

**O'zbekistondagi frilanserlar va ish beruvchilarni bog'laydigan zamonaviy platforma**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)](https://nestjs.com)
[![GraphQL](https://img.shields.io/badge/GraphQL-API-e535ab?style=flat-square&logo=graphql)](https://graphql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-WebSocket-black?style=flat-square&logo=socket.io)](https://socket.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)

[🌐 Live Demo](https://bufu.uz) · [📋 API Docs](#api) · [🚀 Deploy Guide](#deploy)

</div>

---

## 📖 Loyiha haqida

**BuFu** (Build Future) — Uzbekiston bozori uchun yaratilgan to'liq funksiyali freelance platforma. Ish beruvchilar loyihalarini joylashtirib, malakali mutaxassislar topa oladi; frilanserlar esa o'z xizmatlarini taklif qilib, mijozlar bilan real vaqt rejimida muloqot qilishadi.

### 🎯 Asosiy maqsad

> *"O'zbekistondagi har bir mutaxassisga o'z imkoniyatini ko'rsatish uchun professional platforma yaratish"*

---

## ✨ Funksiyalar

### 👤 Foydalanuvchilar
| Funksiya | Tavsif |
|---|---|
| **Telegram Auth** | Telegram Login Widget orqali tez ro'yxatdan o'tish |
| **Ikki turdagi hisob** | Frilanser va Ish beruvchi (Agent) rollari |
| **Profil** | Ko'nikma, tajriba, reyting, bajarilgan ishlar |
| **AI Match** | Loyiha va frilanserlarni AI orqali moslashtirish |
| **Follow tizimi** | Foydalanuvchilarni kuzatish va yangiliklar |

### 💼 Ish boshqaruvi
| Funksiya | Tavsif |
|---|---|
| **Ish e'lonlari** | Kategoriya, byudjet, tajriba darajasi, format bo'yicha |
| **hh.ru uslubi** | Chap sidebar filter + karta ko'rinishi |
| **Bid (Taklif)** | Frilanserlar ish uchun narx taklif qiladi |
| **So'rov yuborish** | Shablon xabar bilan avtomatik so'rov |
| **Aloqa modal** | Telefon va chat orqali bog'lanish |

### 💬 Real-time Chat
| Funksiya | Tavsif |
|---|---|
| **DM Chat** | Foydalanuvchilar orasida to'g'ridan-to'g'ri xabar |
| **Jamoat chati** | Barcha foydalanuvchilar uchun ochiq xona |
| **Mehmon rejimi** | Login qilmagan foydalanuvchilar ham yoza oladi |
| **Online soni** | Real vaqtda onlayn foydalanuvchilar soni |
| **Chat widget** | Barcha sahifalarda suzib yuruvchi widget |

### 🔔 Bildirishnomalar
- Yangi xabar, follow, ish qabul qilindi — real vaqt
- 7 kundan keyin avtomatik o'chish (MongoDB TTL)
- O'qilmagan bildirishnomalar soni

### 🛡️ Admin panel
- Foydalanuvchi boshqaruvi (status, rol)
- Ish e'lonlari moderatsiyasi
- E'lonlar (Announcements) yaratish va tarqatish
- Broadcast bildirishnomalar
- Statistika dashboard

---

## 🏗️ Arxitektura

```
bufu/
├── estatelance-next/          # Frontend (Next.js)
│   ├── pages/                 # Sahifalar (App Router emas, Pages Router)
│   │   ├── index.tsx          # Bosh sahifa
│   │   ├── jobs/              # Ish e'lonlari
│   │   ├── browse/            # Frilanserlar katalogi
│   │   ├── profile/[id].tsx   # Profil sahifasi
│   │   ├── messages/          # Xabarlar
│   │   ├── ai-match/          # AI moslashtirish
│   │   └── _admin/            # Admin panel
│   ├── libs/
│   │   ├── components/        # UI komponentlar
│   │   │   ├── layout/        # Header, Footer, Navbar
│   │   │   └── common/        # ChatWidget, AnnouncementBanner
│   │   ├── types/             # TypeScript interfeyslari
│   │   └── enums/             # Konstantalar
│   └── apollo/                # GraphQL client, queries, mutations
│
├── estatelance-api/           # Backend (NestJS)
│   └── apps/estatelance-api/src/
│       ├── components/        # Biznes logika modullari
│       │   ├── user/          # Auth, profil, follow
│       │   ├── job/           # Ish e'lonlari CRUD
│       │   ├── bid/           # Takliflar tizimi
│       │   ├── message/       # DM chat + WebSocket gateway
│       │   ├── notification/  # Bildirishnomalar
│       │   ├── post/          # Maqolalar va sharhlar
│       │   └── admin/         # Admin operatsiyalar
│       ├── schemas/           # Mongoose modellari
│       └── libs/              # DTO, enum, guard
│
├── ecosystem.config.js        # PM2 konfiguratsiya
├── nginx.conf                 # Nginx reverse proxy
└── DEPLOY.md                  # Deploy yo'riqnomasi
```

---

## 🛠️ Texnologiyalar

### Frontend
| Kutubxona | Versiya | Maqsad |
|---|---|---|
| **Next.js** | 14 | React framework, SSR/SSG |
| **Material UI** | 5 | UI komponentlar tizimi |
| **Apollo Client** | 3 | GraphQL state management |
| **Socket.io-client** | 4 | WebSocket real-time |
| **Phosphor Icons** | 2 | Icon kutubxonasi |
| **TypeScript** | 5 | Type safety |

### Backend
| Kutubxona | Versiya | Maqsad |
|---|---|---|
| **NestJS** | 10 | Node.js framework |
| **GraphQL** | Code-first | API layer |
| **Mongoose** | 8 | MongoDB ODM |
| **Socket.io** | 4 | WebSocket server |
| **JWT** | — | Authentication |
| **bcryptjs** | — | Parol xeshlash |
| **@nestjs/throttler** | — | Rate limiting |

### Infratuzilma
| Texnologiya | Maqsad |
|---|---|
| **MongoDB Atlas** | Ma'lumotlar bazasi |
| **PM2** | Process manager |
| **Nginx** | Reverse proxy + SSL |
| **Let's Encrypt** | Bepul SSL sertifikat |
| **Ubuntu 22.04 VPS** | Server |

---

## 🚀 Lokal ishga tushirish

### Talablar
- Node.js `>= 20`
- Yarn `>= 1.22`
- MongoDB (lokal yoki Atlas)
- Telegram bot tokeni (`@BotFather`)

### 1. Reponi klonlash
```bash
git clone https://github.com/username/bufu.git
cd bufu
```

### 2. Backend sozlash
```bash
cd estatelance-api
yarn install

# .env faylni yarating
cp .env.example .env
```

`.env` ni to'ldiring:
```env
NODE_ENV=development
PORT=3007
MONGODB_URI=mongodb://localhost:27017/bufu
JWT_SECRET=your_super_secret_key_min_32_chars
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ALLOWED_ORIGINS=http://localhost:3000
```

```bash
# Ishga tushirish
yarn start:dev
```

### 3. Frontend sozlash
```bash
cd ../estatelance-next
yarn install

# .env.local yarating
cp .env.example .env.local
```

`.env.local` ni to'ldiring:
```env
GRAPHQL_SERVER_URL=http://localhost:3007/graphql
NEXT_PUBLIC_API_URL=http://localhost:3007/graphql
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_username
```

```bash
# Ishga tushirish
yarn dev
```

### 4. Brauzerda oching
```
http://localhost:3000
```

---

## 🗄️ Ma'lumotlar bazasi sxemasi

```
Users          ─── Follow (many-to-many)
  │
  ├── Jobs     ─── Bids (one-to-many)
  │
  ├── Messages (DM chat)
  ├── PublicMessages (jamoat chati, TTL: 30 kun)
  ├── Notifications (TTL: 7 kun)
  └── Posts    ─── Comments (one-to-many)
```

### MongoDB TTL indekslar
| Kolleksiya | TTL | Sabab |
|---|---|---|
| `notifications` | 7 kun | Eski bildirishnomalar DB ni tiqilmaydi |
| `publicmessages` | 30 kun | Jamoat chati tarixi cheklangan |

---

## 🔌 API

GraphQL endpointi: `POST /graphql`

### Asosiy so'rovlar (Queries)
```graphql
# Ishlar ro'yxati
getJobs(input: GetJobsInput!): [Job]

# Foydalanuvchi profili
getUserProfile(userId: String!): User

# Suhbat tarixi
getConversation(otherUserId: String!): [Message]

# Bildirishnomalar
getMyNotifications: [Notification]
```

### Asosiy mutatsiyalar (Mutations)
```graphql
# Ro'yxatdan o'tish
signup(input: SignupInput!): AuthPayload

# Telegram orqali login
loginWithTelegram(input: TelegramAuthInput!): AuthPayload

# Xabar yuborish (avtomatik notification)
sendMessage(input: SendMessageInput!): Message

# Ish e'lonlash
createJob(input: CreateJobInput!): Job

# Taklif berish
createBid(input: CreateBidInput!): Bid
```

### WebSocket Events (`/chat` namespace)
```
Client → Server:
  join          { userId }           # DM xonasiga kirish
  joinPublic    { name?, guestId? }  # Jamoat chatiga kirish
  sendMessage   { receiverId, text } # DM xabar
  publicMessage { text, color }      # Jamoat xabari

Server → Client:
  onlineCount   number               # Onlayn foydalanuvchilar
  newMessage    Message              # Yangi DM xabar
  publicHistory Message[]            # Oxirgi 50 ta xabar
  newPublicMsg  PublicMessage        # Yangi jamoat xabari
```

---

## 🔒 Xavfsizlik

- **JWT** — barcha so'rovlarda Bearer token
- **ActiveUserGuard** — har bir mutatsiyada DB dan faol status tekshiruvi
- **Rate Limiting** — 120 so'rov / 60 sekund (ThrottlerModule)
- **CORS** — faqat ruxsat etilgan domenlar (`ALLOWED_ORIGINS`)
- **GraphQL Playground** — production da o'chirilgan
- **bcryptjs** — parollar xeshlangan
- **Spam tizimi** — Admin spam qilgan foydalanuvchilar mutatsiya qila olmaydi

---

## 📦 Production Deploy

To'liq deploy yo'riqnomasi uchun: **[DEPLOY.md](./DEPLOY.md)**

Qisqa ko'rinish:
```bash
# Build
cd estatelance-api && yarn build
cd ../estatelance-next && yarn build

# PM2 bilan ishga tushirish
pm2 start ecosystem.config.js --env production
pm2 startup && pm2 save

# SSL
sudo certbot --nginx -d bufu.uz -d www.bufu.uz -d api.bufu.uz
```

---

## 📁 Muhit o'zgaruvchilari

### Backend (`estatelance-api/.env`)
| O'zgaruvchi | Tavsif | Misol |
|---|---|---|
| `NODE_ENV` | Muhit | `production` |
| `PORT` | Server porti | `3007` |
| `MONGODB_URI` | MongoDB ulanish | `mongodb+srv://...` |
| `JWT_SECRET` | JWT kalit (min 64 char) | `openssl rand -hex 64` |
| `TELEGRAM_BOT_TOKEN` | Bot tokeni | `123456:ABC...` |
| `ALLOWED_ORIGINS` | CORS domenlar | `https://bufu.uz` |

### Frontend (`estatelance-next/.env.local`)
| O'zgaruvchi | Tavsif | Misol |
|---|---|---|
| `GRAPHQL_SERVER_URL` | Server ichki URL | `http://127.0.0.1:3007/graphql` |
| `NEXT_PUBLIC_API_URL` | Tashqi API URL | `https://api.bufu.uz/graphql` |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Bot username | `bufu_auth_bot` |

---

## 🤝 Hissa qo'shish

1. Reponi fork qiling
2. Feature branch yarating: `git checkout -b feature/yangi-funksiya`
3. O'zgarishlarni commit qiling: `git commit -m 'feat: yangi funksiya qo'shildi'`
4. Branch ga push qiling: `git push origin feature/yangi-funksiya`
5. Pull Request oching

### Commit konventsiyasi
```
feat:     yangi funksiya
fix:      xato tuzatish
refactor: qayta yozish (xato emas)
style:    UI o'zgarish
docs:     hujjat yangilash
chore:    konfiguratsiya, dependencies
```

---

## 📊 Loyiha holati

| Modul | Holat |
|---|---|
| Auth (JWT + Telegram) | ✅ Tayyor |
| Ish e'lonlari | ✅ Tayyor |
| Bid tizimi | ✅ Tayyor |
| Real-time chat (DM + Public) | ✅ Tayyor |
| Bildirishnomalar | ✅ Tayyor |
| Admin panel | ✅ Tayyor |
| AI Match | ✅ Tayyor |
| Mobile App (React Native) | 🔜 Rejalashtirilgan |
| Payment tizimi | 🔜 Rejalashtirilgan |
| Video qo'ng'iroq | 🔜 Rejalashtirilgan |

---

## 📄 Litsenziya

Bu loyiha [MIT](LICENSE) litsenziyasi ostida tarqatiladi.

---

<div align="center">

**BuFu** — *Build Future* 🚀

[bufu.uz](https://bufu.uz) · [Telegram](https://t.me/bufu_uz) · [info@bufu.uz](mailto:info@bufu.uz)

© 2026 BuFu. Barcha huquqlar himoyalangan.

</div>
