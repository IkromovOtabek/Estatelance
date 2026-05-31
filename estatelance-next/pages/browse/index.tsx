import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MagnifyingGlass as SearchIcon, Star as StarIcon, MapPin as LocationOnIcon, User as UserIcon } from '@phosphor-icons/react';
import { GET_FREELANCERS } from '../../apollo/user/query';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { User } from '../../libs/types';
import { JobCategory, JOB_CATEGORY_LABELS } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

// ─── Sidebar category item ────────────────────────────────────────────────────
const CatItem = ({
  icon, label, active, onClick,
}: { icon?: React.ReactElement; label: string; active: boolean; onClick: () => void }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      px: 2, py: 1.1, borderRadius: 2, cursor: 'pointer',
      bgcolor: active ? '#eef2ff' : 'transparent',
      color: active ? '#4f46e5' : '#374151',
      fontWeight: active ? 700 : 500,
      fontSize: 13.5,
      transition: 'all 0.15s',
      '&:hover': { bgcolor: active ? '#eef2ff' : '#f8fafc', color: active ? '#4f46e5' : '#0f172a' },
    }}
  >
    {icon && <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</Box>}
    <Typography fontSize="inherit" fontWeight="inherit" color="inherit" noWrap>{label}</Typography>
  </Box>
);

// ─── Freelancer card — horizontal list style ──────────────────────────────────
const FreelancerListCard = ({ freelancer }: { freelancer: User }) => {
  const catKey = freelancer.freelancerCategory ?? 'OTHER';
  const catLabel = freelancer.freelancerCategory
    ? JOB_CATEGORY_LABELS[freelancer.freelancerCategory as JobCategory]
    : 'Boshqa';
  const isAvailable = freelancer.availability === 'AVAILABLE';

  return (
    <Link href={`/profile/${freelancer._id}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 2.5,
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          gap: 2.5,
          alignItems: 'flex-start',
          cursor: 'pointer',
          transition: 'all 0.18s',
          '&:hover': { borderColor: '#c7d2fe', boxShadow: '0 4px 20px rgba(79,70,229,0.08)', transform: 'translateY(-1px)' },
        }}
      >
        {/* Avatar */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={freelancer.profileImage}
            sx={{ width: 56, height: 56, border: '2px solid #e0e7ff', fontSize: 22 }}
          >
            {(freelancer.fullName ?? freelancer.username)?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{
            position: 'absolute', bottom: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: isAvailable ? '#22c55e' : '#f59e0b',
            border: '2px solid white',
          }} />
        </Box>

        {/* Main info */}
        <Box flex={1} minWidth={0}>
          {/* Name + rating row */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box minWidth={0}>
              <Typography fontWeight={700} fontSize={16} color="#0f172a" noWrap>
                {freelancer.fullName ?? freelancer.username}
              </Typography>
              <Typography fontSize={12} color="#94a3b8">@{freelancer.username}</Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={0.5} flexShrink={0}>
              <StarIcon size={15} color="#f59e0b" />
              <Typography fontSize={14} fontWeight={800} color="#0f172a">
                {freelancer.averageRating?.toFixed(1) ?? '5.0'}
              </Typography>
              <Typography fontSize={12} color="#94a3b8">
                ({freelancer.completedJobCount ?? 0})
              </Typography>
            </Stack>
          </Stack>

          {/* Category + rate chips */}
          <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1}>
            <Chip
              icon={getCatIcon(catKey, 13)}
              label={catLabel}
              size="small"
              sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600 }}
            />
            {freelancer.hourlyRate && (
              <Chip
                label={`$${freelancer.hourlyRate}/soat`}
                size="small"
                sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700 }}
              />
            )}
            <Chip
              label={isAvailable ? 'Bo\'sh' : 'Band'}
              size="small"
              sx={{
                bgcolor: isAvailable ? '#ecfdf5' : '#fff7ed',
                color: isAvailable ? '#059669' : '#d97706',
                fontSize: 11, fontWeight: 600,
              }}
            />
          </Stack>

          {/* Bio */}
          {freelancer.bio && (
            <Typography
              fontSize={13.5} color="#64748b" mt={1} lineHeight={1.6}
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {freelancer.bio}
            </Typography>
          )}

          {/* Skills + location */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5} flexWrap="wrap" gap={1}>
            {freelancer.skills && freelancer.skills.length > 0 && (
              <Stack direction="row" gap={0.5} flexWrap="wrap">
                {freelancer.skills.slice(0, 4).map(skill => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11, height: 20, borderColor: '#e2e8f0', color: '#64748b' }}
                  />
                ))}
                {freelancer.skills.length > 4 && (
                  <Typography fontSize={11} color="#94a3b8" alignSelf="center">
                    +{freelancer.skills.length - 4}
                  </Typography>
                )}
              </Stack>
            )}
            {freelancer.location && (
              <Stack direction="row" alignItems="center" spacing={0.5} flexShrink={0}>
                <LocationOnIcon size={13} color="#94a3b8" />
                <Typography fontSize={12} color="#94a3b8">{freelancer.location}</Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>
    </Link>
  );
};

// ─── Browse Page ──────────────────────────────────────────────────────────────
const BrowsePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput]           = useState('');
  const [searchText, setSearchText]             = useState('');

  const { data, loading } = useQuery(GET_FREELANCERS, {
    variables: { input: { page: 1, limit: 30, category: selectedCategory || undefined, searchText: searchText || undefined } },
    fetchPolicy: 'cache-and-network',
  });

  const freelancers: User[] = data?.getFreelancers ?? [];

  return (
    <>
      <Head>
        <title>Frilanserlar — BuFu | O'zbekiston mutaxassislari</title>
        <meta name="description" content="O'zbekistondagi eng yaxshi frilanserlar. IT dasturchilar, dizaynerlar, fotosuratchilar, 3D renderchilar va boshqa mutaxassislarni toping." />
        <meta name="keywords" content="frilanser, mutaxassis, IT dasturchi, dizayner, fotograf, O'zbekiston freelancer, Toshkent mutaxassis" />
        <link rel="canonical" href="https://bufu.uz/browse" />
      </Head>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* ════ LEFT SIDEBAR ════ */}
        <Box sx={{ width: 250, flexShrink: 0, display: { xs: 'none', md: 'block' }, position: 'sticky', top: 80 }}>
          {/* Search */}
          <TextField
            placeholder="Qidirish..."
            value={searchInput}
            size="small"
            fullWidth
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearchText(searchInput); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={17} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
          />

          {/* Categories */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden', p: 1 }}>
            <Typography fontSize={11} fontWeight={700} color="#94a3b8" px={2} pt={1} pb={0.5} textTransform="uppercase" letterSpacing={0.8}>
              Barcha kategoriyalar
            </Typography>
            <CatItem label="Hammasi" active={!selectedCategory} onClick={() => setSelectedCategory('')} />
            <Divider sx={{ my: 0.5, mx: 2 }} />
            {Object.values(JobCategory).map(cat => (
              <CatItem
                key={cat}
                icon={getCatIcon(cat, 17)}
                label={JOB_CATEGORY_LABELS[cat]}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </Box>
        </Box>

        {/* ════ MAIN CONTENT ════ */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                {selectedCategory && (
                  <Box sx={{ display: 'flex', color: '#4f46e5' }}>{getCatIcon(selectedCategory, 22)}</Box>
                )}
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {selectedCategory
                    ? JOB_CATEGORY_LABELS[selectedCategory as JobCategory]
                    : 'Barcha frilanserlar'}
                </Typography>
              </Stack>
              <Typography fontSize={13} color="text.secondary">
                {loading ? '...' : `${freelancers.length} ta mutaxassis topildi`}
              </Typography>
            </Box>
          </Stack>

          {/* Mobile category scroll */}
          <Box sx={{
            display: { xs: 'flex', md: 'none' }, gap: 1, mb: 2.5,
            overflowX: 'auto', pb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {/* Mobile search */}
            <TextField
              placeholder="Qidirish..."
              value={searchInput}
              size="small"
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearchText(searchInput); }}
              sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
            />
          </Box>

          {/* Results */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#4f46e5' }} />
            </Box>
          ) : freelancers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                <UserIcon size={44} color="#94a3b8" />
              </Box>
              <Typography fontWeight={600} mb={0.5}>Frilanser topilmadi</Typography>
              <Typography fontSize={13} color="text.secondary">Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {freelancers.map(f => (
                <FreelancerListCard key={f._id} freelancer={f} />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
};

export default withLayoutBasic(BrowsePage);
