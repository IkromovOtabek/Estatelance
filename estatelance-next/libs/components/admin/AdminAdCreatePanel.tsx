import React, { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import {
  Image, Megaphone, RocketLaunch, Link as LinkIcon,
  UploadSimple, Play, X, FilmStrip,
} from '@phosphor-icons/react';
import { ADMIN_CREATE_ANNOUNCEMENT } from '../../../apollo/admin/mutation';

type AdType = 'BANNER' | 'SPONSORED_JOB' | 'FEATURED_FREELANCER';
type MediaType = 'image' | 'video' | 'url';

interface AdminAdCreatePanelProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function AdminAdCreatePanel({ onCancel, onSuccess }: AdminAdCreatePanelProps) {

    const fileInputRef = useRef<HTMLInputElement>(null);

  const [adType, setAdType] = useState<AdType>('BANNER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createAnnouncement] = useMutation(ADMIN_CREATE_ANNOUNCEMENT);

  // Media states
  const [mediaType, setMediaType] = useState<MediaType>('url');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  const audiences = ['Frilanserlar', 'Ish beruvchilar', 'Junior mutaxassislar', 'Senior mutaxassislar', "IT soha mutaxassislari", 'Dizaynerlar'];

  const toggleAudience = (a: string) => {
    setTargetAudience(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (adType === 'SPONSORED_JOB') {
      setError('Homiylik ishi uchun agent ish e\'lonida boost to\'lovini yuboradi. Targetlar ro\'yxatida ko\'rinadi.');
      return;
    }
    if (!title.trim()) {
      setError('Sarlavha majburiy');
      return;
    }
    setLoading(true);
    try {
      const bodyParts = [description.trim()];
      if (targetUrl.trim()) bodyParts.push(`Havola: ${targetUrl.trim()}`);
      if (budget) bodyParts.push(`Byudjet: $${budget}`);
      if (startDate || endDate) bodyParts.push(`Muddat: ${startDate || '—'} — ${endDate || '—'}`);
      if (targetAudience.length) bodyParts.push(`Auditoriya: ${targetAudience.join(', ')}`);

      await createAnnouncement({
        variables: {
          input: {
            title: title.trim(),
            body: bodyParts.filter(Boolean).join('\n\n') || title.trim(),
            imageUrl: mediaUrlInput.trim() || mediaPreview || undefined,
            announcementType: 'ADVERTISEMENT',
          },
        },
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err?.graphQLErrors?.[0]?.message ?? 'Saqlashda xato');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions: { value: AdType; label: string; desc: string; icon: React.ReactElement }[] = [
    { value: 'BANNER', label: 'Banner reklama', desc: "Sahifa tepasida ko'rinadigan katta banner", icon: <Image size={20} color="#4f46e5" /> },
    { value: 'SPONSORED_JOB', label: 'Homiylik ishi', desc: "Ishlar ro'yxatida yuqorida ko'rsatiladi", icon: <RocketLaunch size={20} color="#7c3aed" /> },
    { value: 'FEATURED_FREELANCER', label: 'Premium frilanser', desc: 'Frilanser kartasini ajratib ko\'rsatish', icon: <Megaphone size={20} color="#0ea5e9" /> },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Yangi reklama yaratish</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Platforma reklama e&apos;loni (API orqali saqlanadi)</p>
      </div>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ad Type */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Reklama turi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAdType(opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      adType === opt.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="mb-2">{opt.icon}</div>
                    <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Asosiy ma'lumotlar</h3>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Reklama sarlavhasi *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Masalan: Senior Designer kerak — PayUz Group"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tavsif</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Reklama mazmuni yoki qo'shimcha ma'lumot..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>

              {/* Target Link */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block flex items-center gap-1.5">
                  <LinkIcon size={13} /> Havola URL *
                  <span className="text-slate-400 font-normal">(foydalanuvchilar bosganida ochiladi)</span>
                </label>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://bufu.uz/jobs/..."
                  className="w-full border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <p className="text-xs text-slate-400 mt-1">Bu havolani bosgan foydalanuvchilar soni statistikada &quot;kliklar&quot; sifatida hisoblanadi.</p>
              </div>
            </div>

            {/* Media Upload */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Reklama mediya materyali</h3>
              <p className="text-xs text-slate-400 mb-4">Rasm yoki video yuklang, yoki URL kiriting</p>
              <div className="flex gap-2 mb-4">
                {[
                  { key: 'url' as MediaType, label: 'URL kiriting', icon: <LinkIcon size={14} /> },
                  { key: 'image' as MediaType, label: 'Rasm yuklash', icon: <Image size={14} /> },
                  { key: 'video' as MediaType, label: 'Video yuklash', icon: <FilmStrip size={14} /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => { setMediaType(tab.key); removeMedia(); setMediaUrlInput(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      mediaType === tab.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#334155] hover:border-indigo-300'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              {mediaType === 'url' && (
                <div>
                  <input
                    type="url"
                    value={mediaUrlInput}
                    onChange={e => { setMediaUrlInput(e.target.value); setMediaPreview(e.target.value); }}
                    placeholder="https://example.com/banner.jpg yoki video URL"
                    className="w-full border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {mediaPreview && (
                    <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-[#1e293b] h-[200px]">
                      <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <button type="button" onClick={() => { setMediaPreview(''); setMediaUrlInput(''); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {(mediaType === 'image' || mediaType === 'video') && (
                <div>
                  <input ref={fileInputRef} type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} className="hidden" />
                  {!mediaPreview ? (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 dark:border-[#334155] rounded-xl p-10 flex flex-col items-center gap-3 hover:border-indigo-400 text-slate-500">
                      <UploadSimple size={32} color="#94a3b8" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{mediaType === 'image' ? 'Rasm yuklash' : 'Video yuklash'}</p>
                    </button>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#334155] max-h-[300px]">
                      {mediaType === 'image' ? (
                        <img src={mediaPreview} alt="preview" className="w-full object-cover max-h-72" />
                      ) : (
                        <video src={mediaPreview} controls className="w-full max-h-72" />
                      )}
                      <button type="button" onClick={removeMedia} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"><X size={14} /></button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Byudjet va jadval</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Byudjet ($)</label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="100" min={0} className="w-full border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Boshlanish</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tugash</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Maqsadli auditoriya</h3>
              <div className="flex flex-wrap gap-2">
                {audiences.map(a => (
                  <button key={a} type="button" onClick={() => toggleAudience(a)} className={`text-sm px-3 py-1.5 rounded-lg border font-semibold transition-all ${targetAudience.includes(a) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#334155]'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center gap-2">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Reklama yaratish
              </button>
              <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-[#1e293b]">
                Bekor qilish
              </button>
            </div>
          </form>
    </div>
  );
}
