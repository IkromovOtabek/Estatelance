# BuFu (Estatelance) — Loyiha hujjati

> Bu fayl Claude Code uchun loyiha konteksti. Yangi sessiyada loyihani tez tanib olish uchun.
> Til: foydalanuvchi **o'zbekcha** gaplashadi — javoblar ham o'zbekcha bo'lsin.

---

## 1. Loyiha haqida

**BuFu** (brend nomi; papka nomi `Estatelance`) — O'zbekiston uchun **frilanser marketplace** platformasi.
Asosan ko'chmas mulk sohasi xizmatlariga ixtisoslashgan (foto/dron, 3D vizualizatsiya, interyer dizayn,
yuridik/kadastr, ta'mirlash, IT, SMM, tarjima va h.k.) — lekin umumiy frilanser platformasi sifatida ishlaydi.

- **Mijoz (Agent)** ish e'lon qiladi → **Frilanser** taklif (bid) yuboradi → kelishuv → bajarish → to'lov/review.
- Auth: **Telegram**, **Google OAuth**, **username/parol**.
- Bot: Telegram bot integratsiyasi bor.

---

## 2. Monorepo tuzilmasi

```
Estatelance/
├── estatelance-api/        # Backend — NestJS + GraphQL + MongoDB
│   └── apps/estatelance-api/src/
│       ├── app.module.ts
│       ├── main.ts
│       ├── components/     # modullar: auth, user, job, bid, post, message,
│       │                   #   notification, admin, telegram-bot, dispute,
│       │                   #   health, resume (AI Resume — shu sessiyada qo'shildi)
│       ├── schemas/        # Mongoose modellari (User, Job, Bid, Post, Message,
│       │                   #   Notification, Dispute, Follow, Announcement, ...)
│       ├── libs/           # config.ts, dto/, enums/, guards/, filters/, types/, utils/
│       └── database/
├── estatelance-next/       # Frontend — Next.js (Pages Router)
│   ├── pages/              # index, account, jobs, my-works, dashboard, profile,
│   │                       #   resume (AI Resume), articles, messages, _admin, ...
│   ├── libs/components/     # layout/ (Top, Footer, LayoutBasic), common/, admin/
│   ├── apollo/             # client.ts, store.ts, user/{query,mutation}.ts, admin/...
│   ├── scss/app.scss       # global stillar + dizayn tokenlari + dark mode
│   ├── public/             # statik fayllar + *-preview.html namunalar
│   └── tailwind.config.js
├── estatelance-mobile/     # Mobil ilova — React Native (Expo)
├── ecosystem.config.js     # PM2 konfiguratsiyasi (deploy)
├── nginx.conf
└── DEPLOY.md
```

---

## 3. Texnologiyalar (versiyalar)

**Backend (`estatelance-api`)**
- NestJS `^10.4` (monorepo, `apps/estatelance-api`)
- GraphQL **code-first** (`@nestjs/graphql` `^12.2`, `@nestjs/apollo`, `autoSchemaFile: true`)
- MongoDB + Mongoose `^8.9`
- ConfigModule (`isGlobal:true`), Throttler (global 60s/120req), AllExceptionsFilter
- Auth: JWT (30d), bcrypt, Telegram, Google (passport)

**Frontend (`estatelance-next`)**
- Next.js `14.2.21` (**Pages Router**, `pages/`)
- React `18.3`, Apollo Client `^3.12`
- MUI `^5.16` + Tailwind `^3.4` + SCSS (aralash)
- Theming: **next-themes** (`attribute="class"`, default `light`) + ikkita MUI tema (light/dark)
- Shrift: Inter. Brend ranglari: indigo `#6366F1` (primary) + purple `#A855F7` (secondary)

**Mobile (`estatelance-mobile`)** — React Native + Expo

---

## 4. Dizayn tizimi (MUHIM — bu yerda ishlanadi)

O'zgarishlar **markaziy token qatlamida** qilinadi → butun sayt bo'ylab avtomatik tarqaladi:

- **`scss/app.scss`** — CSS custom properties (`--primary`, `--text-1`, `--surface`, `--border`,
  `--shadow-*`, `--radius-*`, `--transition`, `--ring`, `--ease-*`), `.dark { ... }` override bloki
  (Tailwind klasslarini dark mode'ga remap qiladi), komponent klasslari (`.card-base`, `.btn-primary`,
  `.badge`, `.input-base`, ...), animatsiyalar.
- **`pages/_app.tsx`** — `lightMuiTheme` va `darkMuiTheme` (MUI `createTheme`), `DynamicMuiProvider`
  next-themes'ga qarab temani almashtiradi. `sharedComponents` (outline reset).
- **`tailwind.config.js`** — `darkMode: 'class'`, custom plugin'lar (`.scrollbar-hide`, button reset),
  `corePlugins.preflight: false`.

Light primary = indigo `#6366F1`; Dark primary = purple `#A855F7`.
Dark fon: `#0F172A` (page), `#1E293B` (card), border `#334155`.

---

## 5. Deploy (VPS)

- **VPS yo'li:** `/var/www/estatelance`
- **PM2** (`ecosystem.config.js`):
  - `estatelance-api` — cwd `./estatelance-api`, `nest start`, **port 3007**
  - `estatelance-web` — cwd `./estatelance-next`, `next start -p 3000`, **port 3000**
- Nginx reverse proxy. Domenlar: **bufu.uz** (frontend), **api.bufu.uz** (backend).

**Pull qilgandan keyingi qadamlar:**
```bash
git pull
cd estatelance-api && npm install && npm run build && cd ..
cd estatelance-next && npm install && npm run build && cd ..
pm2 restart estatelance-api estatelance-web --update-env
pm2 save
```
⚠️ Node **≥18** kerak (global `fetch` Groq/AI uchun). API GraphQL schema autoSchemaFile — restartda qayta yaratiladi.

---

## 6. Environment (.env)

**`estatelance-api/.env`** (barcha backend kalitlari shu yerda — ConfigModule cwd'dan o'qiydi):
`MONGO_DEV`, `MONGO_PROD`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_NAME`, `API_BASE_URL`, `GEMINI_API_KEY`, **`GROQ_API_KEY`**,
`UPLOAD_FOLDER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`,
`PLATFORM_PAYMENT_*`.

> Eslatma: AI chat **Gemini** (`GEMINI_API_KEY`) ishlatadi; **AI Resume** esa **Groq** (`GROQ_API_KEY`,
> model `llama-3.3-70b-versatile`) ishlatadi — ikki xil provayder, alohida kalit, muammosiz.

**`estatelance-next/.env.local`** — `NEXT_PUBLIC_*` (Telegram bot name, Google auth URL, API URL).

---

## 7. Asosiy konvensiyalar (yangi kod yozishda)

**Backend modul (`components/<name>/`):** `*.module.ts` + `*.resolver.ts` + `*.service.ts`.
- Resolver: `@Resolver()`, guard'lar `AuthGuard`/`ActiveUserGuard`/`OptionalAuthGuard` (`../auth/auth.guard`),
  joriy foydalanuvchi: `@AuthUser('_id')` (`../auth/auth-user.decorator`).
- DTO: `libs/dto/*.dto.ts` — `@InputType()` / `@ObjectType()` (class-validator bilan).
- Env: to'g'ridan-to'g'ri `process.env.X`.
- Yangi modulni `app.module.ts` `imports` ga qo'shish kerak.

**Frontend sahifa:** `pages/<name>/index.tsx`, `export default withLayoutBasic(Page)`.
- Joriy user: `useReactiveVar(userVar)` (`apollo/store`).
- GraphQL: `apollo/user/{query,mutation}.ts` da `gql` bilan.
- Rasm yuklash: `/api/upload` (base64 → URL qaytaradi).
- Stillar: Tailwind klasslar + `app.scss` token klasslari (`card-base`, `btn-primary`, `input-base`, ...).

---

## 8. Shu sessiyada qilingan ishlar (tarix)

1. **Dark/Light komponent detallari** sayqallandi (`app.scss` easing/ring tokenlari, avatar-online bug,
   MUI light/dark parity, button press micro-interactions).
2. **Jobs filtr scrollbar** yashirildi (`scrollbar-hide` utility `tailwind.config.js` ga qo'shildi).
3. **Login (account) tuzatishlar:** autofill fon (`--autofill-bg`), va sahifa qaltirashi —
   `TelegramLoginButton.tsx` `useEffect` `onAuth` ni ref'ga oldi (har keystroke'da widget qayta yuklanmaydi).
4. **AI Resume feature** qo'shildi:
   - Backend: `components/resume/` (resolver/service/module), `libs/dto/resume.dto.ts`,
     Groq API (`llama-3.3-70b-versatile`), `generateResume` mutation (AuthGuard).
   - Frontend: `pages/resume/index.tsx` — batafsil forma (til top-10 + daraja, ta'lim Kollej/Bakalavr/Magistr/PHD,
     soha tanlash + "Boshqa", rasm on/off, majburiy validatsiya, **localStorage saqlash**), natija + PDF (print).
   - `apollo/user/mutation.ts` → `GENERATE_RESUME`. Nav (`Top.tsx`) → "✨ AI Resume" havola.
5. **UI redizayn namunalari** (faqat `public/`, haqiqiy kodga TEGMAGAN):
   - `public/style-options.html` — 4 yo'nalish (A Editorial / B Brutalist / C Luxe / **D Aurora Modern**).
   - `public/aurora-layout.html` — Aurora Modern (indigo/purple) to'liq landing: nav + hero + **device mockup**
     (noutbuk+telefon ichida BuFu UI) + **3-slide swiper** (Frilanserlar/Ishlar/AI Resume, har 5s almashadi)
     + rasm-fon swiper + stats. **Foydalanuvchi "D Aurora" yo'nalishini tanladi** (hozircha device yashirilgan).

> ⚠️ Redizayn hali **haqiqiy loyihaga qo'llanmagan**. Foydalanuvchi **"loyihamizga qo'lla"** deganda
> Aurora yo'nalishini `app.scss` + `_app.tsx` + `Top.tsx` + bosh sahifaga bosqichma-bosqich o'tkazish kerak.

---

## 9. Lokal ishga tushirish

- Frontend dev: `cd estatelance-next && npm run dev` → **port 3001** (`next dev -p 3001`).
- Backend dev: `cd estatelance-api && npm run start:dev` (nest watch).
- MongoDB ulanishi `.env` (`MONGO_DEV`) orqali.

---

## 10. Xavfsizlik eslatmalari

- AI/API kalitlari **faqat backend**'da (`.env`), hech qachon frontend'da emas.
- Throttler global yoqilgan. Rasm yuklash `/api/upload` orqali (base64 emas, URL saqlanadi).
- To'lov/karta ma'lumotlari — foydalanuvchi o'zi kiritadi, AI yoki avtomatik harakat yo'q.
