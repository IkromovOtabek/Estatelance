# Hero fon videosi (Spline export)

Bosh sahifa Hero qismi to'liq-fon video qo'llab-quvvatlaydi.
Spline'dan MP4 export qilgach, quyidagi 3 faylni shu papkaga qo'ying:

```
bufu-hero.webm         # asosiy (yengil, zamonaviy brauzerlar)
bufu-hero.mp4          # fallback (Safari / iOS)
bufu-hero-poster.jpg   # video yuklanguncha ko'rinadigan birinchi kadr
```

So'ng `pages/index.tsx` da yoqing:

```ts
const HERO_VIDEO_SRC = '/hero/bufu-hero';   // bo'sh bo'lsa — eski gradient fon
```

`HERO_VIDEO_SRC` bo'sh bo'lsa, hech narsa buzilmaydi — eski indigo gradient fon ishlaydi.

---

## Spline MP4 ni web uchun siqish (ffmpeg)

Aytaylik export `~/Downloads/spline.mp4` (masalan 10s, 1920×1080).

```bash
cd estatelance-next/public/hero

# 1) WebM (VP9) — eng yengil, asosiy
ffmpeg -i ~/Downloads/spline.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 34 \
  -vf "scale=1600:-2" -row-mt 1 bufu-hero.webm

# 2) MP4 (H.264) — Safari/iOS fallback
ffmpeg -i ~/Downloads/spline.mp4 -an -c:v libx264 -crf 28 -preset slow \
  -movflags +faststart -pix_fmt yuv420p -vf "scale=1600:-2" bufu-hero.mp4

# 3) Poster (birinchi kadr)
ffmpeg -i ~/Downloads/spline.mp4 -frames:v 1 -q:v 3 bufu-hero-poster.jpg
```

- `-an` = ovozsiz (fon videosi ovozsiz bo'lishi shart — autoplay shart).
- `crf` qiymatini oshirsangiz fayl kichrayadi (sifat pasayadi). 30-36 oralig'i hero uchun yaxshi.
- Maqsad: webm ~1-3 MB. Kerak bo'lsa `scale=1280:-2` ga tushiring.
