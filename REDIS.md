# 🔴 BuFu — Redis qo'llanmasi (boshidan oxirigacha)

> Bu hujjat self-study uchun. Redis nima, nega kerak, qanday o'rnatiladi va loyihaga
> qanday ulanadi — hammasi o'zbek tilida, qadam-baqadam.

---

## 1. Redis nima va nega kerak?

**Redis** — operativ xotirada (RAM) ishlaydigan **tezkor kalit-qiymat (key-value) ma'lumotlar bazasi**.

| | MongoDB (bizda bor) | Redis (qo'shamiz) |
|---|----|----|
| Qayerda | Diskda | RAM'da |
| Tezlik | ~50–100 ms | ~1–5 ms |
| Saqlaydi | Asosiy doimiy ma'lumot | Vaqtinchalik **kesh** (nusxa) |
| Maqsad | Haqiqat manbai | Tezlashtirish |

**Asosiy g'oya:** ko'p o'qiladigan ma'lumotni (bosh sahifa ishlar ro'yxati, frilanserlar,
e'lonlar) MongoDB'dan **bir marta** olib, Redis'ga 60 soniyaga saqlaymiz. Keyingi har bir
foydalanuvchi MongoDB'ga bormay, Redis'dan **darhol** oladi.

```
Foydalanuvchi → Backend → Redis'da bormi?
                          ├─ HA  → darhol qaytaradi (1ms) ✅
                          └─ YO'Q → MongoDB'dan oladi (50ms) → Redis'ga saqlaydi
```

### Bizning loyihada Redis nimaga ishlatiladi
1. **Query kesh** — getJobs, getFreelancers, getActiveAnnouncements (eng katta foyda)
2. **Telegram bot tokenlar** — hozir xotirada (`Map`), restart'da yo'qoladi → Redis'da chidamli
3. **Rate-limit** — ko'p server (PM2 instansiya) bo'ylab birga ishlaydi
4. **Live ko'ruvchilar / viewCount** — tez counter
5. **Chat (socket.io)** — ko'p instansiyaga kengayish

---

## 2. ⚠️ Muhim xavfsizlik tushunchasi

- Redis **server tomonda** ishlaydi. APP va Web **to'g'ridan-to'g'ri ulanmaydi** — ular
  backend'ga ulanadi, backend Redis'ni ishlatadi.
- Redis **standart holatda parolsiz** → kim ulansa, hammasini o'chira oladi. Shuning uchun:
  - **Parol** qo'yamiz (`requirepass`)
  - Faqat **lokal** ulanish (`bind 127.0.0.1`) — tashqaridan kira olmaydi

---

## 3. VPS'ga Redis o'rnatish (Ubuntu) — qadam-baqadam

> Serverga SSH bilan kiring: `ssh root@SERVER_IP`

### 3.1. O'rnatish
```bash
sudo apt update
sudo apt install -y redis-server
```

### 3.2. Parol qo'yish va xavfsizlash
`redis.conf` faylini tahrirlash:
```bash
sudo nano /etc/redis/redis.conf
```
Quyidagilarni toping va o'zgartiring (Ctrl+W bilan qidiring):

| Topish | Qilish |
|--------|--------|
| `# requirepass foobared` | `requirepass BuFu_R3dis_2026!` (izoh `#` ni oching, parolni o'zingiznikiga almashtiring) |
| `bind 127.0.0.1 ::1` | shunday qoldiring (faqat lokal) |
| `supervised no` | `supervised systemd` (systemd bilan boshqarish) |

Saqlash: `Ctrl+O` → Enter → `Ctrl+X`.

> **Parolni murakkab tanlang!** Masalan: katta/kichik harf + raqam + belgi.

### 3.3. Qayta ishga tushirish + avtostart
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server     # server qayta yoqilganda avtomatik ishga tushadi
sudo systemctl status redis-server     # "active (running)" ko'rinishi kerak
```

### 3.4. Tekshirish
```bash
redis-cli -a 'BuFu_R3dis_2026!' ping
# → PONG   (shu chiqsa — ishlayapti ✅)
```
Agar `NOAUTH` xatosi chiqsa — parol noto'g'ri yoki o'rnatilmagan.

### 3.5. (Ixtiyoriy) Firewall — 6379 portni tashqaridan yopish
```bash
sudo ufw deny 6379       # tashqaridan Redis portiga kirishni taqiqlash (lokal baribir ishlaydi)
```

---

## 4. Backend'ni Redis'ga ulash

### 4.1. `.env` ga qo'shing
`estatelance-api/.env` fayliga (serverda):
```
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=BuFu_R3dis_2026!
```
> ⚠️ `REDIS_PASSWORD` ni 3.2-bosqichda QO'YGAN parolingiz bilan to'ldiring.
> Agar `REDIS_HOST` bo'sh qoldirilsa — backend kesh'siz ishlaydi (xato bermaydi).

### 4.2. Paketlarni o'rnatish
```bash
cd /var/www/estatelance/estatelance-api
npm install            # package.json'da ioredis allaqachon qo'shilgan (men qo'shdim)
```

### 4.3. Build + restart
```bash
npm run build
pm2 restart estatelance-api --update-env
pm2 logs estatelance-api --lines 20
```
Loglarda `[Redis] ulandi ✅` ko'rinsa — tayyor!

---

## 5. Redis ichini ko'rish (foydali buyruqlar)

```bash
redis-cli -a 'BuFu_R3dis_2026!'        # kirish

KEYS *                  # barcha kalitlar
GET jobs:list:p1        # bitta kalit qiymati
TTL jobs:list:p1        # necha soniyadan keyin o'chadi
DBSIZE                  # nechta yozuv bor
INFO memory             # qancha xotira ishlatilyapti
FLUSHALL                # ⚠️ HAMMASINI o'chirish (faqat sinov uchun!)
MONITOR                 # real vaqtda barcha so'rovlarni ko'rish (debug)
exit
```

---

## 6. Kutiladigan natija

| Ko'rsatkich | Redis'siz | Redis bilan |
|-------------|-----------|-------------|
| Bosh sahifa / ishlar ro'yxati | ~50–100 ms | ~1–5 ms (kesh hit) |
| MongoDB yuki | Har so'rovda | Sezilarli kam |
| Bot tokenlar | Restart'da yo'qoladi | Chidamli |
| Rate-limit | Bitta server | Barcha instansiya |

---

## 7. Muammolarni hal qilish

| Muammo | Yechim |
|--------|--------|
| `NOAUTH Authentication required` | `.env` dagi `REDIS_PASSWORD` redis.conf'dagi parol bilan bir xilmi tekshiring |
| `[Redis] ulanmadi` log | `sudo systemctl status redis-server` — ishlayaptimi? |
| `Connection refused` | Redis ishlamayapti: `sudo systemctl restart redis-server` |
| Kesh yangilanmayapti | TTL tugashini kuting yoki `redis-cli ... FLUSHALL` |
| Backend kesh'siz ishlayapti | `.env`da `REDIS_HOST` bormi tekshiring |

---

## 8. Qisqa xulosa (sizning qadamlaringiz)

1. ✅ Serverda Redis o'rnating (3-bo'lim)
2. ✅ `.env`ga 3 ta qator qo'shing (4.1)
3. ✅ `npm install && npm run build && pm2 restart` (4.2–4.3)
4. ✅ `[Redis] ulandi` logini ko'ring
5. ✅ Tezlik oshganini his qiling 🚀

> Backend kodi (RedisModule, kesh, invalidatsiya) **allaqachon yozilgan** — siz faqat
> yuqoridagi 5 qadamni bajarasiz.
