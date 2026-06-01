import { MongoClient, ObjectId } from 'mongodb';

const URI = 'mongodb+srv://Owen:6NxAfaczdNYWPKNu@owen.wkad1hh.mongodb.net/Freelance';

const AGENTS = [
  { id: '6a19f288fe57287d83e39bf8', name: 'Otabek Ikromov' },
  { id: '6a1a4d14fe57287d83e3f309', name: 'Ibrohimov Sardor' },
  { id: '6a1d1c51a02521dfa4035735', name: 'MukhammadUmar' },
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

const JOBS_BY_CATEGORY = {
  VISUALS: [
    { title: "Ko'chmas mulk uchun professional fotosurat olish", skills: ['Lightroom', 'Adobe Photoshop', 'Drone'], budget: 800000, salaryFrom: 600000, salaryTo: 1200000 },
    { title: "Yangi qurilgan uy uchun dron video olish", skills: ['DJI Drone', 'Premiere Pro', 'Color Grading'], budget: 1500000, salaryFrom: 1000000, salaryTo: 2000000 },
    { title: "Apartament interyeri uchun HDR fotosurat", skills: ['HDR Photography', 'Lightroom', 'Photoshop'], budget: 600000, salaryFrom: 500000, salaryTo: 900000 },
    { title: "3 xonali kvartira video turini yaratish", skills: ['Video Editing', 'Premiere Pro', 'After Effects'], budget: 1200000, salaryFrom: 800000, salaryTo: 1500000 },
    { title: "Tijoriy bino uchun professional foto va video", skills: ['Commercial Photography', 'Video Production'], budget: 2500000, salaryFrom: 2000000, salaryTo: 3500000 },
    { title: "Yangi mahalla uchun havo fotografiyasi", skills: ['Drone Pilot', 'Aerial Photography', 'Photoshop'], budget: 1800000, salaryFrom: 1500000, salaryTo: 2500000 },
    { title: "Kottej uchun 360° virtual tur yaratish", skills: ['360 Photography', 'Matterport', 'VR'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
  ],
  STAGING: [
    { title: "Bo'sh kvartira uchun virtual staging xizmati", skills: ['Virtual Staging', '3ds Max', 'Photoshop'], budget: 1000000, salaryFrom: 800000, salaryTo: 1500000 },
    { title: "4 xonali uy uchun virtual mebel joylash", skills: ['AutoCAD', 'Revit', 'Virtual Staging'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Ofis binosi uchun virtual staging loyihasi", skills: ['SketchUp', 'V-Ray', 'Photoshop'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Yangi qurilish uchun show-room virtual dizayn", skills: ['3ds Max', 'Corona Renderer', 'AutoCAD'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Penthouse uchun lux virtual staging", skills: ['Virtual Staging', 'Luxury Design', 'Photoshop'], budget: 2500000, salaryFrom: 2000000, salaryTo: 3500000 },
    { title: "Ikki qavatli uy uchun virtual intereryi dizayn", skills: ['3ds Max', 'AutoCAD', 'V-Ray'], budget: 1800000, salaryFrom: 1500000, salaryTo: 2500000 },
    { title: "Restoran binosi uchun virtual bezatish loyihasi", skills: ['SketchUp', 'Photoshop', '3D Modeling'], budget: 2200000, salaryFrom: 1800000, salaryTo: 3000000 },
  ],
  MARKETING: [
    { title: "Ko'chmas mulk agentligi uchun SMM mutaxassisi", skills: ['Instagram', 'Facebook Ads', 'Canva'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Yangi loyiha uchun kontent-menejeri kerak", skills: ['Copywriting', 'Instagram', 'Telegram'], budget: 1200000, salaryFrom: 1000000, salaryTo: 1800000 },
    { title: "Rieltorlik kompaniyasi uchun targetolog", skills: ['Facebook Ads', 'Google Ads', 'Analytics'], budget: 2000000, salaryFrom: 1500000, salaryTo: 2500000 },
    { title: "YouTube kanal uchun video montaj va kontent", skills: ['Premiere Pro', 'After Effects', 'YouTube SEO'], budget: 1800000, salaryFrom: 1500000, salaryTo: 2500000 },
    { title: "Telegram kanal uchun kontent yaratuvchi", skills: ['Copywriting', 'Canva', 'Telegram'], budget: 900000, salaryFrom: 700000, salaryTo: 1300000 },
    { title: "Ko'chmas mulk uchun Google Ads kampaniya", skills: ['Google Ads', 'SEO', 'Analytics'], budget: 2500000, salaryFrom: 2000000, salaryTo: 3500000 },
    { title: "Qurilish kompaniyasi uchun PR va reklama mutaxassisi", skills: ['PR', 'Media Relations', 'Copywriting'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
  ],
  LEGAL: [
    { title: "Kvartira sotib olish uchun yuridik maslahat", skills: ['Mulk huquqi', 'Shartnoma', 'Notariat'], budget: 500000, salaryFrom: 400000, salaryTo: 800000 },
    { title: "Kadastr ro'yxatga olish bo'yicha yordam", skills: ['Kadastr', 'Yer kadastri', 'Hujjatlar'], budget: 700000, salaryFrom: 500000, salaryTo: 1000000 },
    { title: "Ko'chmas mulk savdosi uchun huquqshunos kerak", skills: ['Mulk huquqi', 'Soliq', 'Shartnoma'], budget: 800000, salaryFrom: 600000, salaryTo: 1200000 },
    { title: "Meros mulkini rasmiylashtirish uchun advokat", skills: ['Meros huquqi', 'Sud ishi', 'Notariat'], budget: 1500000, salaryFrom: 1000000, salaryTo: 2000000 },
    { title: "Ijarachilar uchun ijara shartnomasi tuzish", skills: ['Ijara huquqi', 'Shartnoma', 'Hujjatlar'], budget: 300000, salaryFrom: 200000, salaryTo: 500000 },
    { title: "Yangi qurilish loyihasi uchun yuridik audit", skills: ['Qurilish huquqi', 'Audit', 'Ruxsatnomalar'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Ipoteka olish uchun bank bilan muzokara", skills: ['Bank huquqi', 'Ipoteka', 'Moliya'], budget: 600000, salaryFrom: 400000, salaryTo: 900000 },
  ],
  RENDERING: [
    { title: "Zamonaviy kvartira uchun 3D vizualizatsiya", skills: ['3ds Max', 'V-Ray', 'Photoshop'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "10 qavatli turar-joy kompleksi 3D render", skills: ['3ds Max', 'Corona Renderer', 'AutoCAD'], budget: 5000000, salaryFrom: 4000000, salaryTo: 7000000 },
    { title: "Interyer dizayn uchun fotorealistik render", skills: ['3ds Max', 'V-Ray', 'Unreal Engine'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Ofis binosi uchun arxitektura render", skills: ['Revit', 'Lumion', 'Photoshop'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Villa uchun tashqi ko'rinish 3D render", skills: ['SketchUp', 'V-Ray', '3ds Max'], budget: 2500000, salaryFrom: 2000000, salaryTo: 3500000 },
    { title: "Mahalla va ko'cha landshaft render loyihasi", skills: ['Lumion', 'AutoCAD', 'Photoshop'], budget: 4000000, salaryFrom: 3000000, salaryTo: 5000000 },
    { title: "Savdo markazi uchun animatsiyali 3D video", skills: ['3ds Max', 'After Effects', 'Animation'], budget: 6000000, salaryFrom: 5000000, salaryTo: 8000000 },
  ],
  DESIGN: [
    { title: "3 xonali kvartira uchun interyer dizayn loyihasi", skills: ['AutoCAD', 'SketchUp', '3ds Max'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Restoran interyer dizayneri kerak", skills: ['Interior Design', 'SketchUp', 'Photoshop'], budget: 4000000, salaryFrom: 3000000, salaryTo: 5000000 },
    { title: "Ofis dizayni va rejalash xizmati", skills: ['AutoCAD', 'Revit', 'Office Design'], budget: 3500000, salaryFrom: 3000000, salaryTo: 5000000 },
    { title: "Yangi uy uchun mebel va dizayn tanlash", skills: ['Interior Design', 'Furniture Selection', 'Canva'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Bolalar xonasi dizayni va pardoz", skills: ['Interior Design', 'Color Theory', 'Kids Design'], budget: 1200000, salaryFrom: 1000000, salaryTo: 1800000 },
    { title: "Hammom va oshxona zamonaviy dizayn", skills: ['Kitchen Design', 'Bathroom Design', 'AutoCAD'], budget: 2500000, salaryFrom: 2000000, salaryTo: 3500000 },
    { title: "Boutique mehmonxona interyer dizayni", skills: ['Hotel Design', '3ds Max', 'AutoCAD'], budget: 8000000, salaryFrom: 6000000, salaryTo: 10000000 },
  ],
  REPAIR: [
    { title: "2 xonali kvartira kapital ta'miri kerak", skills: ['Gipsokartun', 'Bo\'yoq', 'Plitka'], budget: 15000000, salaryFrom: 12000000, salaryTo: 20000000 },
    { title: "Oshxona va hammom ta'mirlash ishlari", skills: ['Santexnika', 'Plitka', 'Elektrik'], budget: 8000000, salaryFrom: 6000000, salaryTo: 10000000 },
    { title: "Ofis ta'mirlash va pardozlash ishlari", skills: ['Gipsokartun', 'Bo\'yoq', 'Pol yotqizish'], budget: 20000000, salaryFrom: 15000000, salaryTo: 25000000 },
    { title: "Devor va shiftni bo\'yaydigan usta kerak", skills: ['Bo\'yoq', 'Gruntlash', 'Shpaklyovka'], budget: 3000000, salaryFrom: 2000000, salaryTo: 4000000 },
    { title: "Santexnika ta'mirlash va almashtirish", skills: ['Santexnika', 'Quvur', 'Smesitel'], budget: 1500000, salaryFrom: 1000000, salaryTo: 2000000 },
    { title: "Elektr tizimini yangilash va ta\'mirlash", skills: ['Elektrik', 'Kabel', 'Schetchik'], budget: 5000000, salaryFrom: 4000000, salaryTo: 7000000 },
    { title: "Parket va laminat yotqizish usta kerak", skills: ['Parket', 'Laminat', 'Pol ishları'], budget: 4000000, salaryFrom: 3000000, salaryTo: 5000000 },
  ],
  CLEANING: [
    { title: "Yangi ta'mirdan chiqqan kvartira tozalash", skills: ['Tozalash', 'Kimyoviy vositalar', 'Pollarni tozalash'], budget: 500000, salaryFrom: 400000, salaryTo: 700000 },
    { title: "Ofis binosi kunlik tozalash xizmati", skills: ['Ofis tozalash', 'Sanitariya', 'Yuvinish'], budget: 1200000, salaryFrom: 1000000, salaryTo: 1500000 },
    { title: "Gilam va mebel tozalash (kimyoviy usul)", skills: ['Gilam tozalash', 'Ximchistka', 'Bug\' bilan tozalash'], budget: 800000, salaryFrom: 600000, salaryTo: 1000000 },
    { title: "Restoran oshxonasi professional tozalash", skills: ['Oshxona tozalash', 'Dezinfeksiya', 'HACCP'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Deraza va oyna tozalash (balandlik)", skills: ['Deraza tozalash', 'Alpinizm', 'Industrial'], budget: 1000000, salaryFrom: 800000, salaryTo: 1500000 },
    { title: "Ko'chib kelgandan keyin uy tozalash xizmati", skills: ['Tozalash', 'Tartibga solish', 'Dezinfeksiya'], budget: 600000, salaryFrom: 500000, salaryTo: 800000 },
    { title: "Mehmonxona xonalari tozalash xizmati", skills: ['Mehmonxona tozalash', 'Linenlar', 'Sanitariya'], budget: 2000000, salaryFrom: 1500000, salaryTo: 2500000 },
  ],
  INSPECTION: [
    { title: "Kvartira sotib olishdan oldin texnik ko'rik", skills: ['Qurilish ko\'rigi', 'Defekt akti', 'Ekspertiza'], budget: 500000, salaryFrom: 400000, salaryTo: 700000 },
    { title: "Yangi qurilish sifatini tekshirish", skills: ['Qurilish nazorati', 'SNiP', 'Ekspertiza'], budget: 1000000, salaryFrom: 800000, salaryTo: 1500000 },
    { title: "Elektr va santexnika tizimlarini tekshirish", skills: ['Elektrik audit', 'Santexnika ko\'rigi', 'Hujjatlar'], budget: 600000, salaryFrom: 500000, salaryTo: 900000 },
    { title: "Bino konstruktsiyasi mustahkamligini baholash", skills: ['Konstruktsiya', 'Hisob-kitob', 'Ekspertiza'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Ijara uyini qabul qilishdan oldin ko'rik", skills: ['Mulk ko\'rigi', 'Defekt akti', 'Hisobot'], budget: 300000, salaryFrom: 200000, salaryTo: 500000 },
    { title: "Savdo binosi davlat ekspertizasi uchun yordam", skills: ['Davlat ekspertizasi', 'Hujjatlar', 'SNiP'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Ko'p qavatli uydagi kvartira deffekt tekshirish", skills: ['Defektoskopiya', 'Qurilish norma', 'Hisobot'], budget: 400000, salaryFrom: 300000, salaryTo: 600000 },
  ],
  IT: [
    { title: "Ko'chmas mulk agentligi uchun veb-sayt yaratish", skills: ['React', 'Next.js', 'Node.js'], budget: 5000000, salaryFrom: 4000000, salaryTo: 7000000 },
    { title: "Uy sotish uchun mobil ilova (iOS/Android)", skills: ['Flutter', 'React Native', 'Firebase'], budget: 8000000, salaryFrom: 6000000, salaryTo: 12000000 },
    { title: "CRM tizimi integratsiyasi va sozlash", skills: ['CRM', 'API', 'Python'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Ko'chmas mulk e-katalog platformasi yaratish", skills: ['React', 'PostgreSQL', 'REST API'], budget: 10000000, salaryFrom: 8000000, salaryTo: 15000000 },
    { title: "Telegram bot yaratish (avtomatik e'lon)", skills: ['Python', 'Telegram Bot API', 'MongoDB'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Server sozlash va hosting xizmati", skills: ['Linux', 'Nginx', 'Docker'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Ko'chmas mulk platformasi uchun UI/UX dizayn", skills: ['Figma', 'UI/UX', 'Prototyping'], budget: 3500000, salaryFrom: 3000000, salaryTo: 5000000 },
  ],
  TRANSLATION: [
    { title: "Rus tilidan o'zbekchaga tarjima (shartnoma)", skills: ['Rus tili', "O'zbek tili", 'Yuridik tarjima'], budget: 300000, salaryFrom: 200000, salaryTo: 500000 },
    { title: "Ingliz tilidagi loyiha hujjatlarini tarjima qilish", skills: ['Ingliz tili', 'Texnik tarjima', 'CAT tools'], budget: 500000, salaryFrom: 400000, salaryTo: 800000 },
    { title: "Koreyscha veb-sayt kontent tarjimasi", skills: ['Koreys tili', 'Lokalizatsiya', 'CMS'], budget: 800000, salaryFrom: 600000, salaryTo: 1200000 },
    { title: "Notarial tarjima xizmati (barcha tillar)", skills: ['Notarial tarjima', 'Apostil', 'Legalizatsiya'], budget: 400000, salaryFrom: 300000, salaryTo: 600000 },
    { title: "Qurilish texnik hujjatlarini tarjima qilish", skills: ['Texnik tarjima', 'Rus tili', 'Ingliz tili'], budget: 600000, salaryFrom: 500000, salaryTo: 900000 },
    { title: "Investitsiya taqdimotini inglizchaga tarjima", skills: ['Biznes tarjima', 'Ingliz tili', 'Taqdimot'], budget: 700000, salaryFrom: 500000, salaryTo: 1000000 },
    { title: "Veb-sayt va ilova interfeysi lokalizatsiyasi", skills: ['Lokalizatsiya', 'i18n', 'UI tarjima'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
  ],
  MOVING: [
    { title: "2 xonali kvartiradan ko'chirish xizmati (Toshkent)", skills: ['Yuk mashina', 'Qadoqlash', 'Yuk ko\'tarish'], budget: 800000, salaryFrom: 600000, salaryTo: 1200000 },
    { title: "Ofis ko'chirish va jihozlarni tashish", skills: ['Ofis ko\'chirish', 'Mebel disassemble', 'Yuk'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Og'ir mebel va texnika ko'tarish va tashish", skills: ['Yuk ko\'tarish', 'Liftman', 'Vagon'], budget: 500000, salaryFrom: 400000, salaryTo: 700000 },
    { title: "Shaharlararo ko'chirish xizmati (Toshkent-Samarqand)", skills: ['Yuk mashina', 'Uzoq masofa', 'GPS tracking'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Piano va og'ir mebel ko'chirish mutaxassisi", skills: ['Piano ko\'chirish', 'Og\'ir yuk', 'Sug\'urta'], budget: 1000000, salaryFrom: 800000, salaryTo: 1500000 },
    { title: "Anbar va omborxona uchun yuk tashish", skills: ['Logistika', 'Forklift', 'Omborxona'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Qadoqlash va ko'chirish to'liq xizmati", skills: ['Qadoqlash', 'Ko\'chirish', 'Sug\'urta'], budget: 1200000, salaryFrom: 1000000, salaryTo: 1800000 },
  ],
  ACCOUNTING: [
    { title: "Qurilish kompaniyasi uchun buxgalter kerak", skills: ['1C', 'Soliq hisobi', 'IFRS'], budget: 2000000, salaryFrom: 1800000, salaryTo: 2500000 },
    { title: "Ko'chmas mulk agenligida moliyaviy hisobot", skills: ['Excel', '1C', 'Soliq hisobi'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Yillik moliyaviy audit xizmati", skills: ['Audit', 'IFRS', 'Moliyaviy tahlil'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Soliq deklaratsiyasini to\'ldirish yordam", skills: ['Soliq', 'DDS', 'Deklaratsiya'], budget: 500000, salaryFrom: 400000, salaryTo: 700000 },
    { title: "Startup uchun moliyaviy model yaratish", skills: ['Moliyaviy modellash', 'Excel', 'Biznes-plan'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Ipoteka va kredit hisob-kitoblarini tahlil qilish", skills: ['Kredit tahlili', 'Excel', 'Ipoteka'], budget: 800000, salaryFrom: 600000, salaryTo: 1200000 },
    { title: "Rieltorlik faoliyati uchun soliq maslahat", skills: ['Soliq', 'Rieltor soliq', 'Konsalting'], budget: 600000, salaryFrom: 500000, salaryTo: 900000 },
  ],
  SECURITY: [
    { title: "Elita turar-joy uchun qo'riqchi kerak", skills: ['Qo\'riqlash', 'CCTV', 'Xavfsizlik'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Ofis binosi xavfsizlik tizimini o'rnatish", skills: ['CCTV', 'Access Control', 'Signalizatsiya'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Kecha-kunduz qo'riqlash xizmati (posbon)", skills: ['Qo\'riqlash', 'Patrullash', 'Jismoniy xavfsizlik'], budget: 2000000, salaryFrom: 1800000, salaryTo: 2500000 },
    { title: "Yangi qurilish ob'ekti uchun xavfsizlik", skills: ['Qurilish xavfsizligi', 'Qo\'riqlash', 'CCTV'], budget: 2500000, salaryFrom: 2000000, salaryTo: 3000000 },
    { title: "IP kamera va video nazorat tizimi o'rnatish", skills: ['IP Camera', 'NVR', 'CCTV'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Avtomobil to'xtash joyi nazorat tizimi", skills: ['Parking Control', 'ANPR', 'CCTV'], budget: 4000000, salaryFrom: 3000000, salaryTo: 5000000 },
    { title: "Uy uchun smart xavfsizlik tizimi o'rnatish", skills: ['Smart Home', 'Signalizatsiya', 'IoT'], budget: 3500000, salaryFrom: 3000000, salaryTo: 5000000 },
  ],
  OTHER: [
    { title: "Ko'chmas mulk brokeri yordamchisi kerak", skills: ['Muloqot', 'Savdo', 'CRM'], budget: 1500000, salaryFrom: 1200000, salaryTo: 2000000 },
    { title: "Qurilish materiallarini yetkazib berish logistikasi", skills: ['Logistika', 'Yetkazib berish', 'Omborxona'], budget: 2000000, salaryFrom: 1500000, salaryTo: 3000000 },
    { title: "Ko'chmas mulk e'lonlari portalini boshqarish", skills: ['Kontent', 'SEO', 'Ma\'lumotlar bazasi'], budget: 1800000, salaryFrom: 1500000, salaryTo: 2500000 },
    { title: "Yangi mahalla uchun landshaft dizayn", skills: ['Landshaft', 'AutoCAD', 'O\'simliklar'], budget: 5000000, salaryFrom: 4000000, salaryTo: 7000000 },
    { title: "Uy sotib olish uchun moliyaviy maslahat", skills: ['Moliyaviy maslahat', 'Ipoteka', 'Kredit'], budget: 600000, salaryFrom: 500000, salaryTo: 900000 },
    { title: "Ko'chmas mulk kompaniyasi uchun event tashkilotchi", skills: ['Tadbirlar', 'PR', 'Tadbir menejment'], budget: 3000000, salaryFrom: 2500000, salaryTo: 4000000 },
    { title: "Rieltor uchun shaxsiy brending va vizitka dizayn", skills: ['Brending', 'Figma', 'Print dizayn'], budget: 800000, salaryFrom: 600000, salaryTo: 1200000 },
  ],
};

const LOCATIONS = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg\'ona', 'Nukus'];
const FORMATS = [['REMOTE'], ['ONSITE'], ['HYBRID']];
const EXP_LEVELS = ['NONE', 'JUNIOR', 'SENIOR'];
const JOB_TYPES = ['PERMANENT', 'TEMPORARY'];

const client = await MongoClient.connect(URI);
const db = client.db('Freelance');

const jobs = [];

for (const [category, items] of Object.entries(JOBS_BY_CATEGORY)) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const agent = AGENTS[i % AGENTS.length];
    const daysBack = randInt(1, 25);

    jobs.push({
      _id: new ObjectId(),
      title: item.title,
      description: `${item.title} bo'yicha tajribali mutaxassis kerak. Ishlar sifatli va o'z vaqtida bajarilishi shart. Batafsil ma'lumot uchun murojaat qiling.`,
      propertyType: 'OTHER',
      category,
      budget: item.budget,
      salaryFrom: item.salaryFrom,
      salaryTo: item.salaryTo,
      status: 'OPEN',
      agentId: new ObjectId(agent.id),
      agentName: agent.name,
      bidCount: randInt(0, 9),
      viewCount: randInt(5, 120),
      viewedBy: [],
      experienceLevel: rand(EXP_LEVELS),
      jobType: rand(JOB_TYPES),
      workFormat: rand(FORMATS),
      location: rand(LOCATIONS),
      requiredSkills: item.skills,
      contactPhone: null,
      createdAt: daysAgo(daysBack),
      updatedAt: daysAgo(daysBack),
    });
  }
}

await db.collection('jobs').insertMany(jobs);
console.log(`✅ ${jobs.length} ta ish muvaffaqiyatli qo'shildi!`);
console.log('Kategoriyalar:', Object.keys(JOBS_BY_CATEGORY).length);

await client.close();
