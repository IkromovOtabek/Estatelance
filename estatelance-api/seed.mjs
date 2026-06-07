import { MongoClient, ObjectId } from 'mongodb';

const CONN = 'mongodb+srv://Owen:6NxAfaczdNYWPKNu@owen.wkad1hh.mongodb.net/Freelance';

const agents = [
  { id: new ObjectId('6a19f288fe57287d83e39bf8'), name: '3242' },
  { id: new ObjectId('6a1a4d14fe57287d83e3f309'), name: 'Ibrohimov' },
  { id: new ObjectId('6a1d1c51a02521dfa4035735'), name: 'MukhammadUmar' },
];

const categories = [
  'VISUALS', 'STAGING', 'MARKETING', 'LEGAL', 'RENDERING',
  'DESIGN', 'REPAIR', 'CLEANING', 'INSPECTION', 'IT',
  'TRANSLATION', 'MOVING', 'ACCOUNTING', 'SECURITY', 'OTHER',
];

const jobsData = [
  {
    title: "Ko'chmas mulk fotografiyasi uchun professional fotograf kerak",
    description: "Toshkentdagi yangi qurilgan 3 xonali kvartira uchun sifatli fotosurat va video materiallar tayyorlash kerak. Tajribali fotograf bo'lishi shart, qurilma o'zida bo'lishi kerak. Ish 1 kun davomida bajarilishi kerak.",
    category: 'VISUALS',
    budget: 500,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['ONSITE'],
    requiredSkills: ['Fotografiya', 'Videografiya', 'Adobe Lightroom', 'Dron uchirish'],
  },
  {
    title: "Kvartira dizayni va interyer loyihasi",
    description: "Chilonzor tumanidagi 2 xonali kvartira uchun zamonaviy interyer dizayn loyihasi ishlab chiqish talab etiladi. 3D vizualizatsiya majburiy. Mijoz talablarini inobatga olgan holda ishlash kerak.",
    category: 'DESIGN',
    budget: 2500,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['REMOTE'],
    requiredSkills: ['AutoCAD', '3ds Max', 'SketchUp', 'Interior Design'],
  },
  {
    title: "Uy ta'mirlash va pardoz ishlari ustasi",
    description: "Yunusobod tumanidagi 4 xonali uyni to'liq ta'mirlash kerak. Devorlarni bo'yash, pol yotqizish va santexnika ishlari kiradi. Materiallar buyurtmachi tomonidan ta'minlanadi.",
    category: 'REPAIR',
    budget: 5000,
    experienceLevel: 'JUNIOR',
    jobType: 'TEMPORARY',
    workFormat: ['ONSITE'],
    requiredSkills: ['Qurilish', 'Santexnika', 'Elektrik', 'Dekor'],
  },
  {
    title: "Ko'chmas mulk marketing kampaniyasi",
    description: "Yangi qurilayotgan turar-joy kompleksi uchun to'liq marketing strategiyasi va reklama kampaniyasi tayyorlash. Ijtimoiy tarmoqlar, kontekst reklama va oflayn materiallar kiritilishi kerak. SMM tajribasi majburiy.",
    category: 'MARKETING',
    budget: 1200,
    experienceLevel: 'SENIOR',
    jobType: 'PERMANENT',
    workFormat: ['REMOTE'],
    requiredSkills: ['SMM', 'Google Ads', 'Copywriting', 'Targetolog'],
  },
  {
    title: "Uy-joy sotib olish uchun yuridik yordam",
    description: "Toshkentda kvartira sotib olish jarayonida yuridik maslahat va hujjatlarni rasmiylashtirish kerak. Mulk tekshiruvi, shartnoma tuzish va ro'yxatdan o'tkazish xizmatlari talab etiladi. Tajribali huquqshunos zarur.",
    category: 'LEGAL',
    budget: 800,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['HYBRID'],
    requiredSkills: ['Huquq', 'Ko\'chmas mulk qonuni', 'Notariat', 'Arbitraj'],
  },
  {
    title: "Bino 3D rendering va animatsiya",
    description: "12 qavatli turar-joy binosi uchun fotorealistik 3D rendering va qisqa animatsion video tayyorlash. Arxitektura loyihasi asosida ishlash. Yuqori sifatli chiqish formati talab etiladi.",
    category: 'RENDERING',
    budget: 3000,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['REMOTE'],
    requiredSkills: ['3ds Max', 'V-Ray', 'Corona Renderer', 'After Effects'],
  },
  {
    title: "Ofis binosi tozalash xizmati",
    description: "Isiqlol ko'chasidagi 5 qavatli ofis binosini har kuni tozalash kerak. Kunduzgi va kechki smenada ishlash imkoniyati mavjud. Maxsus tozalash jihozlari bilan ishlash tajribasi kerak.",
    category: 'CLEANING',
    budget: 400,
    experienceLevel: 'NONE',
    jobType: 'PERMANENT',
    workFormat: ['ONSITE'],
    requiredSkills: ['Tozalash', 'Dezinfeksiya', 'Industrial tozalash'],
  },
  {
    title: "Ko'chmas mulk saytini yaratish",
    description: "Rieltorlik kompaniyasi uchun zamonaviy va tez ishlaydigan web-sayt yaratish kerak. Mulk joylash, qidirish filtri va admin panel bo'lishi shart. React va Node.js bilan ishlash tajribasi talab etiladi.",
    category: 'IT',
    budget: 4500,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['REMOTE'],
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'UI/UX Design'],
  },
  {
    title: "Mulk tekshiruvi va baholash xizmati",
    description: "Mirzo Ulug'bek tumanidagi 3 ta tijorat ob'ektini texnik va huquqiy tekshiruvdan o'tkazish kerak. Bino holati, kommunikatsiyalar va hujjatlar to'liqligi baholanadi. Sertifikatlangan mutaxassis zarur.",
    category: 'INSPECTION',
    budget: 900,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['ONSITE'],
    requiredSkills: ['Baholash', 'Texnik ekspertiza', 'Inspektor', 'Sertifikat'],
  },
  {
    title: "Inshootlar ko'chirish va logistika",
    description: "Yunusoboddan Sergeli tumaniga 3 xonali kvartiradan barcha jihozlarni ko'chirish kerak. Yuk mashinasi va yordamchilar bilan kelish talab etiladi. Nozik jihozlarni ehtiyotkorlik bilan ko'chirish shart.",
    category: 'MOVING',
    budget: 600,
    experienceLevel: 'NONE',
    jobType: 'TEMPORARY',
    workFormat: ['ONSITE'],
    requiredSkills: ['Ko\'chirish', 'Logistika', 'Yuk tashish', 'Qadoqlash'],
  },
  {
    title: "Rieltorlik buxgalteriyasi va hisobot",
    description: "Ko'chmas mulk kompaniyasi uchun oylik moliyaviy hisobotlar tuzish va soliq deklaratsiyalari topshirish kerak. 1C buxgalteriya dasturi bilan ishlash majburiy. Tajriba kamida 3 yil.",
    category: 'ACCOUNTING',
    budget: 1500,
    experienceLevel: 'SENIOR',
    jobType: 'PERMANENT',
    workFormat: ['HYBRID'],
    requiredSkills: ['Buxgalteriya', '1C', 'Soliq hisobi', 'Moliyaviy tahlil'],
  },
  {
    title: "Turar-joy kompleksi xavfsizlik xizmati",
    description: "Yangi qurilgan 200 xonadonli turar-joy kompleksi uchun 24 soatlik xavfsizlik xizmati tashkil etish kerak. 4 ta xavfsizlikchi va CCTV monitoring kerak. Harbiy yoki politsiya tajribasi afzal.",
    category: 'SECURITY',
    budget: 2000,
    experienceLevel: 'JUNIOR',
    jobType: 'PERMANENT',
    workFormat: ['ONSITE'],
    requiredSkills: ['Xavfsizlik', 'CCTV', 'Qo\'riqlash', 'First Aid'],
  },
  {
    title: "Mulk savdosi uchun inglizcha tarjima",
    description: "Ko'chmas mulk shartnomalarini va hujjatlarini o'zbek va ingliz tillariga tarjima qilish kerak. Huquqiy terminologiyani bilish shart. 10 ta hujjat, har biri 5-10 sahifa.",
    category: 'TRANSLATION',
    budget: 350,
    experienceLevel: 'JUNIOR',
    jobType: 'TEMPORARY',
    workFormat: ['REMOTE'],
    requiredSkills: ['Tarjima', 'Ingliz tili', 'Huquqiy tarjima', 'O\'zbek tili'],
  },
  {
    title: "Virtual staging - uy uchun virtual mebellash",
    description: "Bo'sh kvartiraning fotosuratlari uchun virtual mebellash va interyer dizayn qo'shish kerak. 8 ta xona uchun turli dizayn variantlari tayyorlanadi. Photoshop va 3D staging dasturlari bilan ishlash talab etiladi.",
    category: 'STAGING',
    budget: 700,
    experienceLevel: 'JUNIOR',
    jobType: 'TEMPORARY',
    workFormat: ['REMOTE'],
    requiredSkills: ['Virtual Staging', 'Photoshop', '3D Design', 'Interyer dizayn'],
  },
  {
    title: "Ko'chmas mulk mobil ilovasi uchun UI/UX dizayn",
    description: "Rieltorlik platformasi uchun iOS va Android mobil ilovasi dizaynini yaratish kerak. Foydalanuvchi interfeysi qulay va zamonaviy bo'lishi shart. Figma yoki Adobe XD bilan prototip tayyorlash kerak.",
    category: 'OTHER',
    budget: 1800,
    experienceLevel: 'SENIOR',
    jobType: 'TEMPORARY',
    workFormat: ['REMOTE'],
    requiredSkills: ['Figma', 'UI/UX', 'Mobile Design', 'Prototiplash'],
  },
];

const postsData = [
  {
    title: "Toshkentda ko'chmas mulk narxlari 2026 yilda",
    body: `2026 yilda Toshkent shahridagi ko'chmas mulk bozori keskin o'zgarishlarga duchor bo'ldi. Yangi qurilish loyihalari soni ortishi bilan birga, xonadon narxlari ham o'sishda davom etmoqda.

Ayniqsa Yunusobod va Mirzo Ulug'bek tumanlarida yangi turar-joy komplekslari faol qurilmoqda. Mutaxassislar fikricha, kelgusi 2 yilda narxlar yana 15-20% ga oshishi kutilmoqda.

Ko'chmas mulk bozorida muvaffaqiyatli ishlash uchun bozor tendentsiyalarini kuzatib borish va professional maslahatchilardan foydalanish muhim ahamiyat kasb etadi.`,
    authorId: '6a19f288fe57287d83e39bf8',
    authorName: '3242',
    authorAvatar: null,
  },
  {
    title: "Frilanser rieltorlar uchun maslahatlar",
    body: `Ko'chmas mulk sohasida frilanser sifatida ishlash juda ko'p imkoniyatlar beradi, lekin bir qator qiyinchiliklarni ham o'z ichiga oladi. Mustaqil rieltor bo'lish uchun quyidagi omillarni hisobga olish kerak.

Birinchidan, mijozlar baza shakllantirish muhim. Har bir muvaffaqiyatli bitimdan keyin mijoz tavsiyasi so'rang va ijobiy sharh qoldirish uchun undang. Ikkinchidan, digital marketing ko'nikmalarini rivojlantiring — ijtimoiy tarmoqlardagi faollik yangi mijozlar jalb qilishda muhim rol o'ynaydi.

Uchinchidan, BuFu kabi platformalar orqali ish qidiring va o'z portfoliongizni muntazam yangilab boring.`,
    authorId: '6a1a4d14fe57287d83e3f309',
    authorName: 'Ibrohimov',
    authorAvatar: null,
  },
  {
    title: "Uy sotib olishdan oldin bilish kerak bo'lgan 10 ta narsa",
    body: `Ko'chmas mulk sotib olish hayotdagi eng katta moliyaviy qarorlardan biri hisoblanadi. Shu sababli bu jarayonga puxta tayyorgarlik ko'rish zarur.

Birinchi qadam - byudjetni aniq belgilash. Nafaqat xarid narxini, balki ta'mirlash, kommunal xizmatlar va soliqlarni ham hisobga oling. Ikkinchi qadam - joylashuvni diqqat bilan o'rganish: maktablar, shifoxonalar, transport va do'konlarga yaqinlik muhim.

Huquqiy jihatdan tozalikni tekshirish uchun tajribali huquqshunos yollang. Binoning texnik holatini baholash uchun esa mustaqil ekspertdan foydalaning.`,
    authorId: '6a1d1c51a02521dfa4035735',
    authorName: 'MukhammadUmar',
    authorAvatar: null,
  },
  {
    title: "Ko'chmas mulk fotografiyasi: professional natijaga erishish sirlari",
    body: `Mulk fotografiyasi ko'chmas mulk sotuvi yoki ijarasi uchun hal qiluvchi ahamiyatga ega. Yaxshi fotosurat potentsial xaridorlar yoki ijarachilarda kuchli taassurot qoldiradi.

Eng avvalo, tabiy yorug'likdan maksimal darajada foydalaning — kunduzgi vaqtda suratga olish eng yaxshi natija beradi. Xonalarni suratga olishdan oldin ularni tartibga keltiring va keraksiz buyumlarni olib qo'ying.

Keng burchak linzali kamera (14-24mm) xonalarni kengroq ko'rsatishga yordam beradi. Post-processing uchun Adobe Lightroom yoki Capture One dasturlaridan foydalaning.`,
    authorId: '6a19f288fe57287d83e39bf8',
    authorName: '3242',
    authorAvatar: null,
  },
  {
    title: "Ko'chmas mulk bozorida raqamli texnologiyalar",
    body: `Zamonaviy ko'chmas mulk bozori raqamli texnologiyalar bilan tobora uyg'unlashib bormoqda. Virtual tur, sun'iy intellekt asosida narx baholash va blockchain texnologiyasi soha uchun yangi imkoniyatlar yaratmoqda.

Virtual tur xizmati pandemiyadan keyingi davrda keng tarqaldi va hozir xaridorlar uchun standart talabga aylandi. AI-asosida narx baholash tizimlari bozor ma'lumotlarini tahlil qilib, aniqroq narx takliflarini berishi mumkin.

O'zbekistonda ham bu tendentsiyalar asta-sekin kirib kelmoqda va yaqin kelajakda bu texnologiyalar mahalliy bozorni tubdan o'zgartirishi kutilmoqda.`,
    authorId: '6a1a4d14fe57287d83e3f309',
    authorName: 'Ibrohimov',
    authorAvatar: null,
  },
  {
    title: "Ijaraga uy topish: yangi boshlovchilar uchun qo'llanma",
    body: `Uy ijarasi bo'yicha shartnoma tuzishdan avval bir necha muhim narsalarni tekshiring. Mulk egasining hujjatlari, kommunal to'lovlarning holati va qo'shnilar bilan munosabatlarni bilish muhim.

Shartnomani imzolashdan oldin huquqshunos yoki tajribali rieltor bilan maslahatlashing. Shartnomada ijara muddati, to'lov tartibi va kommunal xizmatlar kim tomonidan to'lanishi aniq ko'rsatilishi shart.

Ko'chirishdan oldin uy holatini rasmga olib qo'ying — bu kelajakdagi kelishmovchiliklarni oldini oladi.`,
    authorId: '6a1d1c51a02521dfa4035735',
    authorName: 'MukhammadUmar',
    authorAvatar: null,
  },
  {
    title: "Investitsiya uchun ko'chmas mulk tanlash mezonlari",
    body: `Ko'chmas mulkka investitsiya qilish uzoq muddatli boylik saqlash va oshirishning eng ishonchli usullaridan biri hisoblanadi. Biroq to'g'ri ob'ektni tanlash uchun bir qator omillarni hisobga olish kerak.

Joylashuv eng muhim mezon hisoblanadi — transport tugunlariga yaqin, rivojlanayotgan rayonlardagi mulklar narxi tezroq oshadi. Infrastruktura rivojlanishi rejalari, yangi metro liniyalari va savdo markazlari qurilishi joylashuvni baholashda muhim ko'rsatkich.

Daromadlilik koeffitsientini (yield) hisoblashda yillik ijara daromadini mulk narxiga bo'ling. 6-8% dan yuqori yield yaxshi investitsiya hisoblanadi.`,
    authorId: '6a19f288fe57287d83e39bf8',
    authorName: '3242',
    authorAvatar: null,
  },
  {
    title: "Ko'chmas mulk rieltori: kasb va uning imkoniyatlari",
    body: `Rieltor kasbi O'zbekistonda tobora ommalashib bormoqda. Malakali rieltor yiliga 50-150 million so'm va undan ko'proq daromad olishi mumkin. Biroq bu kasbda muvaffaqiyatga erishish uchun ko'p mehnat va ko'nikmalar zarur.

Muvaffaqiyatli rieltor bo'lish uchun kommunikatsiya mahorati, bozor bilimi va huquqiy savodxonlik muhim. Yangi boshlovchilar uchun tajribali mentordan o'rganish eng samarali yo'l.

BuFu platformasi rieltorlar va frilanserlarni bog'lash uchun eng qulay muhit yaratgan. Bu yerda siz o'z ko'nikmalaringizni sotishingiz va yangi ish topishingiz mumkin.`,
    authorId: '6a1a4d14fe57287d83e3f309',
    authorName: 'Ibrohimov',
    authorAvatar: null,
  },
];

async function main() {
  const client = new MongoClient(CONN);
  await client.connect();
  console.log('Connected to MongoDB');
  const db = client.db('Freelance');

  // Seed jobs
  const now = new Date();
  const jobs = jobsData.map((j, i) => {
    const agent = agents[i % agents.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000);
    return {
      _id: new ObjectId(),
      ...j,
      propertyType: 'OTHER',
      status: 'OPEN',
      agentId: agent.id.toString(),
      agentName: agent.name,
      bidCount: Math.floor(Math.random() * 9),
      viewCount: Math.floor(Math.random() * 51),
      viewedBy: [],
      createdAt,
      updatedAt: createdAt,
    };
  });

  const jobResult = await db.collection('jobs').insertMany(jobs);
  console.log(`Inserted ${jobResult.insertedCount} jobs`);

  // Seed posts
  const posts = postsData.map((p, i) => {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000);
    return {
      _id: new ObjectId(),
      authorId: p.authorId,
      authorName: p.authorName,
      authorAvatar: p.authorAvatar,
      title: p.title,
      body: p.body,
      likedByUserIds: [],
      likeCount: Math.floor(Math.random() * 15),
      viewCount: Math.floor(Math.random() * 100),
      comments: [],
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    };
  });

  const postResult = await db.collection('posts').insertMany(posts);
  console.log(`Inserted ${postResult.insertedCount} posts`);

  await client.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
