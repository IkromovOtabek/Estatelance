import React, { useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, IconButton, Stack, Typography,
} from '@mui/material';
import { X, RocketLaunch, Lightning, Star, CheckCircle } from '@phosphor-icons/react';

interface Plan {
  key: string;
  name: string;
  price: number;
  days: number;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  badge?: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    key: 'BASIC',
    name: 'Oddiy',
    price: 3,
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
    price: 7,
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
    price: 15,
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
  jobTitle: string;
  onClose: () => void;
  onConfirm: (plan: string) => Promise<void>;
}

export default function BoostModal({ open, jobTitle, onClose, onConfirm }: BoostModalProps) {
  const [selected, setSelected] = useState<string>('PRO');
  const [loading, setLoading] = useState(false);

  const selectedPlan = PLANS.find(p => p.key === selected)!;

  const handlePay = async () => {
    setLoading(true);
    try {
      await onConfirm(selected);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RocketLaunch size={18} color="#7c3aed" weight="fill" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={16}>Top ga chiqazish</Typography>
              <Typography fontSize={12} color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                {jobTitle}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <X size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Typography fontSize={13} color="#64748b" mb={2.5}>
          Tarif tanlang — ish e'loningiz ro'yxat tepasiga chiqariladi va ko'proq freelancerlar ko'radi.
        </Typography>

        {/* Plan cards */}
        <Stack spacing={1.5} mb={3}>
          {PLANS.map(plan => {
            const isSelected = selected === plan.key;
            return (
              <Box
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: `2px solid ${isSelected ? plan.border : '#e2e8f0'}`,
                  bgcolor: isSelected ? plan.bg : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: plan.border, bgcolor: plan.bg },
                  position: 'relative',
                }}
              >
                {plan.badge && (
                  <Chip
                    label={plan.badge}
                    size="small"
                    sx={{
                      position: 'absolute', top: -10, right: 14,
                      bgcolor: plan.color, color: 'white',
                      fontWeight: 700, fontSize: 11, height: 20,
                    }}
                  />
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: isSelected ? 'white' : plan.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${plan.border}` }}>
                      {plan.icon}
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={800} fontSize={15} color={plan.color}>{plan.name}</Typography>
                        <Typography fontSize={12} color="#94a3b8">· {plan.days} kun</Typography>
                      </Stack>
                      <Stack spacing={0.25} mt={0.5}>
                        {plan.features.map(f => (
                          <Stack key={f} direction="row" spacing={0.5} alignItems="flex-start">
                            <CheckCircle size={13} color={plan.color} weight="fill" style={{ marginTop: 1, flexShrink: 0 }} />
                            <Typography fontSize={12} color="#475569">{f}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack alignItems="flex-end" flexShrink={0} ml={1}>
                    <Typography fontWeight={900} fontSize={22} color={plan.color} lineHeight={1}>
                      ${plan.price}
                    </Typography>
                    <Typography fontSize={11} color="#94a3b8">{plan.days} kun</Typography>
                    {isSelected && (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.75 }}>
                        <CheckCircle size={13} color="white" weight="fill" />
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>

        {/* Summary */}
        <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2, border: '1px solid #e2e8f0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.25}>
              <Typography fontSize={13} fontWeight={600} color="#0f172a">
                {selectedPlan.name} tarifi — {selectedPlan.days} kun
              </Typography>
              <Typography fontSize={12} color="#64748b">
                To'lov Payme orqali amalga oshiriladi
              </Typography>
            </Stack>
            <Typography fontWeight={900} fontSize={20} color={selectedPlan.color}>
              ${selectedPlan.price}
            </Typography>
          </Stack>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handlePay}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <RocketLaunch size={18} weight="fill" />}
          sx={{
            bgcolor: selectedPlan.color,
            '&:hover': { filter: 'brightness(0.9)' },
            fontWeight: 800,
            fontSize: 15,
            py: 1.5,
            borderRadius: 2.5,
            mb: 1,
          }}
        >
          {loading ? 'Amalga oshirilmoqda...' : `$${selectedPlan.price} to'lash va tepaga chiqazish`}
        </Button>

        <Typography fontSize={11} color="#94a3b8" textAlign="center" mb={1}>
          To'lovdan keyin ish darhol ro'yxat tepasiga chiqariladi
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
