# Deploy qilish bo'yicha yo'riqnoma

## VPS tayyorlash (Ubuntu 22.04)

```bash
# Yangilash
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn
npm install -g yarn

# PM2
npm install -g pm2

# Nginx
sudo apt install -y nginx

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Loyihani VPS ga ko'chirish

```bash
# Git orqali
git clone https://github.com/sizning-repo/estatelance.git /var/www/estatelance
cd /var/www/estatelance

# Yoki scp orqali
scp -r ./estatelance user@vps-ip:/var/www/
```

---

## Backend sozlash

```bash
cd /var/www/estatelance/estatelance-api

# .env yaratish (development .env ni COPY qilib o'zgartiring)
cp .env .env.production

# .env.production ni tahrirlang:
nano .env.production
```

**`.env.production` da o'zgartirish kerak bo'lgan qatorlar:**
```env
NODE_ENV=production
JWT_SECRET=<yangi kuchli secret — quyidagi buyruq bilan yarating>
ALLOWED_ORIGINS=https://bufu.uz,https://www.bufu.uz
PORT=3007
```

JWT Secret yaratish:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# Paketlarni o'rnatish
yarn install --production=false

# Build
yarn build

# Production env bilan ishga tushirish (test)
NODE_ENV=production node dist/apps/estatelance-api/main.js
```

---

## Frontend sozlash

```bash
cd /var/www/estatelance/estatelance-next

# .env.production yaratish
cp .env.local .env.production.local

# O'zgartirish:
nano .env.production.local
```

**`.env.production.local` da o'zgartirish kerak:**
```env
GRAPHQL_SERVER_URL=http://127.0.0.1:3007/graphql
NEXT_PUBLIC_API_URL=https://api.bufu.uz/graphql
NEXT_PUBLIC_TELEGRAM_BOT_NAME=sizning_bot_name
```

```bash
yarn install
yarn build
```

---

## PM2 bilan ishga tushirish

```bash
cd /var/www/estatelance

# Logs papkasi
mkdir -p logs

# Ishga tushirish
pm2 start ecosystem.config.js --env production

# Server restart bo'lsa avtomatik ishga tushsin
pm2 startup
pm2 save

# Holat tekshirish
pm2 status
pm2 logs
```

---

## Nginx sozlash

```bash
# Config ko'chirish
sudo cp /var/www/estatelance/nginx.conf /etc/nginx/sites-available/estatelance

# nginx.conf da "yourdomain.com" ni haqiqiy domenga o'zgartiring
sudo nano /etc/nginx/sites-available/estatelance

# Aktivlashtirish
sudo ln -s /etc/nginx/sites-available/estatelance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL sertifikat (Let's Encrypt — bepul)
sudo certbot --nginx -d bufu.uz -d www.bufu.uz -d api.bufu.uz
```

---

## Tekshirish

```bash
# API ishlayaptimi?
curl https://api.bufu.uz/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# PM2 holati
pm2 status

# Nginx holati
sudo systemctl status nginx
```

---

## Foydali buyruqlar

```bash
pm2 restart estatelance-api   # Backend restart
pm2 restart estatelance-web   # Frontend restart
pm2 logs estatelance-api      # Backend logs
pm2 monit                     # Real-time monitoring
```
