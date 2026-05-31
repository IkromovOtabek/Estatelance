import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CreditCard, CheckCircle, ArrowLeft, Rocket, ShieldCheck, Lock } from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';

type PaymentMethod = 'payme' | 'click' | 'card';

const CheckoutPage = () => {
  const router = useRouter();
  const { plan = 'PRO', price = '7', days = '7' } = router.query;
  const [method, setMethod] = useState<PaymentMethod>('payme');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    if (!agreed) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <CheckCircle size={48} color="#10b981" weight="fill" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">To'lov muvaffaqiyatli!</h2>
        <p className="text-slate-500 mb-6 max-w-sm">
          <strong>{plan} Boost paketi</strong> faollashtirildi. Sizning e'loningiz endi ko'proq ko'rinishda bo'ladi.
        </p>
        <div className="flex gap-3">
          <Link href="/my-works" className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Mening ishlarim
          </Link>
          <Link href="/" className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Bosh sahifa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>To'lov — BuFu</title>
        <meta name="description" content="BuFu boost paketini xavfsiz to'lov qiling." />
      </Head>

      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft size={16} />
          Narxlarga qaytish
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">To'lovni amalga oshirish</h1>
          <p className="text-slate-500 mt-1">Xizmatlarimizni faollashtirish uchun xavfsiz to'lov usulini tanlang.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: payment form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Package summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Rocket size={24} color="#4f46e5" weight="fill" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{plan} Boost paketi</p>
                  <p className="text-sm text-slate-500">{days} kunlik premium ko'rinish</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-indigo-600">${price}</span>
            </div>

            {/* Payment methods */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-base font-bold text-slate-900 mb-4">To'lov usulini tanlang</h2>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {(['payme', 'click', 'card'] as PaymentMethod[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`relative flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                      method === m ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {method === m && (
                      <span className="absolute top-2 right-2">
                        <CheckCircle size={16} color="#4f46e5" weight="fill" />
                      </span>
                    )}
                    <div className="h-8 flex items-center justify-center">
                      {m === 'payme' && (
                        <span className="text-sm font-extrabold text-blue-600 tracking-tight">Payme</span>
                      )}
                      {m === 'click' && (
                        <span className="text-sm font-extrabold text-green-600 tracking-tight">Click</span>
                      )}
                      {m === 'card' && (
                        <CreditCard size={28} color="#64748b" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {m === 'payme' ? 'Payme' : m === 'click' ? 'Click' : 'Visa / Mastercard'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Card form */}
              {method === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Karta egasining ismi</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      placeholder="Ism Familiya"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Karta raqami</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Muddati</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">CVV</label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={e => setCvv(e.target.value.slice(0, 3))}
                        placeholder="123"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payme / Click redirect info */}
              {(method === 'payme' || method === 'click') && (
                <div className="mt-2 p-4 bg-blue-50 rounded-xl text-sm text-blue-700 font-medium">
                  "{method === 'payme' ? 'Payme' : 'Click'}" to'lov sahifasiga yo'naltirilasiz. Barcha ma'lumotlar xavfsiz.
                </div>
              )}
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-slate-600">
                <Link href="/terms" className="text-indigo-600 hover:underline">Foydalanish shartlari</Link> va{' '}
                <Link href="/privacy" className="text-indigo-600 hover:underline">Maxfiylik siyosati</Link> bilan roziman
              </span>
            </label>

            <button
              onClick={handlePay}
              disabled={!agreed || loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  ${price} to'lash
                </>
              )}
            </button>
          </div>

          {/* Right: order summary */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Buyurtma xulosasi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{plan} Boost</span>
                  <span>${price}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Davomiyligi</span>
                  <span>{days} kun</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Soliq (0%)</span>
                  <span>$0</span>
                </div>
                <hr className="border-slate-100 my-2" />
                <div className="flex justify-between font-bold text-slate-900 text-base">
                  <span>Jami</span>
                  <span className="text-indigo-600">${price}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} color="#10b981" weight="fill" />
                <span className="text-sm font-bold text-emerald-800">Xavfsiz to'lov</span>
              </div>
              <p className="text-xs text-emerald-700">Barcha to'lovlar SSL sertifikati bilan himoyalangan. Sizning ma'lumotlaringiz xavfsiz.</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-indigo-800 mb-1">{plan} paketi imkoniyatlari</p>
              <ul className="text-xs text-indigo-700 space-y-1">
                <li>✓ Qidiruv natijalarida birinchi o'rinlar</li>
                <li>✓ "{plan}" belgisi bilan ajralib turish</li>
                <li>✓ Ko'proq bid qabul qilish</li>
                <li>✓ {days} kunlik premium ko'rinish</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(CheckoutPage);
