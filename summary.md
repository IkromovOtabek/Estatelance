# BuFu — Ish holati (summary)

> Bu **progress / handoff** hujjati: hozir qayerdamiz, nima qilindi, nima kutilyapti, keyingi qadam.
> `CLAUDE.md` = loyihaning barqaror ma'lumoti. Bu fayl = **o'zgaruvchan holat**, har sessiyada yangilanadi.
>
> **Oxirgi yangilanish:** 2026-06-05
>
> 📌 **Doimiy yo'riqnoma:** Foydalanuvchi har bir ish tugagach shu `summary.md` ni **avtomatik yangilashni** so'radi.
> Har o'zgarishdan keyin bu faylni dolzarb qilib turish kerak.

---

## 🟢 Joriy holat (qisqacha)

- AI Resume feature **kod tayyor**, lokalda typecheck o'tgan. VPS'da `GROQ_API_KEY` qo'shilishi kerak edi.
- **Aurora hero HAQIQIY bosh sahifaga QO'LLANDI** (`pages/index.tsx`) — 1-bosqich tugadi. Qolgan qismlar (nav blend, ranglar/shriftlar, boshqa sahifalar) hali namunada.
- Redizayn bosqichma-bosqich davom etyapti.

---

## ✅ Bajarilgan (shu sessiyada)

1. **Dark/Light komponent sayqali** — `app.scss` (easing/`--ring` tokenlari, `avatar-online` dark bug,
   button press micro-interactions), `_app.tsx` (MUI light/dark parity: Chip/Tooltip/Divider/AppBar).
2. **Jobs filtr scrollbar** yashirildi → `scrollbar-hide` utility `tailwind.config.js` ga qo'shildi
   (`pages/jobs/index.tsx:359`).
3. **Login (account) bug tuzatishlari:**
   - Autofill ochiq "yamoq" → `app.scss` dark autofill `#1E293B` → `var(--autofill-bg)` (#0f172a).
   - **Sahifa qaltirashi** → `TelegramLoginButton.tsx`: `onAuth` ref'ga olindi, `useEffect` deps'dan chiqarildi
     (har keystroke'da Telegram widget qayta yuklanmaydi). Tasdiqlangan (node stabil, jitter yo'q).
4. **AI Resume feature (to'liq):**
   - Backend: `components/resume/{module,resolver,service}.ts`, `libs/dto/resume.dto.ts`,
     `app.module.ts` ga ulandi. Groq `llama-3.3-70b-versatile`, JSON output, `generateResume` mutation.
   - Frontend: `pages/resume/index.tsx` (batafsil forma: tillar+daraja, ta'lim darajalari, soha+Boshqa,
     rasm on/off, majburiy validatsiya, **localStorage saqlash**, PDF print), `GENERATE_RESUME` mutation,
     `Top.tsx` ga "✨ AI Resume" havola.
   - ⚠️ `useCallback` bilan Rules-of-Hooks xatosi bo'lgan edi → qaytarib olindi (ref pattern yetarli).
5. **UI redizayn namunalari** (`public/`, real kodga tegmagan):
   - `style-options.html` — 4 yo'nalish; foydalanuvchi **D · Aurora Modern** ni tanladi.
   - `aurora-layout.html` — Aurora hero: nav + matn + (device mockup) + **3-slide swiper**
     (Frilanserlar/Ishlar/AI Resume, har 5s) + rasm-fon swiper + stats. Ranglar indigo/purple, rasmlar frilanser mavzusi.
     **Device mockup `display:none` bilan vaqtincha yashirilgan** (so'rov: "device rasmni olib tur").
     **Swiper balandligi `calc(100vh - 86px)`** — ekranni to'ldiradi, matn vertikal markazda (so'rov: "height ekranni to'ldirib tursin").
     **Swiper tepa/past chetlari** — `.swiper::before/::after` gradient fade fon rangiga (`#0b1020`) silliq ulanadi (so'rov: "tepa va past shadow bo'lib boshqa ranga ulanib ketsin").
     **Navbar ulanishi** — swiper `margin-top:-88px` bilan rasm navbar ortiga kiradi, `.nav-wrap{z-index:10}` shaffof navbar, tepa fade 240px gacha kuchaytirildi → navbar rasmga gradient-shadow bilan ulanadi, seam yo'q (so'rov: "navbar qismiga shadow bo'lib gradient ulanib ketsin").
     **Pastki seam** — avval `.stats-wrap` gradient sinab ko'rildi (BUZILDI → revert qilindi). To'g'ri yechim: aurora fonidagi **pastki binafsha radial olib tashlandi** (`.aurora` dan 3-radial o'chirildi) → past bir tekis to'q. Q1 (pastki aniq ko'rinish) foydalanuvchidan kutilmoqda.
     **Trust bloki** — hero matni ostiga qo'shildi (3 slide'da): glass pill + 5 overlapping avatar (pravatar) + "10+ frilanser bizga ishonadi" + ★★★★★ 5.0 reyting.
     **Namuna soddalashtirildi:** swiper bekor (faqat 1-slide statik, dots o'chirildi), bitta rasm (photo-1559136555), matn **chapga tekislangan** (`.hero{text-align:left;max-width:680px}`).
6. **Aurora hero HAQIQIY bosh sahifaga qo'llandi** (`pages/index.tsx`, 1-bosqich):
   - Eski ikki-ustunli hero → to'liq-ekran rasm swiper hero (4 Unsplash rasm, har 5s crossfade+zoom).
   - To'q qoplama + pastki fade keyingi bo'lim rangiga; **CTA role-based saqlandi**; **trust haqiqiy ma'lumotga ulangan** (`heroAvatars`/`freelancerCount`/`heroAvgRating`).
   - Typecheck exit 0.
   - **Sozlash:** swiper bekor qilindi → **bitta statik rasm** (photo-1559136555, `.hero-slide opacity:1`, animatsiyasiz). Hero pastiga **"SCROLL" + CaretDown** indikatori (bounce, temaga mos rang).
   - **Matn chapga tekislandi**, keyin **o'rtaga qaytarildi** (foydalanuvchi so'rovi bo'yicha bir necha marta o'zgardi: chap→o'ng→o'rta).
7. **Navbar blend (2-bosqich)** — bosh sahifada nav rasm ortidan o'tadi (mockup'dagidek):
   - `Top.tsx`: `isHome`, `scrolled` (window scroll listener), `overlay = mounted && isHome && !scrolled`, `effDark = isDark || overlay`.
   - AppBar overlay'da: `bgcolor: transparent`, gradient, `borderBottom: transparent`, oq matn. Scrollda qattiq qaytadi.
   - Nav ranglari `effDark` ga ulandi: logo wordmark, nav linklar, hamburger, toggle (overlay'da oq).
   - `index.tsx`: hero `marginTop: -96px` (nav 64 + main pt 32) → rasm nav ortiga kiradi, `.bufu-hero min-height: 100vh`.
   - ⚠️ **Preview cheklovi:** preview'da `window.scrollTo` scroll event chiqarmaydi → scroll-solidify preview'da test qilib bo'lmadi. Standart kod, **haqiqiy brauzerda ishlaydi**. Tepa shaffof holat tasdiqlangan.
   - ⚠️ **TODO:** logged-in nav qo'shimchalari (bell, profil avatar) hali `isDark` ishlatadi.
8. **Navbar → suzuvchi GLASS bar** (barcha sahifalarda, har doim — foydalanuvchi so'rovi):
   - Overlay/scroll logikasi olib tashlandi (`overlay = false`, `effDark = isDark`).
   - `AppBar`: shaffof o'ram (`bgcolor: transparent`, yon `px`), `Toolbar`: suzuvchi glass — `mt`, `borderRadius: {xs:3, sm:4}`, `bgcolor: rgba(...,0.6/0.62)`, `backdropFilter: blur(18px)`, border + soft shadow.
   - `maxWidth: 1240`, markazda. Barcha sahifalarda bir xil (Top.tsx shared). Bosh sahifada hero -96px hali ortidan o'tadi → glass nav hero ustida suzadi.
   - Tasdiqlangan: bosh sahifa + /jobs da to'g'ri.
   - **Keyin sozlandi (so'rov):** suzuvchi/dumaloq emas → **to'liq kenglik, o'tkir burchak** glass bar. Yaltiroq oq border olib tashlandi, faqat nozik pastki chiziq.
   - **Blur kuchaytirildi**, keyin **toza oyna (so'rov "oq rang aralashmasin"):** `bgcolor: transparent` (tint yo'q), faqat `backdropFilter: blur(22px) saturate(160%)`.
   - **Pastki chiziq → shadow (so'rov):** `borderBottom: none`, o'rniga yumshoq `boxShadow: 0 8px 24px rgba(...)`.
   - **Max shaffof (so'rov):** `backdropFilter: blur(5px) saturate(120%)` — fon deyarli to'liq aniq ko'rinadi, navbar sof oyna.
   - **Tepa oq chiziq bug tuzatildi:** shaffof nav ortida tepada 1px sahifa foni (#FAFAFA) ko'rinardi — hero `marginTop: -96 → -101px` (AppBar 65px ekan) → tepani to'liq qoplaydi.
   - **Gorizontal scroll bug tuzatildi:** hero `w-screen` (100vw) vertikal scrollbar kengligini qo'shib, pastda gorizontal scroll chiqarardi → `app.scss` `html { overflow-x: hidden }`. Endi faqat vertikal scroll.
   - **Tepa oq chiziq (light mode) — mustahkam tuzatildi:** shaffof nav ortida light mode'da #FAFAFA fon ko'rinardi → hero `marginTop: -112px` (zaxira bilan), tepani to'liq qoplaydi. Preview'da y=1 chap/markaz/o'ng — hammasi dark. Foydalanuvchi brauzerida ko'rinsa — hard refresh kerak (kesh).
6. **Hujjatlar:** `CLAUDE.md` (loyiha ma'lumoti) + `summary.md` (shu fayl) yaratildi.
   Doimiy yo'riqnoma: har ishdan keyin `summary.md` ni yangilab borish.

---

## ⏳ Kutilayotgan / hal qilinmagan

- [ ] **VPS'da `GROQ_API_KEY`** — `/var/www/estatelance/estatelance-api/.env` ga qo'shilishi kerak (oxirgi tekshiruvda yo'q edi).
      Qo'shgach: `pm2 restart estatelance-api --update-env`. Node ≥18 bo'lsin.
- [ ] **Aurora redizaynni HAQIQIY loyihaga qo'llash** — foydalanuvchi **"loyihamizga qo'lla"** deganda boshlanadi.
      Reja (bosqichma-bosqich):
      1. `app.scss` + `_app.tsx` — ranglar/shriftlar (Inter→Bricolage/Manrope, indigo/purple Aurora palitra)
      2. `Top.tsx` (nav) + bosh sahifa hero (swiper bilan)
      3. Karta / tugma / badge komponentlari
- [ ] AI Resume — VPS'da jonli test (kalit qo'shilgach).

## 💡 Ochiq qarorlar / eslatmalar

- Device mockup'ni qaytarish: `aurora-layout.html` da `.devices{display:none !important}` qatorini olib tashlash + `.swiper{min-height}` ni qaytarish.
- Redizaynni qo'llashda **bosqichma-bosqich** ketish kelishilgan (har bosqichni ko'rib boradi).
- Til: hamma javoblar **o'zbekcha**.

---

## 🎯 Keyingi qadam (yangi sessiya shu yerdan davom etadi)

1. Aurora redizayn 2-bosqich (foydalanuvchi tasdiqlasa): nav (`Top.tsx`) rasmga blend, ranglar/shriftlar (`app.scss`+`_app.tsx`), boshqa bo'limlar.
2. Hero rasmlarini Unsplash'dan lokal/CDN ga ko'chirish (production uchun).
3. VPS'da `GROQ_API_KEY` tasdiqlangach → AI Resume jonli test.
