import React from 'react';
import { useReactiveVar } from '@apollo/client';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Prohibit as BlockIcon } from '@phosphor-icons/react';
import { spamModalVar, closeSpamModal } from '../../../apollo/store';

// ─── SpamModal ────────────────────────────────────────────────────────────────
// Shown globally whenever the backend returns FORBIDDEN + SPAM_RESTRICTED.
// The user cannot dismiss this easily — they must click the button.
// The reason text (set by the admin) is shown so the user understands why.

export default function SpamModal() {
  const { open, reason } = useReactiveVar(spamModalVar);

  return (
    <Dialog
      open={open}
      onClose={() => {}} // intentionally non-dismissable on backdrop click
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '2px solid #ef4444',
          overflow: 'hidden',
        },
      }}
    >
      {/* Red header stripe */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          py: 3,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BlockIcon size={32} color="#fff" />
        </Box>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>
          Hisobingiz cheklangan
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 2, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: '#16161F', mb: 2, lineHeight: 1.7 }}>
          Sizning hisobingiz <strong>spam</strong> sifatida belgilangan. Siz hech qanday amal bajara olmaysiz.
        </Typography>

        {reason ? (
          <Box
            sx={{
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 2,
              px: 2,
              py: 1.5,
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Sabab:
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
              {reason}
            </Typography>
          </Box>
        ) : null}

        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Muammo bo'lsa, admin bilan bog'laning.
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={closeSpamModal}
          sx={{
            bgcolor: '#ef4444',
            '&:hover': { bgcolor: '#dc2626' },
            fontWeight: 700,
            py: 1.2,
            borderRadius: 2,
          }}
        >
          Tushunarli
        </Button>
      </DialogContent>
    </Dialog>
  );
}
