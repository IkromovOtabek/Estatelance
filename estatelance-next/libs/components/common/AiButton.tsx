import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import { Sparkle, Copy, Check } from '@phosphor-icons/react';
import { AI_ASSIST } from '../../../apollo/ai/mutation';

interface AiButtonProps {
  /** Action key sent to backend (e.g. 'job_title', 'job_description') */
  action: string;
  /** Context data for the AI (title, category, existing text, etc.) */
  context: string;
  /** Called with the AI result the user selects/applies */
  onApply: (text: string) => void;
  /** Small tooltip label shown on hover */
  label?: string;
  /** If true shows a smaller icon-only button */
  compact?: boolean;
}

export default function AiButton({ action, context, onApply, label = 'AI yordami', compact = false }: AiButtonProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const [aiAssist, { loading }] = useMutation(AI_ASSIST);

  const handleOpen = async () => {
    setResult('');
    setOpen(true);
    try {
      const { data } = await aiAssist({ variables: { action, context } });
      setResult(data?.aiAssist ?? '');
    } catch {
      setResult('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApply(result);
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={label} placement="top">
        {compact ? (
          <IconButton
            size="small"
            onClick={handleOpen}
            sx={{
              color: '#7c3aed',
              bgcolor: '#f5f3ff',
              border: '1px solid #ddd6fe',
              '&:hover': { bgcolor: '#ede9fe' },
              width: 30,
              height: 30,
            }}
          >
            <Sparkle size={15} weight="fill" />
          </IconButton>
        ) : (
          <Button
            size="small"
            onClick={handleOpen}
            startIcon={<Sparkle size={14} weight="fill" />}
            sx={{
              fontSize: 12,
              color: '#7c3aed',
              bgcolor: '#f5f3ff',
              border: '1px solid #ddd6fe',
              '&:hover': { bgcolor: '#ede9fe', borderColor: '#7c3aed' },
              py: 0.5,
              px: 1.5,
              borderRadius: 2,
              whiteSpace: 'nowrap',
            }}
          >
            AI
          </Button>
        )}
      </Tooltip>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={16} color="#7c3aed" weight="fill" />
            </Box>
            <Typography fontWeight={700} fontSize={15}>AI Yordamchi</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ minHeight: 120 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" py={4} spacing={1.5}>
              <CircularProgress size={28} sx={{ color: '#7c3aed' }} />
              <Typography fontSize={13} color="#64748b">AI yozmoqda...</Typography>
            </Stack>
          ) : result ? (
            <Box>
              <Box
                sx={{
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 2,
                  fontSize: 14,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  color: '#1e293b',
                  maxHeight: 320,
                  overflowY: 'auto',
                }}
              >
                {result}
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
          <Button size="small" onClick={() => setOpen(false)} sx={{ color: '#64748b', fontSize: 13 }}>
            Bekor qilish
          </Button>
          {result && !loading && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                onClick={handleCopy}
                sx={{ fontSize: 12, borderColor: '#e2e8f0', color: '#475569' }}
              >
                {copied ? 'Nusxalandi' : 'Nusxalash'}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleApply}
                startIcon={<Check size={14} weight="bold" />}
                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontSize: 13 }}
              >
                Qo'llash
              </Button>
            </>
          )}
          {!loading && (
            <Button
              size="small"
              variant="text"
              startIcon={<Sparkle size={13} weight="fill" />}
              onClick={handleOpen}
              sx={{ fontSize: 12, color: '#7c3aed' }}
            >
              Qayta
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
