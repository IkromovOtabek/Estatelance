import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChartBar, Users, Gear, Eye, CheckCircle, ArrowLeft,
  Globe, CurrencyDollar, Bell, Shield, Robot, Wrench,
  FloppyDisk, Warning, CheckFat, Envelope, ChatTeardropText, Phone
} from '@phosphor-icons/react';

type Tab = 'general' | 'commission' | 'notifications' | 'security' | 'maintenance' | 'integrations';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  // General
  const [siteName, setSiteName] = useState('BuFu');
  const [siteTagline, setSiteTagline] = useState("O'zbekiston frilanserlik platformasi");
  const [supportEmail, setSupportEmail] = useState('support@bufu.uz');
  const [siteUrl, setSiteUrl] = useState('https://bufu.uz');
  const [maxFileSize, setMaxFileSize] = useState('10');

  // Commission
  const [freelancerFee, setFreelancerFee] = useState('10');
  const [clientFee, setClientFee] = useState('5');
  const [minWithdrawal, setMinWithdrawal] = useState('50');
  const [withdrawalFee, setWithdrawalFee] = useState('2');

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [telegramNotifs, setTelegramNotifs] = useState(true);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [adminChatId, setAdminChatId] = useState('');
  const [newJobNotif, setNewJobNotif] = useState(true);
  const [newUserNotif, setNewUserNotif] = useState(true);
  const [paymentNotif, setPaymentNotif] = useState(true);
  const [disputeNotif, setDisputeNotif] = useState(true);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [autoModeration, setAutoModeration] = useState(true);
  const [spamFilter, setSpamFilter] = useState(true);

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("Sayt texnik ishlar sababli vaqtincha yopilgan. Tez orada qaytamiz!");
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [allowGuestBrowse, setAllowGuestBrowse] = useState(true);

  // Integrations
  const [paymeActive, setPaymeActive] = useState(true);
  const [clickActive, setClickActive] = useState(true);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactElement }[] = [
    { key: 'general', label: 'Umumiy', icon: <Globe size={16} /> },
    { key: 'commission', label: 'Komissiya', icon: <CurrencyDollar size={16} /> },
    { key: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={16} /> },
    { key: 'security', label: 'Xavfsizlik', icon: <Shield size={16} /> },
    { key: 'maintenance', label: "Ta'mirlash", icon: <Wrench size={16} /> },
    { key: 'integrations', label: 'Integratsiyalar', icon: <Robot size={16} /> },
  ];

  return (
    <>
      <Head><title>Sozlamalar — BuFu Admin</title></Head>

      <div className="min-h-screen bg-slate-50 flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 fixed top-0 left-0 h-full flex flex-col py-6 px-3 z-30">
          <div className="px-3 mb-8">
            <h1 className="text-xl font-black text-indigo-700">BuFu Admin</h1>
            <p className="text-xs text-slate-500 mt-0.5">Marketplace Controller</p>
          </div>
          <nav className="flex-1 space-y-1">
            {[
              { href: '/_admin', icon: <ChartBar size={18} />, label: 'Dashboard' },
              { href: '/_admin/users', icon: <Users size={18} />, label: 'Foydalanuvchilar' },
              { href: '/_admin/moderation', icon: <Eye size={18} />, label: 'Moderatsiya' },
              { href: '/_admin/ads', icon: <CheckCircle size={18} />, label: 'Reklamalar' },
              { href: '/_admin/settings', icon: <Gear size={18} />, label: 'Sozlamalar', active: true },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  (item as any).active
                    ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-3 pt-4 border-t border-slate-100">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>Bosh sahifaga</span>
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-64 flex-1 p-8 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Sozlamalar</h2>
              <p className="text-slate-500 text-sm mt-0.5">Platforma konfiguratsiyasi va parametrlari</p>
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {saved ? <><CheckFat size={16} /> Saqlandi!</> : <><FloppyDisk size={16} /> Saqlash</>}
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left nav */}
            <div className="w-44 flex-shrink-0">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-left transition-colors border-b border-slate-100 last:border-0 ${
                      activeTab === tab.key
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-5">

              {/* GENERAL */}
              {activeTab === 'general' && (
                <>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Globe size={16} color="#4f46e5" /> Sayt ma'lumotlari</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Sayt nomi</label>
                        <input value={siteName} onChange={e => setSiteName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tagline</label>
                        <input value={siteTagline} onChange={e => setSiteTagline(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Sayt URL</label>
                        <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Support email</label>
                        <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                    </div>
                    <div className="max-w-xs">
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Maksimal fayl hajmi (MB)</label>
                      <input type="number" value={maxFileSize} onChange={e => setMaxFileSize(e.target.value)} min={1} max={100}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>
                </>
              )}

              {/* COMMISSION */}
              {activeTab === 'commission' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><CurrencyDollar size={16} color="#f59e0b" /> Komissiya sozlamalari</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
                    <Warning size={16} className="flex-shrink-0 mt-0.5" />
                    <span>Komissiya o'zgartirilsa, faqat yangi bitimlar uchun kuchga kiradi. Mavjud bitimlar ta'sirlanmaydi.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-indigo-50 rounded-2xl p-4">
                      <p className="text-xs font-bold text-indigo-700 mb-3">Frilanser komissiyasi</p>
                      <div className="flex items-center gap-2">
                        <input type="number" value={freelancerFee} onChange={e => setFreelancerFee(e.target.value)} min={0} max={50}
                          className="flex-1 border border-indigo-200 rounded-xl px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                        <span className="text-xl font-extrabold text-indigo-600">%</span>
                      </div>
                      <p className="text-xs text-indigo-400 mt-2">Har bir to'lovdan olinadi</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4">
                      <p className="text-xs font-bold text-emerald-700 mb-3">Ish beruvchi komissiyasi</p>
                      <div className="flex items-center gap-2">
                        <input type="number" value={clientFee} onChange={e => setClientFee(e.target.value)} min={0} max={50}
                          className="flex-1 border border-emerald-200 rounded-xl px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                        <span className="text-xl font-extrabold text-emerald-600">%</span>
                      </div>
                      <p className="text-xs text-emerald-400 mt-2">Har bir buyurtmadan olinadi</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Minimum yechib olish ($)</label>
                      <input type="number" value={minWithdrawal} onChange={e => setMinWithdrawal(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Yechib olish komissiyasi (%)</label>
                      <input type="number" value={withdrawalFee} onChange={e => setWithdrawalFee(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-700 mb-2">Hisoblash namunasi</p>
                    <p className="text-xs text-slate-500">
                      $1000 bitim uchun: frilanser <strong className="text-slate-700">${1000 - (1000 * parseFloat(freelancerFee || '0') / 100)}</strong> oladi,
                      platforma <strong className="text-indigo-600">${(1000 * (parseFloat(freelancerFee || '0') + parseFloat(clientFee || '0')) / 100).toFixed(0)}</strong> komissiya oladi.
                    </p>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Bell size={16} color="#8b5cf6" /> Bildirishnoma kanallari</h3>
                    {[
                      { icon: <Envelope size={16} color="#4f46e5" />, label: 'Email bildirishnomalari', sub: 'SMTP orqali yuboriladi', val: emailNotifs, set: setEmailNotifs },
                      { icon: <Phone size={16} color="#10b981" />, label: 'SMS bildirishnomalari', sub: 'Eskiz yoki Playmobile SMS gateway', val: smsNotifs, set: setSmsNotifs },
                      { icon: <ChatTeardropText size={16} color="#0ea5e9" />, label: 'Telegram bot', sub: '@buildfuture_bot orqali', val: telegramNotifs, set: setTelegramNotifs },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">{item.icon}</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.sub}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => item.set(!item.val)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.val ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {telegramNotifs && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">Telegram konfiguratsiya</h3>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Bot Token</label>
                        <input value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)}
                          placeholder="1234567890:ABC-..."
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Admin Chat ID</label>
                        <input value={adminChatId} onChange={e => setAdminChatId(e.target.value)}
                          placeholder="-100123456789"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Bildirishnoma turlari</h3>
                    {[
                      { label: 'Yangi ish e\'lonlari', val: newJobNotif, set: setNewJobNotif },
                      { label: 'Yangi foydalanuvchilar', val: newUserNotif, set: setNewUserNotif },
                      { label: 'To\'lov operatsiyalari', val: paymentNotif, set: setPaymentNotif },
                      { label: 'Nizolar va shikoyatlar', val: disputeNotif, set: setDisputeNotif },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{item.label}</span>
                        <button
                          onClick={() => item.set(!item.val)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.val ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Shield size={16} color="#ef4444" /> Xavfsizlik sozlamalari</h3>

                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Ikki faktorli autentifikatsiya (Admin)</p>
                        <p className="text-xs text-slate-400">Admin paneliga kirish uchun OTP talab qilinadi</p>
                      </div>
                      <button
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${twoFactor ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${twoFactor ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Avtomatik moderatsiya</p>
                        <p className="text-xs text-slate-400">AI yordamida spam va noo'rin kontent aniqlanadi</p>
                      </div>
                      <button
                        onClick={() => setAutoModeration(!autoModeration)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${autoModeration ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${autoModeration ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Spam filtri</p>
                        <p className="text-xs text-slate-400">Xabarlarda spam havolalari blokirovka qilinadi</p>
                      </div>
                      <button
                        onClick={() => setSpamFilter(!spamFilter)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${spamFilter ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${spamFilter ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Maks. kirish urinishlari</label>
                        <input type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(e.target.value)} min={3} max={20}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        <p className="text-xs text-slate-400 mt-1">Blokirovkagacha</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Sessiya vaqti (daqiqa)</label>
                        <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} min={15}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        <p className="text-xs text-slate-400 mt-1">Harakatsizlik vaqti</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MAINTENANCE */}
              {activeTab === 'maintenance' && (
                <div className="space-y-5">
                  <div className={`border rounded-2xl p-6 ${maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className={`text-sm font-bold flex items-center gap-2 ${maintenanceMode ? 'text-red-700' : 'text-slate-900'}`}>
                          <Wrench size={16} color={maintenanceMode ? '#dc2626' : '#64748b'} />
                          Ta'mirlash rejimi
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Yoqilganda saytga foydalanuvchilar kira olmaydi</p>
                      </div>
                      <button
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${maintenanceMode ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {maintenanceMode && (
                      <div className="bg-red-100 border border-red-200 rounded-xl p-3 flex gap-2 text-xs text-red-700 mb-4">
                        <Warning size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Diqqat! Ta'mirlash rejimi yoqilgan. Foydalanuvchilar saytga kira olmaydi.</span>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Ta'mirlash xabari</label>
                      <textarea rows={3} value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Foydalanuvchi ruxsatlari</h3>
                    {[
                      { label: 'Yangi ro\'yxatdan o\'tish', sub: 'Yangi foydalanuvchilar saytga qo\'shila oladi', val: newRegistrations, set: setNewRegistrations },
                      { label: 'Mehmon ko\'rish', sub: 'Kirmagan foydalanuvchilar sahifalarni ko\'ra oladi', val: allowGuestBrowse, set: setAllowGuestBrowse },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.sub}</p>
                        </div>
                        <button
                          onClick={() => item.set(!item.val)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.val ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTEGRATIONS */}
              {activeTab === 'integrations' && (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Robot size={16} color="#8b5cf6" /> To'lov tizimlari</h3>
                    {[
                      { label: 'Payme', sub: "O'zbekiston raqamli to'lov tizimi", val: paymeActive, set: setPaymeActive, color: 'bg-blue-50' },
                      { label: 'Click', sub: "Click.uz to'lov tizimi", val: clickActive, set: setClickActive, color: 'bg-green-50' },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center justify-between p-4 ${item.color} border border-slate-100 rounded-xl`}>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {item.val ? 'Faol' : "O'chiq"}
                          </span>
                          <button
                            onClick={() => item.set(!item.val)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.val ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Analytics integratsiyalari</h3>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Google Analytics ID</label>
                      <input value={googleAnalyticsId} onChange={e => setGoogleAnalyticsId(e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Meta Pixel ID</label>
                      <input value={metaPixelId} onChange={e => setMetaPixelId(e.target.value)}
                        placeholder="123456789012345"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminSettingsPage;
