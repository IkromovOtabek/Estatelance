import React from 'react';
import Link from 'next/link';
import { Avatar, Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { Star as StarIcon, MapPin as LocationOnIcon, Briefcase as WorkIcon } from '@phosphor-icons/react';
import { User } from '../../types';
import { JOB_CATEGORY_LABELS, JobCategory } from '../../enums';

interface FreelancerCardProps {
  freelancer: User;
  onClick?: (freelancer: User) => void;
}

const FreelancerCard = ({ freelancer, onClick }: FreelancerCardProps) => {
  const categoryLabel = freelancer.freelancerCategory
    ? JOB_CATEGORY_LABELS[freelancer.freelancerCategory as JobCategory]
    : 'General';

  const isAvailable = freelancer.availability === 'AVAILABLE';

  return (
    <Link href={`/profile/${freelancer._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box
        onClick={() => onClick?.(freelancer)}
        sx={{
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          p: 2.5,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            borderColor: '#c7d2fe',
            boxShadow: '0 8px 32px rgba(79,70,229,0.12)',
            transform: 'translateY(-3px)',
          },
          // Subtle top accent on hover
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            opacity: 0,
            transition: 'opacity 0.2s',
          },
          '&:hover::before': { opacity: 1 },
        }}
      >
        {/* Availability dot */}
        <Tooltip title={isAvailable ? 'Bo\'sh' : 'Band'}>
          <Box
            sx={{
              position: 'absolute', top: 14, right: 14,
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: isAvailable ? '#22c55e' : '#f59e0b',
              boxShadow: isAvailable
                ? '0 0 0 3px rgba(34,197,94,0.2)'
                : '0 0 0 3px rgba(245,158,11,0.2)',
            }}
          />
        </Tooltip>

        {/* Avatar + Name */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={freelancer.profileImage}
              alt={freelancer.fullName}
              sx={{
                width: 52, height: 52,
                border: '2px solid #e0e7ff',
                bgcolor: '#4f46e5',
                fontSize: 20, fontWeight: 700,
              }}
            >
              {(freelancer.fullName ?? freelancer.username)?.[0]?.toUpperCase()}
            </Avatar>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} fontSize={15} color="#0f172a" className="truncate" lineHeight={1.3}>
              {freelancer.fullName ?? freelancer.username}
            </Typography>
            <Typography fontSize={12} color="#94a3b8" className="truncate">
              @{freelancer.username}
            </Typography>
          </Box>
        </Stack>

        {/* Category + Rating row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Chip
            label={categoryLabel}
            size="small"
            sx={{
              bgcolor: '#eef2ff', color: '#4f46e5',
              fontSize: 11, fontWeight: 600, height: 22,
            }}
          />
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <StarIcon size={13} color="#f59e0b" weight="fill" />
            <Typography fontSize={13} fontWeight={800} color="#0f172a">
              {freelancer.averageRating?.toFixed(1) ?? '5.0'}
            </Typography>
          </Stack>
        </Stack>

        {/* Bio */}
        {freelancer.bio && (
          <Typography fontSize={12.5} color="#64748b" className="line-clamp-2" lineHeight={1.65} mb={1.5} sx={{ flex: 1 }}>
            {freelancer.bio}
          </Typography>
        )}

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} mb={2}>
            {freelancer.skills.slice(0, 3).map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                variant="outlined"
                sx={{ fontSize: 10, height: 20, borderColor: '#e2e8f0', color: '#64748b' }}
              />
            ))}
            {freelancer.skills.length > 3 && (
              <Typography fontSize={10} color="#94a3b8" alignSelf="center">
                +{freelancer.skills.length - 3}
              </Typography>
            )}
          </Stack>
        )}

        {/* Footer row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          pt={1.5}
          sx={{ borderTop: '1px solid #f1f5f9', mt: 'auto' }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOnIcon size={12} color="#94a3b8" />
            <Typography fontSize={11.5} color="#94a3b8" noWrap>
              {freelancer.location || 'O\'zbekiston'}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {freelancer.hourlyRate && (
              <Typography fontSize={13} fontWeight={800} color="#4f46e5">
                ${freelancer.hourlyRate}<Typography component="span" fontSize={10} color="#94a3b8" fontWeight={400}>/soat</Typography>
              </Typography>
            )}
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <WorkIcon size={11} color="#94a3b8" />
              <Typography fontSize={11} color="#94a3b8">{freelancer.completedJobCount ?? 0}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Link>
  );
};

export default FreelancerCard;
