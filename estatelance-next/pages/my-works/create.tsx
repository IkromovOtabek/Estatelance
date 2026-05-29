import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useReactiveVar } from '@apollo/client';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, FormControl,
  InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { CheckCircle, Circle, Rocket, Star, Lightning } from '@phosphor-icons/react';
import { CREATE_JOB } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { JobCategory, JOB_CATEGORY_LABELS, PropertyType, PROPERTY_TYPE_LABELS } from '../../libs/enums';

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1,  label: 'Nom va tajriba' },
  { id: 2,  label: 'Shartlar' },
  { id: 3,  label: 'Jadval' },
  { id: 4,  label: 'Manzil' },
  { id: 5,  label: 'To\'lov' },
  { id: 6,  label: 'Tavsif' },
  { id: 7,  label: 'Ko\'nikmalar' },
  { id: 8,  label: 'Takliflar' },
  { id: 9,  label: 'Ko\'rish' },
  { id: 10, label: 'Nashr' },
];

const EXP_LEVELS = [
  { value: 'NONE',   label: 'Tajriba kerak emas' },
  { value: 'JUNIOR', label: '1–3 yil' },
  { value: 'MIDDLE', label: '3–6 yil' },
  { value: 'SENIOR', label: '6 yildan ortiq' },
];

const WORK_SCHEDULES = ['5/2', '6/1', '4/3', '2/2', '3/3', '3/2', 'Erkin', 'Dam olish kunlari', 'Boshqa'];
const HOURS_PER_DAY  = ['4', '6', '8', '10', '12', '24', 'Kelishiladi', 'Boshqa'];
const WORK_FORMATS   = [
  { value: 'ONSITE',    label: 'Ish joyida' },
  { value: 'REMOTE',    label: 'Masofaviy' },
  { value: 'HYBRID',    label: 'Gibrid' },
  { value: 'TRAVELING', label: 'Sayohat' },
];

// ─── Reusable chip-select ─────────────────────────────────────────────────────
function ChipSelect({ options, value, onChange, multiple = false }: {
  options: { value: string; label: string }[] | string[];
  value: string | string[];
  onChange: (v: any) => void;
  multiple?: boolean;
}) {
  const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {normalized.map(o => {
        const selected = multiple
          ? (value as string[]).includes(o.value)
          : value === o.value;
        return (
          <Box
            key={o.value}
            onClick={() => {
              if (multiple) {
                const arr = value as string[];
                onChange(selected ? arr.filter(x => x !== o.value) : [...arr, o.value]);
              } else {
                onChange(selected ? '' : o.value);
              }
            }}
            sx={{
              px: 2, py: 0.9, borderRadius: 3, cursor: 'pointer', fontSize: 14, fontWeight: 500,
              border: `1.5px solid ${selected ? '#4f46e5' : '#d1d5db'}`,
              color: selected ? '#4f46e5' : '#374151',
              bgcolor: selected ? '#eef2ff' : 'white',
              transition: 'all 0.15s',
              '&:hover': { borderColor: '#4f46e5' },
            }}
          >
            {o.label}
          </Box>
        );
      })}
    </Stack>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <Box mb={2.5}>
      <Typography fontWeight={800} fontSize={18} color="#0f172a">{title}</Typography>
      {sub && <Typography fontSize={13} color="#94a3b8" mt={0.25}>{sub}</Typography>}
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const CreateJobPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [createJob, { loading }] = useMutation(CREATE_JOB);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle]               = useState('');
  const [experienceLevel, setExp]       = useState('');
  const [jobType, setJobType]           = useState('PERMANENT');
  const [workFormat, setWorkFormat]     = useState<string[]>([]);
  const [workSchedule, setSchedule]     = useState('');
  const [hoursPerDay, setHours]         = useState('');
  const [hasNightShift, setNightShift]  = useState(false);
  const [location, setLocation]         = useState('');
  const [propertyAddress, setAddress]   = useState('');
  const [salaryFrom, setSalaryFrom]     = useState('');
  const [salaryTo, setSalaryTo]         = useState('');
  const [description, setDescription]  = useState('');
  const [category, setCategory]         = useState<JobCategory | ''>('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [skillInput, setSkillInput]     = useState('');
  const [requiredSkills, setSkills]     = useState<string[]>([]);
  // Step 8: bid settings
  const [maxBids, setMaxBids]           = useState('');
  const [autoClose, setAutoClose]       = useState(false);
  const [urgentJob, setUrgentJob]       = useState(false);
  // Step 10: publish plan
  const [publishPlan, setPublishPlan]   = useState<'standard' | 'plus' | 'premium'>('standard');

  const addSkill = () => {
    const t = skillInput.trim();
    if (!t || requiredSkills.includes(t)) return;
    setSkills(p => [...p, t]);
    setSkillInput('');
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 1 && !title.trim()) { setError("Ish nomi kiritilishi shart."); return false; }
    if (step === 6 && !description.trim()) { setError("Tavsif kiritilishi shart."); return false; }
    if (step === 7 && !category) { setError("Kategoriya tanlanishi shart."); return false; }
    setError('');
    return true;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 10)); };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      setError("Nom, tavsif va kategoriya to'ldirilishi shart.");
      return;
    }
    try {
      await createJob({
        variables: {
          input: {
            title,
            description,
            category,
            propertyType: propertyType || PropertyType.APARTMENT,
            propertyAddress: propertyAddress || undefined,
            budget: salaryFrom ? Number(salaryFrom) : 100,
            experienceLevel: experienceLevel || undefined,
            jobType,
            workFormat: workFormat.length ? workFormat : undefined,
            workSchedule: workSchedule || undefined,
            hoursPerDay: hoursPerDay || undefined,
            location: location || undefined,
            salaryFrom: salaryFrom ? Number(salaryFrom) : undefined,
            salaryTo: salaryTo ? Number(salaryTo) : undefined,
            requiredSkills: requiredSkills.length ? requiredSkills : undefined,
          },
        },
      });
      router.push('/my-works');
    } catch (err: any) {
      setError(err?.graphQLErrors?.[0]?.message ?? 'Xatolik yuz berdi');
    }
  };

  if (!user._id) { router.replace('/account'); return null; }

  return (
    <>
      <Head><title>Ish joylash — BuFu</title></Head>

      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', maxWidth: 1000, mx: 'auto' }}>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight={900} color="#0f172a">Yangi ish joylash</Typography>
            <Typography fontSize={14} color="#64748b" mt={0.5}>
              Har bir bo'limni to'ldiring va "Davom etish" tugmasini bosing
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {/* ── Step 1: Nom va tajriba ───────────────────────────────────── */}
          {step === 1 && (
            <Box>
              <SectionTitle title="Asosiy ma'lumot" />

              <Box mb={4}>
                <Typography fontWeight={600} fontSize={15} mb={1} color="#0f172a">Ish nomi *</Typography>
                <TextField
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  fullWidth
                  placeholder="Kasb yoki lavozim"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', fontSize: 15 } }}
                />
              </Box>

              <Box>
                <Typography fontWeight={600} fontSize={15} mb={0.5} color="#0f172a">Tajriba darajasi</Typography>
                <Typography fontSize={13} color="#94a3b8" mb={2}>
                  Bir necha oydan bir yilgacha tajriba talab qilsangiz "Tajriba kerak emas" ni tanlang
                </Typography>
                <ChipSelect options={EXP_LEVELS} value={experienceLevel} onChange={setExp} />
              </Box>
            </Box>
          )}

          {/* ── Step 2: Shartlar ─────────────────────────────────────────── */}
          {step === 2 && (
            <Box>
              <SectionTitle title="Ish shartlari" />

              <Box mb={4}>
                <Typography fontWeight={600} fontSize={15} mb={2} color="#0f172a">Qanday xodim kerak</Typography>
                <ChipSelect
                  options={[{ value: 'PERMANENT', label: 'Doimiy' }, { value: 'TEMPORARY', label: 'Vaqtinchalik' }]}
                  value={jobType}
                  onChange={setJobType}
                />
              </Box>

              <Box>
                <Typography fontWeight={600} fontSize={15} mb={2} color="#0f172a">Ish formati</Typography>
                <ChipSelect options={WORK_FORMATS} value={workFormat} onChange={setWorkFormat} multiple />
              </Box>
            </Box>
          )}

          {/* ── Step 3: Jadval ───────────────────────────────────────────── */}
          {step === 3 && (
            <Box>
              <SectionTitle title="Jadval va ish soatlari" />

              <Box mb={4}>
                <Typography fontWeight={600} fontSize={15} mb={0.5} color="#0f172a">Ish jadvali</Typography>
                <Typography fontSize={13} color="#94a3b8" mb={2}>Ish kunlari va dam olish kunlari qanday almashinadi</Typography>
                <ChipSelect options={WORK_SCHEDULES} value={workSchedule} onChange={setSchedule} />
              </Box>

              <Box mb={4}>
                <Typography fontWeight={600} fontSize={15} mb={2} color="#0f172a">Kunda necha soat</Typography>
                <ChipSelect options={HOURS_PER_DAY} value={hoursPerDay} onChange={setHours} />
              </Box>

              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: 'white' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600} fontSize={14} color="#0f172a">Kechki yoki tunda smenalar bor</Typography>
                  </Box>
                  <Switch checked={hasNightShift} onChange={e => setNightShift(e.target.checked)} />
                </Stack>
              </Box>
            </Box>
          )}

          {/* ── Step 4: Manzil ───────────────────────────────────────────── */}
          {step === 4 && (
            <Box>
              <SectionTitle title="Shahar va ish manzili" />

              <Box mb={3}>
                <Typography fontWeight={600} fontSize={15} mb={1} color="#0f172a">Shahar</Typography>
                <TextField
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  fullWidth placeholder="Toshkent"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
              </Box>

              <Box mb={3}>
                <Typography fontWeight={600} fontSize={15} mb={1} color="#0f172a">Aniq manzil</Typography>
                <TextField
                  value={propertyAddress}
                  onChange={e => setAddress(e.target.value)}
                  fullWidth placeholder="Ko'cha, bino, metro..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
              </Box>

              <Box>
                <Typography fontWeight={600} fontSize={15} mb={1} color="#0f172a">Mulk turi</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Mulk turi</InputLabel>
                  <Select value={propertyType} label="Mulk turi" onChange={e => setPropertyType(e.target.value as PropertyType)} sx={{ borderRadius: 2, bgcolor: 'white' }}>
                    <MenuItem value="">— Tanlang —</MenuItem>
                    {Object.values(PropertyType).map(pt => (
                      <MenuItem key={pt} value={pt}>{PROPERTY_TYPE_LABELS[pt]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {/* ── Step 5: To'lov ───────────────────────────────────────────── */}
          {step === 5 && (
            <Box>
              <SectionTitle title="To'lov miqdori" sub="Dollar ($) hisobida kiriting" />

              <Stack direction="row" spacing={2} alignItems="center">
                <Box flex={1}>
                  <Typography fontWeight={600} fontSize={14} mb={1} color="#0f172a">Dan ($)</Typography>
                  <TextField
                    value={salaryFrom} onChange={e => setSalaryFrom(e.target.value)}
                    type="number" fullWidth placeholder="100"
                    inputProps={{ min: 0, step: 50 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                  />
                </Box>
                <Typography fontSize={20} color="#94a3b8" mt={3}>—</Typography>
                <Box flex={1}>
                  <Typography fontWeight={600} fontSize={14} mb={1} color="#0f172a">Gacha ($)</Typography>
                  <TextField
                    value={salaryTo} onChange={e => setSalaryTo(e.target.value)}
                    type="number" fullWidth placeholder="300"
                    inputProps={{ min: 0, step: 50 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                  />
                </Box>
              </Stack>

              {(salaryFrom || salaryTo) && (
                <Box mt={2} p={2} sx={{ bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                  <Typography fontSize={14} color="#16a34a" fontWeight={700}>
                    To'lov: {salaryFrom ? `$${salaryFrom}` : ''}{salaryFrom && salaryTo ? ' – ' : ''}{salaryTo ? `$${salaryTo}` : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ── Step 6: Tavsif ───────────────────────────────────────────── */}
          {step === 6 && (
            <Box>
              <SectionTitle title="Ish tavsifi *" sub="Batafsil ma'lumot qanchalik ko'p bo'lsa, shunchalik yaxshi frilanserlar topiladi" />
              <TextField
                value={description}
                onChange={e => setDescription(e.target.value)}
                multiline rows={10} fullWidth
                placeholder={"Ish haqida batafsil ma'lumot...\n\nTalablar:\n- ...\n\nVazifalar:\n- ..."}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', fontSize: 14 } }}
              />
              <Typography fontSize={12} color="#94a3b8" mt={0.75} textAlign="right">
                {description.length} belgi
              </Typography>
            </Box>
          )}

          {/* ── Step 7: Ko'nikmalar ──────────────────────────────────────── */}
          {step === 7 && (
            <Box>
              <SectionTitle title="Kategoriya va ko'nikmalar" />

              <Box mb={4}>
                <Typography fontWeight={600} fontSize={15} mb={1} color="#0f172a">Kategoriya *</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Kategoriya tanlang</InputLabel>
                  <Select value={category} label="Kategoriya tanlang" onChange={e => setCategory(e.target.value as JobCategory)} sx={{ borderRadius: 2, bgcolor: 'white' }}>
                    {Object.values(JobCategory).map(cat => (
                      <MenuItem key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography fontWeight={600} fontSize={15} mb={1} color="#0f172a">Talab qilinadigan ko'nikmalar</Typography>
                <Stack direction="row" spacing={1} mb={1.5}>
                  <TextField
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    size="small" fullWidth placeholder="AutoCAD, Photoshop, SMM..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                  />
                  <Button variant="outlined" onClick={addSkill} sx={{ borderColor: '#e2e8f0', color: '#4f46e5', whiteSpace: 'nowrap' }}>
                    Qo'shish
                  </Button>
                </Stack>
                {requiredSkills.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {requiredSkills.map(s => (
                      <Chip key={s} label={s} size="small" onDelete={() => setSkills(p => p.filter(x => x !== s))} />
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          )}

          {/* ── Step 8: Takliflar sozlamalari ───────────────────────────── */}
          {step === 8 && (
            <Box>
              <SectionTitle title="Takliflar sozlamalari" sub="Frilanserlar qanday murojaat qilishi kerakligini belgilang" />

              <Box mb={4}>
                <Typography fontWeight={600} fontSize={15} mb={0.5} color="#0f172a">Maksimal takliflar soni</Typography>
                <Typography fontSize={13} color="#94a3b8" mb={2}>
                  Belgilangan songa yetganda yangi takliflar qabul qilinmaydi (bo'sh qolsa — cheksiz)
                </Typography>
                <TextField
                  value={maxBids}
                  onChange={e => setMaxBids(e.target.value)}
                  type="number"
                  placeholder="Masalan: 20"
                  inputProps={{ min: 1, max: 500 }}
                  sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
              </Box>

              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: 'white', mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600} fontSize={14} color="#0f172a">Belgilangan songa yetganda avtomatik yopilsin</Typography>
                    <Typography fontSize={12} color="#94a3b8" mt={0.25}>Maksimal miqdorga yetgach ish avtomatik ACTIVE holatga o'tadi</Typography>
                  </Box>
                  <Switch checked={autoClose} onChange={e => setAutoClose(e.target.checked)} />
                </Stack>
              </Box>

              <Box sx={{ border: '1px solid #fbbf24', borderRadius: 2, p: 2, bgcolor: '#fffbeb' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                      <Lightning size={16} color="#d97706" weight="fill" />
                      <Typography fontWeight={700} fontSize={14} color="#92400e">Tezkor e'lon</Typography>
                    </Stack>
                    <Typography fontSize={12} color="#a16207">
                      Ishingiz 48 soat davomida eng yuqori o'rinda ko'rsatiladi va ko'proq frilanserlar ko'radi
                    </Typography>
                  </Box>
                  <Switch checked={urgentJob} onChange={e => setUrgentJob(e.target.checked)} color="warning" />
                </Stack>
              </Box>
            </Box>
          )}

          {/* ── Step 9: Ko'rish (preview) ────────────────────────────────── */}
          {step === 9 && (
            <Box>
              <SectionTitle title="Vakansiya ko'rinishi" sub="Frilanserlar ko'radigan shakl" />

              <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" mb={0.5}>{title || '—'}</Typography>

                    {(salaryFrom || salaryTo) && (
                      <Typography fontWeight={700} fontSize={15} color="#16a34a" mb={1}>
                        ${salaryFrom || '?'} – ${salaryTo || '?'} / oy
                      </Typography>
                    )}

                    <Stack direction="row" flexWrap="wrap" gap={1} mb={1.5}>
                      {experienceLevel && <Typography fontSize={13} color="#475569">Tajriba: {EXP_LEVELS.find(e => e.value === experienceLevel)?.label}</Typography>}
                    </Stack>
                    <Stack spacing={0.5}>
                      {jobType && <Typography fontSize={13} color="#475569">{jobType === 'PERMANENT' ? 'Doimiy bandlik' : 'Vaqtinchalik bandlik'}</Typography>}
                      {workSchedule && <Typography fontSize={13} color="#475569">Jadval: {workSchedule}</Typography>}
                      {hoursPerDay && <Typography fontSize={13} color="#475569">Kuniga: {hoursPerDay} soat</Typography>}
                      {workFormat.length > 0 && <Typography fontSize={13} color="#475569">Format: {workFormat.map(f => WORK_FORMATS.find(x => x.value === f)?.label).join(', ')}</Typography>}
                    </Stack>
                  </Box>
                  <Box>
                    {urgentJob && (
                      <Chip
                        icon={<Lightning size={12} weight="fill" />}
                        label="Tezkor"
                        size="small"
                        sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 700, fontSize: 11 }}
                      />
                    )}
                  </Box>
                </Stack>

                {description && (
                  <Box sx={{ borderTop: '1px solid #f1f5f9', pt: 2, mt: 2 }}>
                    <Typography fontSize={13} color="#475569" sx={{ whiteSpace: 'pre-line', maxHeight: 240, overflow: 'hidden' }}>
                      {description}
                    </Typography>
                  </Box>
                )}

                {requiredSkills.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.75} mt={2} pt={2} sx={{ borderTop: '1px solid #f1f5f9' }}>
                    {requiredSkills.map(s => <Chip key={s} label={s} size="small" sx={{ bgcolor: '#f8fafc' }} />)}
                  </Stack>
                )}

                {(location || propertyAddress) && (
                  <Typography fontSize={13} color="#64748b" mt={2}>
                    📍 {[location, propertyAddress].filter(Boolean).join(', ')}
                  </Typography>
                )}
              </Box>

              {/* Summary list */}
              <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                <Typography fontWeight={700} fontSize={13} color="#0f172a" mb={1.5}>Kiritilgan ma'lumotlar xulosa</Typography>
                {[
                  { label: "Kategoriya", val: category ? JOB_CATEGORY_LABELS[category as JobCategory] : '—' },
                  { label: "Manzil", val: [location, propertyAddress].filter(Boolean).join(', ') || '—' },
                  { label: "To'lov", val: salaryFrom || salaryTo ? `$${salaryFrom || '?'} – $${salaryTo || '?'}` : '—' },
                  { label: "Jadval", val: workSchedule || '—' },
                  { label: "Ko'nikmalar", val: requiredSkills.join(', ') || '—' },
                  { label: "Takliflar", val: maxBids ? `Maks. ${maxBids} ta` : 'Cheksiz' },
                ].map(row => (
                  <Stack key={row.label} direction="row" justifyContent="space-between" py={0.75}
                    sx={{ borderBottom: '1px solid #f8fafc', '&:last-child': { border: 'none' } }}>
                    <Typography fontSize={13} color="#94a3b8">{row.label}</Typography>
                    <Typography fontSize={13} color="#0f172a" fontWeight={600} textAlign="right" maxWidth="60%">{row.val}</Typography>
                  </Stack>
                ))}
              </Box>
            </Box>
          )}

          {/* ── Step 10: Nashr ───────────────────────────────────────────── */}
          {step === 10 && (
            <Box>
              <SectionTitle title="Nashr turi" sub="E'lon joylashtirish turini tanlang" />

              {/* Plans */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, mb: 4 }}>
                {([
                  {
                    key: 'standard',
                    icon: <Rocket size={22} color="#4f46e5" weight="fill" />,
                    title: "Standart",
                    desc: "Asosiy e'lon — barcha frilanserlar ko'ra oladi",
                    badge: null,
                    price: "Bepul",
                    color: '#4f46e5',
                  },
                  {
                    key: 'plus',
                    icon: <Star size={22} color="#0891b2" weight="fill" />,
                    title: "Standart Plus",
                    desc: "Tez taklif olish uchun birinchi o'rinlarda ko'rsatiladi",
                    badge: "Mashhur",
                    price: "Tez orada",
                    color: '#0891b2',
                  },
                  {
                    key: 'premium',
                    icon: <Lightning size={22} color="#7c3aed" weight="fill" />,
                    title: "Premium",
                    desc: "7 kun davomida eng yuqori o'rinda, push-bildirishnomalar",
                    badge: "Eng yaxshi",
                    price: "Tez orada",
                    color: '#7c3aed',
                  },
                ] as const).map(plan => (
                  <Box
                    key={plan.key}
                    onClick={() => setPublishPlan(plan.key)}
                    sx={{
                      p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                      border: `2px solid ${publishPlan === plan.key ? plan.color : '#e2e8f0'}`,
                      bgcolor: publishPlan === plan.key ? `${plan.color}08` : 'white',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    {plan.badge && (
                      <Chip label={plan.badge} size="small" sx={{ position: 'absolute', top: 10, right: 10, bgcolor: plan.color, color: 'white', fontWeight: 700, fontSize: 10, height: 20 }} />
                    )}
                    <Box mb={1.5}>{plan.icon}</Box>
                    <Typography fontWeight={800} fontSize={15} color="#0f172a" mb={0.5}>{plan.title}</Typography>
                    <Typography fontSize={12} color="#64748b" mb={2}>{plan.desc}</Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography fontWeight={900} fontSize={16} color={plan.color}>{plan.price}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Extra services */}
              <Typography fontWeight={700} fontSize={14} color="#0f172a" mb={1.5}>Qo'shimcha xizmatlar</Typography>
              <Stack spacing={1.5} mb={3}>
                {[
                  { label: "Tezkor ko'rsatish", desc: "48 soat birinchi o'rinlarda — 4x ko'proq taklif", badge: "Tez orada" },
                  { label: "Telegram kanalida e'lon", desc: "Bizning kanalda 10 000+ obunachilar ko'radi", badge: "Tez orada" },
                ].map(svc => (
                  <Box key={svc.label} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: 'white' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
                          <Typography fontWeight={600} fontSize={14} color="#0f172a">{svc.label}</Typography>
                          <Chip label={svc.badge} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f1f5f9', color: '#64748b' }} />
                        </Stack>
                        <Typography fontSize={12} color="#94a3b8">{svc.desc}</Typography>
                      </Box>
                      <Switch disabled size="small" />
                    </Stack>
                  </Box>
                ))}
              </Stack>

              {/* Summary */}
              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: '#f8fafc' }}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography fontSize={13} color="#64748b">Nashr turi</Typography>
                  <Typography fontSize={13} fontWeight={700} color="#0f172a">
                    {publishPlan === 'standard' ? 'Standart' : publishPlan === 'plus' ? 'Standart Plus' : 'Premium'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontSize={14} fontWeight={800} color="#0f172a">Jami:</Typography>
                  <Typography fontSize={14} fontWeight={800} color="#16a34a">Bepul</Typography>
                </Stack>
              </Box>
            </Box>
          )}

          {/* ── Navigation buttons ───────────────────────────────────────── */}
          <Stack direction="row" justifyContent="space-between" mt={5} pt={3} sx={{ borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="text"
              onClick={step === 1 ? () => router.push('/my-works') : back}
              sx={{ color: '#4f46e5', fontWeight: 600, fontSize: 14 }}
            >
              {step === 1 ? 'Bekor qilish' : '← Orqaga'}
            </Button>

            {step < 10 ? (
              <Button
                variant="contained"
                onClick={next}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 4, py: 1.2, fontWeight: 700, fontSize: 14 }}
              >
                Davom etish →
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={!loading && <Rocket size={16} weight="fill" />}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2, px: 4, py: 1.2, fontWeight: 700, fontSize: 14 }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'E\'lonni joylash'}
              </Button>
            )}
          </Stack>
        </Box>

        {/* ── Right sidebar: steps ─────────────────────────────────────────── */}
        <Box sx={{
          width: 220, flexShrink: 0, position: 'sticky', top: 90,
          bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, p: 2,
          display: { xs: 'none', lg: 'block' },
        }}>
          <Stack spacing={0.5}>
            {STEPS.map(s => {
              const done    = s.id < step;
              const current = s.id === step;
              return (
                <Stack key={s.id} direction="row" alignItems="center" spacing={1.5}
                  sx={{ py: 1, px: 1.5, borderRadius: 2, cursor: done ? 'pointer' : 'default', bgcolor: current ? '#eef2ff' : 'transparent', '&:hover': done ? { bgcolor: '#f8fafc' } : {} }}
                  onClick={() => { if (done) setStep(s.id); }}
                >
                  {done ? (
                    <CheckCircle size={18} color="#16a34a" weight="fill" />
                  ) : current ? (
                    <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #4f46e5', bgcolor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />
                    </Box>
                  ) : (
                    <Circle size={18} color="#d1d5db" />
                  )}
                  <Typography
                    fontSize={13}
                    fontWeight={current ? 700 : done ? 600 : 400}
                    color={current ? '#4f46e5' : done ? '#0f172a' : '#9ca3af'}
                  >
                    {s.label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </>
  );
};

export default withLayoutBasic(CreateJobPage);
