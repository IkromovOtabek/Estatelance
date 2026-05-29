import React from 'react';
import Head from 'next/head';
import { useQuery } from '@apollo/client';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Megaphone, EnvelopeSimple, Newspaper } from '@phosphor-icons/react';
import { GET_ACTIVE_ANNOUNCEMENTS } from '../../apollo/admin/query';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Announcement } from '../../libs/types';
import { AnnouncementType } from '../../libs/enums';

// ─── Public Announcements Page ─────────────────────────────────────────────────
// Displays all active platform announcements and advertisements.
// URL: /announcements

const AnnouncementsPage = () => {
  const { data, loading, error } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const announcements: Announcement[] = data?.getActiveAnnouncements ?? [];

  return (
    <>
      <Head>
        <title>E'lonlar — BuFu</title>
      </Head>

      {/* Page Header */}
      <Box mb={4}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
          <Megaphone size={32} color="#4f46e5" weight="fill" />
          <Box>
            <Typography variant="h5" fontWeight={800}>E'lonlar</Typography>
            <Typography color="text.secondary" fontSize={14}>
              BuFu platformasidan rasmiy yangiliklar va e'lonlar.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          E'lonlarni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
        </Box>
      ) : announcements.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <EnvelopeSimple size={56} color="#94a3b8" />
          </Box>
          <Typography fontWeight={700} fontSize={18} mb={1}>Hozircha e'lon yo'q</Typography>
          <Typography color="text.secondary" fontSize={14}>
            Platforma yangiliklari va e'lonlar uchun keyinroq qarang.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {announcements.map((a) => (
            <Box
              key={a._id}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                bgcolor: 'white',
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}
            >
              {/* Banner image */}
              {a.imageUrl && (
                <Box
                  component="img"
                  src={a.imageUrl}
                  alt={a.title}
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mb: 2.5,
                  }}
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              )}

              {/* Type + Date */}
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                <Chip
                  icon={a.announcementType === AnnouncementType.ADVERTISEMENT
                    ? <Megaphone size={11} />
                    : <Newspaper size={11} />}
                  label={a.announcementType === AnnouncementType.ADVERTISEMENT ? 'Reklama' : "E'lon"}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    bgcolor: a.announcementType === AnnouncementType.ADVERTISEMENT ? '#fef3c7' : '#eef2ff',
                    color: a.announcementType === AnnouncementType.ADVERTISEMENT ? '#d97706' : '#4f46e5',
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
                {a.createdAt && (
                  <Typography fontSize={12} color="#94a3b8">
                    {new Date(a.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                )}
              </Stack>

              {/* Title */}
              <Typography fontWeight={800} fontSize={20} mb={1.5} color="#0f172a">
                {a.title}
              </Typography>

              {/* Body */}
              <Typography
                fontSize={15}
                color="#475569"
                lineHeight={1.7}
                sx={{ whiteSpace: 'pre-line' }}
              >
                {a.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
};

export default withLayoutBasic(AnnouncementsPage);
