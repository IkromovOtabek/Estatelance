import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, IconButton, Stack, Typography,
} from '@mui/material';
import { useTheme, alpha, type Theme } from '@mui/material/styles';
import {
  X, RocketLaunch, Lightning, Star, CheckCircle, ArrowLeft,
  CreditCard, Phone, Copy, Camera, UploadSimple, Image as ImageIcon,
} from '@phosphor-icons/react';
import { GET_BOOST_PAYMENT_INFO } from '../../../apollo/user/query';

export interface BoostPlan {
  key: string;
  name: string;
  priceLabel: string;
  days: number;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  badge?: string;
  features: string[];
}

export const BOOST_PLANS: BoostPlan[] = [
  {
    key: 'BASIC',
    name: 'Oddiy',
    priceLabel: 'Kelishiladi',
    days: 3,
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    icon: <RocketLaunch size={22} weight="fill" color="#4f46e5" />,
    features: [
      '3 kun davomida ro\'yxat tepasida',
      '🔵 Standart ko\'k chegara',
      'Barcha foydalanuvchilarga ko\'rinadi',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    priceLabel: 'Kelishiladi',
    days: 7,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#a78bfa',
    icon: <Lightning size={22} weight="fill" color="#7c3aed" />,
    badge: 'Mashhur',
    features: [
      '7 kun davomida ro\'yxat tepasida',
      '🟣 Premium binafsha chegara',
      'Barcha foydalanuvchilarga ko\'rinadi',
      '⚡ "Pro" belgisi',
    ],
  },
  {
    key: 'VIP',
    name: 'VIP',
    priceLabel: 'Kelishiladi',
    days: 30,
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fbbf24',
    icon: <Star size={22} weight="fill" color="#f59e0b" />,
    badge: 'Eng yaxshi',
    features: [
      '30 kun davomida ro\'yxat tepasida',
      '⭐ Oltin chegara va "VIP" belgisi',
      'Barcha foydalanuvchilarga ko\'rinadi',
      '🔔 Tegishli freelancerlarga bildirishnoma',
    ],
  },
];

interface BoostModalProps {
  open: boolean;
  /** Ko'rsatiladigan sarlavha (ish nomi yoki profil ismi) */
  subjectTitle: string;
  /** Masalan: ish | profil */
  subjectKind?: 'job' | 'profile';
  onClose: () => void;
  onSubmitReceipt: (plan: string, receiptUrl: string) => Promise<void>;
}

function copyText(text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

/** MUI + next-themes dark/light — BoostModal ichidagi qattiq ranglar o‘rniga */
function boostColors(theme: Theme) {
  const dark = theme.palette.mode === 'dark';
  return {
    dark,
    card: dark ? '#18181B' : '#ffffff',
    muted: dark ? '#27272A' : '#f8fafc',
    border: theme.palette.divider,
    text: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    label: dark ? '#a1a1aa' : '#94a3b8',
    iconBg: dark ? alpha(theme.palette.primary.main, 0.15) : '#f5f3ff',
    errorBg: dark ? alpha('#ef4444', 0.12) : '#fef2f2',
    errorBorder: dark ? alpha('#ef4444', 0.35) : '#fecaca',
    errorText: dark ? '#fca5a5' : '#b91c1c',
    errorText2: dark ? '#f87171' : '#991b1b',
    dashed: dark ? '#3f3f46' : '#cbd5e1',
    previewBg: dark ? '#0b1220' : '#f8fafc',
    planUnselected: dark ? '#18181B' : '#ffffff',
    copyIcon: dark ? '#a1a1aa' : '#64748b',
  };
}

function planCardBg(plan: BoostPlan, selected: boolean, dark: boolean) {
  if (!selected) return dark ? '#18181B' : '#ffffff';
  if (dark) return alpha(plan.color, 0.14);
  return plan.bg;
}

async function uploadReceiptFile(file: File): Promise<string> {
  const readAsDataUrl = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  let base64 = await readAsDataUrl();
  if (file.type.startsWith('image/') && file.size > 400_000) {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = base64;
    });
    const maxW = 1200;
    const scale = Math.min(1, maxW / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    base64 = canvas.toDataURL('image/jpeg', 0.82);
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, fileName: file.name }),
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.error || 'Rasm yuklanmadi');
  return data.url;
}

export default function BoostModal({
  open,
  subjectTitle,
  subjectKind = 'job',
  onClose,
  onSubmitReceipt,
}: BoostModalProps) {
  const listLabel =
    subjectKind === 'profile'
      ? "Frilanserlar ro'yxatida tepada ko'rinasiz"
      : "Ishlar ro'yxatida tepada ko'rinadi";
  const theme = useTheme();
  const c = boostColors(theme);

  const [step, setStep] = useState<'plan' | 'payment' | 'receipt'>('plan');
  const [selected, setSelected] = useState<string>('PRO');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<'card' | 'phone' | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fallbackCameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }
    setCameraOpen(false);
    setCameraReady(false);
    setCameraStarting(false);
    setCameraError(null);
  }, []);

  /** Stream video elementga ulanadi — Dialog mount bo‘lgach (ref avval null bo‘ladi) */
  const attachCameraStream = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.muted = true;
    video.playsInline = true;

    try {
      await video.play();
    } catch {
      /* ba'zi brauzerlarda ikkinchi urinish kerak */
      await new Promise((r) => setTimeout(r, 150));
      try {
        await video.play();
      } catch {
        return false;
      }
    }

    if (video.videoWidth > 0) {
      setCameraReady(true);
      setCameraStarting(false);
      return true;
    }
    return false;
  }, []);

  const setVideoNode = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && cameraOpen && streamRef.current) {
        void attachCameraStream();
      }
    },
    [cameraOpen, attachCameraStream],
  );

  useEffect(() => {
    if (!cameraOpen || !streamRef.current) return;

    let cancelled = false;
    const retry = async (attempt = 0) => {
      if (cancelled || attempt > 30) {
        if (!cancelled) {
          setCameraStarting(false);
          setCameraError('Kamera ko\'rinishi ulanmadi. Qayta urinib ko\'ring.');
        }
        return;
      }
      const ok = await attachCameraStream();
      if (!ok && !cancelled) {
        window.setTimeout(() => retry(attempt + 1), 100);
      }
    };

    retry();
    return () => {
      cancelled = true;
    };
  }, [cameraOpen, attachCameraStream]);

  useEffect(() => {
    if (!open) stopCamera();
  }, [open, stopCamera]);

  const openDeviceCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      fallbackCameraRef.current?.click();
      return;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraError(null);
    setCameraReady(false);
    setCameraStarting(true);
    setCameraOpen(true);

    try {
      const tryStream = (constraints: MediaStreamConstraints) =>
        navigator.mediaDevices.getUserMedia(constraints);

      let stream: MediaStream;
      try {
        stream = await tryStream({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await tryStream({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }
      streamRef.current = stream;
      await attachCameraStream();
    } catch (err: any) {
      setCameraOpen(false);
      setCameraStarting(false);
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Kameraga ruxsat bering (brauzer sozlamalari).'
          : err?.name === 'NotFoundError'
            ? 'Qurilmada kamera topilmadi.'
            : 'Kamera ochilmadi.';
      setCameraError(msg);
      fallbackCameraRef.current?.click();
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setUploading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Rasm olinmadi');
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.88),
      );
      if (!blob) throw new Error('Rasm olinmadi');
      const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      const url = await uploadReceiptFile(file);
      setReceiptUrl(url);
      setReceiptPreview(url.startsWith('/') ? url : url);
    } catch (e: any) {
      alert(e?.message ?? 'Yuklashda xato');
    } finally {
      setUploading(false);
    }
  };

  const { data: payData, loading: payLoading } = useQuery(GET_BOOST_PAYMENT_INFO, {
    skip: !open || step === 'plan',
    fetchPolicy: 'cache-first',
  });

  const payInfo = payData?.getBoostPaymentInfo;
  const selectedPlan = BOOST_PLANS.find((p) => p.key === selected)!;

  const resetReceipt = () => {
    setReceiptUrl(null);
    setReceiptPreview(null);
  };

  const handleClose = () => {
    if (loading || uploading || cameraStarting) return;
    stopCamera();
    setStep('plan');
    resetReceipt();
    setCopied(null);
    onClose();
  };

  const handleGoPayment = () => {
    resetReceipt();
    setStep('payment');
  };

  const handleGoReceipt = () => {
    resetReceipt();
    setStep('receipt');
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Faqat rasm (JPG, PNG) yuklang');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadReceiptFile(file);
      setReceiptUrl(url);
      setReceiptPreview(url.startsWith('/') ? url : url);
    } catch (e: any) {
      alert(e?.message ?? 'Yuklashda xato');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUrl) return;
    setLoading(true);
    try {
      await onSubmitReceipt(selected, receiptUrl);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (type: 'card' | 'phone', value: string) => {
    copyText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const hasRequisites = !!(payInfo?.cardNumber?.trim() || payInfo?.phoneNumber?.trim());

  const stepTitle =
    step === 'plan' ? 'Top ga chiqazish' : step === 'payment' ? "Bevosita to'lov" : 'To\'lov cheki';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          border: 1,
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, bgcolor: 'background.paper' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            {step !== 'plan' && (
              <IconButton
                size="small"
                onClick={() => setStep(step === 'receipt' ? 'payment' : 'plan')}
                disabled={loading || uploading}
                sx={{ mr: -0.5 }}
              >
                <ArrowLeft size={18} />
              </IconButton>
            )}
            <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RocketLaunch size={18} color={theme.palette.primary.main} weight="fill" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={16} color="text.primary">{stepTitle}</Typography>
              <Typography fontSize={12} color="text.secondary" noWrap sx={{ maxWidth: 240 }}>
                {subjectTitle}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleClose} disabled={loading || uploading}>
            <X size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 2, bgcolor: 'background.paper' }}>
        {step === 'plan' ? (
          <>
            <Typography fontSize={13} color="text.secondary" mb={2.5}>
              Tarif tanlang — admin to&apos;lov chekini tasdiqlagach boost yoqiladi.
            </Typography>

            <Stack spacing={1.5} mb={3}>
              {BOOST_PLANS.map((plan) => {
                const isSelected = selected === plan.key;
                return (
                  <Box
                    key={plan.key}
                    onClick={() => setSelected(plan.key)}
                    sx={{
                      p: 2, borderRadius: 2.5,
                      border: `2px solid ${isSelected ? plan.border : c.border}`,
                      bgcolor: planCardBg(plan, isSelected, c.dark),
                      cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: plan.border,
                        bgcolor: planCardBg(plan, true, c.dark),
                      },
                      position: 'relative',
                    }}
                  >
                    {plan.badge && (
                      <Chip
                        label={plan.badge} size="small"
                        sx={{ position: 'absolute', top: -10, right: 14, bgcolor: plan.color, color: 'white', fontWeight: 700, fontSize: 11, height: 20 }}
                      />
                    )}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                          width: 40, height: 40, borderRadius: 2,
                          bgcolor: c.dark ? (isSelected ? c.card : c.muted) : (isSelected ? '#fff' : plan.bg),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${plan.border}`,
                        }}>
                          {plan.icon}
                        </Box>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography fontWeight={800} fontSize={15} color={plan.color}>{plan.name}</Typography>
                            <Typography fontSize={12} color="text.secondary">· {plan.days} kun</Typography>
                          </Stack>
                          <Stack spacing={0.25} mt={0.5}>
                            {plan.features.slice(0, 2).map((f) => (
                              <Typography key={f} fontSize={11} color="text.secondary">{f}</Typography>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                      <Typography fontWeight={700} fontSize={13} color={plan.color}>{plan.priceLabel}</Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Button
              fullWidth variant="contained" size="large" onClick={handleGoPayment}
              sx={{ bgcolor: selectedPlan.color, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 800, py: 1.5, borderRadius: 2.5 }}
            >
              To&apos;lovga o&apos;tish — {selectedPlan.name} ({selectedPlan.days} kun)
            </Button>
          </>
        ) : step === 'payment' ? (
          <>
            <Box sx={{ bgcolor: c.muted, borderRadius: 2, p: 2, mb: 2, border: `1px solid ${c.border}` }}>
              <Typography fontSize={13} fontWeight={700} color="text.primary">
                {selectedPlan.name} tarifi · {selectedPlan.days} kun
              </Typography>
              <Typography fontSize={12} color="text.secondary" mt={0.5}>
                Summa: <strong style={{ color: c.text }}>{selectedPlan.priceLabel}</strong> — to&apos;lovdan keyin chek rasmini yuklang
              </Typography>
            </Box>

            {payLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : !hasRequisites ? (
              <Box sx={{ bgcolor: c.errorBg, border: `1px solid ${c.errorBorder}`, borderRadius: 2, p: 2, mb: 2 }}>
                <Typography fontSize={13} color={c.errorText} fontWeight={600}>
                  To&apos;lov rekvizitlari sozlanmagan
                </Typography>
                <Typography fontSize={12} color={c.errorText2} mt={0.5}>
                  PLATFORM_PAYMENT_CARD va PLATFORM_PAYMENT_PHONE ni server .env fayliga qo&apos;ying.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} mb={2}>
                <Typography fontSize={12} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                  BuFu rekvizitlari
                </Typography>
                {payInfo?.holderName && (
                  <Typography fontSize={13} color="text.primary" fontWeight={600}>{payInfo.holderName}</Typography>
                )}
                {payInfo?.cardNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: c.card, border: `1px solid ${c.border}`, borderRadius: 2, px: 2, py: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CreditCard size={18} color={theme.palette.primary.main} />
                      <Box>
                        <Typography fontSize={10} color="text.secondary">Karta</Typography>
                        <Typography fontSize={14} fontWeight={700} fontFamily="monospace" color="text.primary">{payInfo.cardNumber}</Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small" onClick={() => handleCopy('card', payInfo.cardNumber!)} title="Nusxalash">
                      <Copy size={16} color={copied === 'card' ? '#22c55e' : c.copyIcon} />
                    </IconButton>
                  </Box>
                )}
                {payInfo?.phoneNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: c.card, border: `1px solid ${c.border}`, borderRadius: 2, px: 2, py: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Phone size={18} color={theme.palette.primary.main} />
                      <Box>
                        <Typography fontSize={10} color="text.secondary">Telefon</Typography>
                        <Typography fontSize={14} fontWeight={700} color="text.primary">{payInfo.phoneNumber}</Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small" onClick={() => handleCopy('phone', payInfo.phoneNumber!)} title="Nusxalash">
                      <Copy size={16} color={copied === 'phone' ? '#22c55e' : c.copyIcon} />
                    </IconButton>
                  </Box>
                )}
                {payInfo?.paymentNote && (
                  <Typography fontSize={11} color="text.secondary" lineHeight={1.5}>{payInfo.paymentNote}</Typography>
                )}
              </Stack>
            )}

            <Button
              fullWidth variant="contained" size="large"
              onClick={handleGoReceipt}
              disabled={!hasRequisites || payLoading}
              sx={{ bgcolor: selectedPlan.color, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 800, py: 1.5, borderRadius: 2.5, mb: 1 }}
            >
              To&apos;lov qilindi — chek yuklash
            </Button>

            <Typography fontSize={11} color="text.secondary" textAlign="center">
              Chek admin tasdiqlagach boost avtomatik yoqiladi.
            </Typography>
          </>
        ) : (
          <>
            <Typography fontSize={13} color="text.secondary" mb={2}>
              To&apos;lov chekining skrinshot yoki fotosuratini yuklang. Admin tekshiradi.
            </Typography>

            <input
              ref={fallbackCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            <Stack direction="row" spacing={1.5} mb={cameraError ? 1 : 2}>
              <Button
                fullWidth variant="outlined"
                startIcon={cameraStarting || uploading ? <CircularProgress size={16} /> : <Camera size={18} />}
                onClick={openDeviceCamera}
                disabled={uploading || loading || cameraStarting}
                sx={{ fontWeight: 700, borderRadius: 2, py: 1.25, borderColor: 'divider', color: 'text.primary' }}
              >
                Kamera
              </Button>
              <Button
                fullWidth variant="outlined"
                startIcon={uploading ? <CircularProgress size={16} /> : <UploadSimple size={18} />}
                onClick={() => galleryRef.current?.click()}
                disabled={uploading || loading || cameraOpen}
                sx={{ fontWeight: 700, borderRadius: 2, py: 1.25, borderColor: 'divider', color: 'text.primary' }}
              >
                Yuklash
              </Button>
            </Stack>
            {cameraError && (
              <Typography fontSize={11} color={c.errorText} textAlign="center" sx={{ mb: 2 }}>
                {cameraError}
              </Typography>
            )}

            {receiptPreview && (
              <Box
                sx={{
                  mb: 2, borderRadius: 2, overflow: 'hidden', border: `1px solid ${c.border}`,
                  bgcolor: c.previewBg, position: 'relative',
                }}
              >
                <Box
                  component="img"
                  src={receiptPreview}
                  alt="Chek"
                  sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
                />
                <Button
                  size="small"
                  onClick={resetReceipt}
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: c.card, minWidth: 0, px: 1 }}
                >
                  <X size={14} color={c.text} />
                </Button>
              </Box>
            )}

            {!receiptPreview && (
              <Box
                sx={{
                  mb: 2, py: 4, borderRadius: 2, border: `2px dashed ${c.dashed}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                }}
              >
                <ImageIcon size={32} color={c.label} />
                <Typography fontSize={12} color="text.secondary">Chek rasmi tanlanmagan</Typography>
              </Box>
            )}

            <Button
              fullWidth variant="contained" size="large"
              onClick={handleSubmit}
              disabled={loading || uploading || !receiptUrl}
              startIcon={loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <CheckCircle size={18} weight="fill" />}
              sx={{ bgcolor: selectedPlan.color, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 800, py: 1.5, borderRadius: 2.5, mb: 1 }}
            >
              {loading ? 'Yuborilmoqda...' : 'Admin ga yuborish'}
            </Button>

            <Typography fontSize={11} color="text.secondary" textAlign="center">
              {subjectKind === 'profile'
                ? `Tasdiqlangach profilingizda statistika ko'rinadi. ${listLabel}.`
                : 'Tasdiqlangach "Mening ishlarim" da boost statistikasi ko\'rinadi.'}
            </Typography>
          </>
        )}
      </DialogContent>

      {/* Kamera — modal (to'liq ekran emas) */}
      <Dialog
        open={cameraOpen}
        onClose={stopCamera}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        sx={{ zIndex: (t) => t.zIndex.modal + 2 }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.55)' } }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: 1,
            borderColor: 'divider',
            boxShadow: c.dark
              ? '0 24px 48px rgba(0,0,0,0.55)'
              : '0 24px 48px rgba(15,23,42,0.18)',
          },
        }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2, bgcolor: 'background.paper' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  bgcolor: c.iconBg, display: 'grid', placeItems: 'center',
                }}
              >
                <Camera size={18} color={theme.palette.primary.main} weight="fill" />
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize={15} color="text.primary" lineHeight={1.2}>
                  Chek surati
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  To&apos;lov chekini ramka ichiga joylang
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={stopCamera} disabled={uploading} aria-label="Yopish">
              <X size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 2, pt: 2, bgcolor: 'background.paper' }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2.5,
              overflow: 'hidden',
              bgcolor: '#0a0a0a',
              aspectRatio: '4 / 3',
              maxHeight: { xs: 280, sm: 340 },
              border: `1px solid ${c.border}`,
            }}
          >
            {!cameraReady && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  bgcolor: 'rgba(0,0,0,0.75)',
                }}
              >
                <CircularProgress size={32} sx={{ color: '#fff', mb: 1 }} />
                <Typography fontSize={12} color="#e2e8f0" fontWeight={600}>
                  {cameraStarting ? 'Kamera yoqilmoqda...' : 'Ulanmoqda...'}
                </Typography>
              </Stack>
            )}

            <Box
              component="video"
              ref={setVideoNode}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                void attachCameraStream();
              }}
              onPlaying={() => {
                setCameraReady(true);
                setCameraStarting(false);
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />

            {/* Chek ramkasi */}
            <Box
              sx={{
                position: 'absolute', inset: '10%',
                border: '2px dashed rgba(255,255,255,0.55)',
                borderRadius: 2,
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
              }}
            />
          </Box>

          <Typography fontSize={12} color="text.secondary" textAlign="center" sx={{ mt: 1.5, mb: 2 }}>
            Matn va summa aniq ko&apos;rinsin. Suratga oling — avtomatik yuklanadi.
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={stopCamera}
              disabled={uploading}
              sx={{ flex: 1, fontWeight: 700, borderRadius: 2, borderColor: 'divider', color: 'text.primary' }}
            >
              Bekor
            </Button>
            <Button
              variant="contained"
              onClick={captureFromCamera}
              disabled={uploading || !cameraReady}
              startIcon={
                uploading ? (
                  <CircularProgress size={16} sx={{ color: 'inherit' }} />
                ) : (
                  <Camera size={18} weight="fill" />
                )
              }
              sx={{
                flex: 1.4,
                fontWeight: 800,
                py: 1.25,
                borderRadius: 2,
                bgcolor: selectedPlan.color,
                '&:hover': { filter: 'brightness(0.92)' },
                '&.Mui-disabled': { opacity: 0.5 },
              }}
            >
              {uploading ? 'Yuklanmoqda...' : 'Suratga olish'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
