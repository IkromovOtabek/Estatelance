import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';

// ─── Types ────────────────────────────────────────────────────────────────────
type BoostPlan = 'BASIC' | 'PRO' | 'VIP';

interface PricingPlan {
  id: BoostPlan;
  label: string;
  badge: string;
  price: number;
  days: number;
  features: { text: string; included: boolean; highlight?: boolean }[];
  popular?: boolean;
  buttonLabel: string;
  buttonStyle: 'default' | 'primary' | 'dark';
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLANS: PricingPlan[] = [
  {
    id: 'BASIC',
    label: 'BASIC',
    badge: 'Boshlang\'ich',
    price: 3,
    days: 3,
    buttonLabel: 'Basic Boost olish',
    buttonStyle: 'default',
    features: [
      { text: '3 kunlik yuqori ko\'rinish', included: true },
      { text: 'Standart boost nishoni', included: true },
      { text: 'Kunlik ustuvor bildirishnomalar', included: false },
      { text: 'VIP profil effekti', included: false },
    ],
  },
  {
    id: 'PRO',
    label: 'PRO',
    badge: 'Tezlik',
    price: 7,
    days: 7,
    popular: true,
    buttonLabel: 'Pro Boostga o\'tish',
    buttonStyle: 'primary',
    features: [
      { text: '7 kunlik premium ko\'rinish', included: true, highlight: true },
      { text: 'Kumush tasdiqlash nishoni', included: true },
      { text: 'Kunlik ustuvor bildirishnomalar', included: true },
      { text: 'VIP profil effekti', included: false },
    ],
  },
  {
    id: 'VIP',
    label: 'VIP',
    badge: 'Elite',
    price: 15,
    days: 30,
    buttonLabel: 'VIP Kirish olish',
    buttonStyle: 'dark',
    features: [
      { text: '30 kunlik global yuqori o\'rin', included: true, highlight: true },
      { text: 'Oltin VIP nishoni + Effekt', included: true },
      { text: 'Tezkor lead bildirishnomalari', included: true },
      { text: 'Bevosita qo\'llab-quvvatlash', included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: 'Profil ko\'rinishi',    free: 'Standart',      basic: 'Yuqori (Top 10%)', vip: 'Ustuvor (Top 3)' },
  { feature: 'Faollik muddati',       free: '—',             basic: '3 kun',            vip: '30 kun' },
  { feature: 'Ishonch nishoni',       free: 'Yo\'q',         basic: '"Boosted"',         vip: '"VIP Tasdiqlangan" + Effekt' },
  { feature: 'Qidiruv algoritmi',     free: 'Organik',       basic: 'Optimallashtirilgan', vip: 'Maksimal og\'irlik' },
  { feature: 'Bildirishnomalar',      free: 'Yo\'q',         basic: 'Standart',         vip: 'Tezkor + Ustuvor' },
];

const FAQS = [
  {
    question: 'O\'zbekistonda qanday to\'lov usullari qabul qilinadi?',
    answer:
      'Biz UzCard, Humo, Visa va Mastercard qabul qilamiz. Mahalliy kartalar orqali to\'lovlar joriy Markaziy bank kursida UZS\'da tezda amalga oshiriladi.',
  },
  {
    question: 'Bir nechta boostni birlashtirish mumkinmi?',
    answer:
      'Ha, ko\'rinish muddatini uzaytirish uchun boostlarni birlashtirish mumkin. Masalan, ikkita PRO boost sotib olish 14 kunlik premium ko\'rinishni ta\'minlaydi.',
  },
  {
    question: 'VIP effekti bosishlarni rostdan ko\'paytiradimi?',
    answer:
      'Ichki ma\'lumotlar shuni ko\'rsatadiki, VIP effektli profillar oddiy profillarga qaraganda vizual ko\'zga tashlanish va psixologik ishonch tufayli 4.5 baravar ko\'proq bosishlar oladi.',
  },
  {
    question: 'Boost sotib olsam qayerdan boshlanadi?',
    answer:
      '"Mening ishlarim" sahifasiga o\'ting, boost bermoqchi bo\'lgan ishingizni tanlang va "Boost" tugmasini bosing. To\'lov tasdiqlanganidan so\'ng boost darhol faollashadi.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const PricingPage = () => {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleBoost = (plan: BoostPlan) => {
    router.push(`/my-works?boost=${plan}`);
  };

  return (
    <>
      <Head>
        <title>Narxlar va Boostlar — BuFu</title>
        <meta name="description" content="BuFu platformasida o'z profilingizni yuqoriga ko'taring va ko'proq buyurtmalar oling." />
      </Head>

      <main className="bg-[#faf8ff] min-h-screen pb-24">
        {/* ── Hero ── */}
        <section className="text-center py-16 px-4 max-w-3xl mx-auto">
          <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Boost &amp; Ko'rinish
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#131b2e] leading-tight mb-4">
            Ta'siringizni <span className="text-indigo-600">Kengaytiring</span>
          </h1>
          <p className="text-lg text-[#464555] leading-relaxed">
            O'zbekistonning yetakchi frilanser platformasida ko'rinishingizni oshiring va
            yuqori darajali loyihalar yuting. O'sishingiz uchun eng to'g'ri tezlikni tanlang.
          </p>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="px-4 md:px-12 max-w-5xl mx-auto mb-20 relative">
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white border-2 border-indigo-600 shadow-[0_0_40px_-10px_rgba(79,70,229,0.3)] md:scale-105 z-10'
                    : 'bg-white/70 backdrop-blur-md border border-[#e2e8f0]/80 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                    ENG MASHHUR
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <span
                    className={`inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${
                      plan.popular
                        ? 'bg-indigo-50 text-indigo-600'
                        : plan.id === 'VIP'
                        ? 'bg-[#131b2e] text-white'
                        : 'bg-[#e2e7ff] text-[#464555]'
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <h3 className="text-2xl font-bold text-[#131b2e]">{plan.label}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-5xl font-black text-[#131b2e]">${plan.price}</span>
                    <span className="text-[#464555] text-sm">/boost</span>
                  </div>
                  <p className="text-sm text-[#777587] mt-1">{plan.days} kun davomida</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {f.included ? (
                        <span
                          className={`material-symbols-outlined text-xl flex-shrink-0 ${
                            plan.id === 'VIP' ? 'text-violet-600' : 'text-indigo-600'
                          }`}
                          style={f.highlight ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {f.highlight ? 'stars' : 'check_circle'}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xl flex-shrink-0 text-[#777587]">
                          remove_circle_outline
                        </span>
                      )}
                      <span
                        className={`text-sm ${
                          f.included
                            ? f.highlight
                              ? 'font-semibold text-[#131b2e]'
                              : 'text-[#131b2e]'
                            : 'text-[#464555]/60'
                        }`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleBoost(plan.id)}
                  className={`w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                    plan.buttonStyle === 'primary'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                      : plan.buttonStyle === 'dark'
                      ? 'bg-[#131b2e] text-white hover:bg-violet-700'
                      : 'bg-[#e2e7ff] text-indigo-600 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  {plan.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Comparison Table ── */}
        <section className="px-4 md:px-12 max-w-5xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center text-[#131b2e] mb-10">
            Xususiyatlar Taqqoslamasi
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0]/80 shadow-sm">
            <table className="w-full bg-white/70 backdrop-blur-md">
              <thead>
                <tr className="bg-[#f2f3ff] border-b border-[#c7c4d8]/30">
                  <th className="p-5 text-left text-sm font-semibold text-[#131b2e]">Imtiyoz</th>
                  <th className="p-5 text-left text-sm font-semibold text-[#464555]">Bepul</th>
                  <th className="p-5 text-left text-sm font-semibold text-indigo-600">Basic Boost</th>
                  <th className="p-5 text-left text-sm font-semibold text-violet-600">VIP Boost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d8]/20">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-5 text-sm font-semibold text-[#131b2e]">{row.feature}</td>
                    <td className="p-5 text-sm text-[#464555]">{row.free}</td>
                    <td className="p-5 text-sm text-[#464555]">{row.basic}</td>
                    <td className="p-5 text-sm text-[#464555]">{row.vip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Premium CTA Banner ── */}
        <section className="px-4 md:px-12 max-w-5xl mx-auto mb-20">
          <div className="relative overflow-hidden bg-[#131b2e] rounded-2xl p-8 md:p-14 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-l from-indigo-600 to-transparent" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-black mb-4">
                  BuFu <span className="text-[#818CF8] italic">Premium</span> tajribasi
                </h2>
                <p className="text-[#c7c4d8] text-base mb-8 leading-relaxed">
                  Ko'p sonli loyihalar bilan ishlaydigan jiddiy mutaxassislar uchun.
                  Har bir boost uchun to'lamasdan cheksiz imtiyozlarga ega bo'ling.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#818CF8] p-2 bg-white/10 rounded-lg flex-shrink-0">percent</span>
                    <div>
                      <p className="text-sm font-semibold">0% Xizmat to'lovi</p>
                      <p className="text-xs text-[#c7c4d8]">Daromadingizning 100% o'zingizda.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#818CF8] p-2 bg-white/10 rounded-lg flex-shrink-0">analytics</span>
                    <div>
                      <p className="text-sm font-semibold">Raqobatchi tahlili</p>
                      <p className="text-xs text-[#c7c4d8]">Ishlar bo'yicha taklif doiralarini ko'ring.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#818CF8] mb-2">
                  Oylik Obuna
                </p>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                  <span className="text-5xl font-black text-white">$9</span>
                  <span className="text-[#c7c4d8] text-sm">/oy</span>
                </div>
                <button
                  onClick={() => router.push('/my-works')}
                  className="w-full py-4 bg-white text-[#131b2e] rounded-xl font-semibold text-sm hover:bg-[#818CF8] hover:text-white transition-all duration-300 active:scale-95"
                >
                  Premiumga obuna bo'lish
                </button>
                <p className="mt-3 text-xs text-[#c7c4d8] italic">Istalgan vaqt bekor qilish mumkin.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 md:px-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#131b2e] mb-10">
            To'lov va Boost bo'yicha Savollar
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-[#f2f3ff] rounded-xl border border-[#c7c4d8]/30 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm text-[#131b2e]"
                >
                  <span>{faq.question}</span>
                  <span
                    className={`material-symbols-outlined text-[#464555] transition-transform duration-200 flex-shrink-0 ml-4 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-[#464555] border-t border-[#c7c4d8]/20 pt-4 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="text-center mt-20 px-4">
          <p className="text-[#464555] text-sm mb-4">Hali ishonch hosil qilmadingizmi?</p>
          <button
            onClick={() => router.push('/my-works')}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
            <span>Mening ishlarim</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </section>
      </main>

      {/* Google Material Symbols (needed for icons) */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </>
  );
};

export default withLayoutBasic(PricingPage);
