import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Plus as AddIcon,
  Trash as DeleteIcon,
  FloppyDisk as SaveIcon,
  ArrowLeft as ArrowBackIcon,
  CheckCircle,
  Timer,
  Image,
} from '@phosphor-icons/react';
import { GET_MY_PROFILE } from '../../apollo/user/query';
import { UPDATE_PROFILE } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { FreelancerAvailability, JobCategory, JOB_CATEGORY_LABELS, UserType } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

// ─── Portfolio Item state shape ───────────────────────────────────────────────
interface PortfolioItem {
  title: string;
  imageUrl: string;
  description: string;
}

// ─── Edit Profile Page ────────────────────────────────────────────────────────
// Allows the logged-in user to update all their profile fields.
// Freelancer-specific fields (category, hourly rate, skills, portfolio)
// are shown only when the user's role is FREELANCER.

const EditProfilePage = () => {
  const router = useRouter();
  const currentUser = useReactiveVar(userVar);
  const isLoggedIn = !!currentUser._id;
  const isFreelancer = currentUser.userType === UserType.FREELANCER;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [availability, setAvailability] = useState<FreelancerAvailability>(FreelancerAvailability.AVAILABLE);
  const [freelancerCategory, setFreelancerCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [initialized, setInitialized] = useState(false);

  // ── Load current profile ───────────────────────────────────────────────────
  const { data, loading } = useQuery(GET_MY_PROFILE, {
    skip: !isLoggedIn,
    fetchPolicy: 'network-only',
  });

  // Populate form fields from loaded profile (only once)
  useEffect(() => {
    const profile = data?.getMyProfile;
    if (profile && !initialized) {
      setFullName(profile.fullName ?? '');
      setBio(profile.bio ?? '');
      setLocation(profile.location ?? '');
      setProfileImage(profile.profileImage ?? '');
      setAvailability(profile.availability ?? FreelancerAvailability.AVAILABLE);
      setFreelancerCategory(profile.freelancerCategory ?? '');
      setHourlyRate(profile.hourlyRate ? String(profile.hourlyRate) : '');
      setSkills(profile.skills ?? []);
      setPortfolio(
        (profile.portfolio ?? []).map((p: any) => ({
          title: p.title ?? '',
          imageUrl: p.imageUrl ?? '',
          description: p.description ?? '',
        }))
      );
      setInitialized(true);
    }
  }, [data, initialized]);

  // ── Update mutation ────────────────────────────────────────────────────────
  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE);

  // ── Skill helpers ──────────────────────────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  // ── Portfolio helpers ──────────────────────────────────────────────────────
  const addPortfolioItem = () => {
    setPortfolio((prev) => [...prev, { title: '', imageUrl: '', description: '' }]);
  };

  const updatePortfolioItem = (idx: number, field: keyof PortfolioItem, value: string) => {
    setPortfolio((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removePortfolioItem = (idx: number) => {
    setPortfolio((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Build input — only include non-empty values
    const input: any = {};

    if (fullName.trim()) input.fullName = fullName.trim();
    if (bio.trim()) input.bio = bio.trim();
    if (location.trim()) input.location = location.trim();
    if (profileImage.trim()) input.profileImage = profileImage.trim();

    // Freelancer-specific fields
    if (isFreelancer) {
      input.availability = availability;
      if (freelancerCategory) input.freelancerCategory = freelancerCategory;
      if (hourlyRate && !isNaN(Number(hourlyRate))) input.hourlyRate = Number(hourlyRate);
      input.skills = skills;

      // Portfolio — only include complete items
      const validPortfolio = portfolio.filter((p) => p.title.trim() && p.imageUrl.trim());
      if (validPortfolio.length > 0 || portfolio.length === 0) {
        input.portfolio = validPortfolio.map((p) => ({
          title: p.title.trim(),
          imageUrl: p.imageUrl.trim(),
          description: p.description.trim(),
        }));
      }
    }

    try {
      const result = await updateProfile({ variables: { input } });
      const updated = result?.data?.updateProfile;

      // ── Sync header avatar in real-time ──────────────────────────────────
      // JWT in localStorage still has old profileImage — patch userVar directly
      // so the header avatar updates immediately without requiring re-login.
      if (updated) {
        userVar({
          ...currentUser,
          fullName: updated.fullName ?? currentUser.fullName,
          profileImage: updated.profileImage ?? currentUser.profileImage,
        });
      }

      setSuccessMsg('Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Failed to save profile.';
      setErrorMsg(msg);
    }
  };

  // ── Access guard ───────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <Typography fontSize={18} fontWeight={700} mb={2}>Please log in to edit your profile.</Typography>
        <Button variant="contained" onClick={() => router.push('/account')} sx={{ bgcolor: '#4f46e5' }}>
          Go to Login
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Profile — BuFu</title>
      </Head>

      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <IconButton onClick={() => router.push(`/profile/${currentUser._id}`)} sx={{ color: '#64748b' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800}>Edit Profile</Typography>
            <Typography color="text.secondary" fontSize={14}>Update your public profile information</Typography>
          </Box>
        </Stack>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMsg}{' '}
            <Box
              component="span"
              sx={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => router.push(`/profile/${currentUser._id}`)}
            >
              View profile →
            </Box>
          </Alert>
        )}
        {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>

            {/* ── Section: Basic Info ─────────────────────────────────── */}
            <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography fontWeight={700} mb={2.5} fontSize={15}>
                Basic Information
              </Typography>

              {/* Profile Image preview */}
              <Stack direction="row" spacing={3} alignItems="flex-start" mb={3}>
                <Avatar
                  src={profileImage || undefined}
                  sx={{ width: 72, height: 72, bgcolor: '#4f46e5', fontSize: 28, flexShrink: 0 }}
                >
                  {(fullName || currentUser.username)?.[0]?.toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Profile Image URL"
                    placeholder="https://example.com/my-photo.jpg"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    helperText="Paste a direct link to your profile photo"
                  />
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small"
                    label="Full Name"
                    placeholder="Otabek Ikromov"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small"
                    label="Location"
                    placeholder="Toshkent, UZ"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    placeholder="Tell people about yourself, your experience, and what you do..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    inputProps={{ maxLength: 500 }}
                    helperText={`${bio.length}/500`}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* ── Section: Freelancer Settings (only for freelancers) ─── */}
            {isFreelancer && (
              <>
                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Typography fontWeight={700} mb={2.5} fontSize={15}>
                    Freelancer Settings
                  </Typography>

                  <Grid container spacing={2}>
                    {/* Category */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Ixtisoslik yo'nalishi</InputLabel>
                        <Select
                          value={freelancerCategory}
                          label="Ixtisoslik yo'nalishi"
                          onChange={(e) => setFreelancerCategory(e.target.value)}
                        >
                          <MenuItem value="">— Tanlanmagan —</MenuItem>
                          {Object.values(JobCategory).map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {getCatIcon(cat, 18)}
                                <span>{JOB_CATEGORY_LABELS[cat]}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Hourly Rate */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth size="small"
                        label="Hourly Rate (USD)"
                        placeholder="25"
                        type="number"
                        inputProps={{ min: 0, max: 9999, step: 1 }}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                      />
                    </Grid>

                    {/* Availability */}
                    <Grid item xs={12}>
                      <Typography fontSize={13} fontWeight={600} color="text.secondary" mb={1}>
                        Availability
                      </Typography>
                      <ToggleButtonGroup
                        value={availability}
                        exclusive
                        onChange={(_, val) => val && setAvailability(val)}
                        size="small"
                      >
                        <ToggleButton
                          value={FreelancerAvailability.AVAILABLE}
                          sx={{ px: 2.5, fontSize: 13, textTransform: 'none', gap: 0.75,
                            '&.Mui-selected': { bgcolor: '#dcfce7', color: '#16a34a', borderColor: '#86efac' } }}
                        >
                          <CheckCircle size={16} /> Available for work
                        </ToggleButton>
                        <ToggleButton
                          value={FreelancerAvailability.BUSY}
                          sx={{ px: 2.5, fontSize: 13, textTransform: 'none', gap: 0.75,
                            '&.Mui-selected': { bgcolor: '#fef3c7', color: '#d97706', borderColor: '#fcd34d' } }}
                        >
                          <Timer size={16} /> Currently busy
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                  </Grid>
                </Box>

                {/* ── Section: Skills ─────────────────────────────────── */}
                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Typography fontWeight={700} mb={2} fontSize={15}>Skills</Typography>

                  <Stack direction="row" spacing={1} mb={2}>
                    <TextField
                      size="small"
                      placeholder="e.g. 3D Rendering, AutoCAD, Photoshop"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={addSkill}
                      startIcon={<AddIcon />}
                      sx={{ whiteSpace: 'nowrap', borderColor: '#e2e8f0', color: '#4f46e5' }}
                    >
                      Add
                    </Button>
                  </Stack>

                  {skills.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          onDelete={() => removeSkill(skill)}
                          size="small"
                          sx={{ fontSize: 12 }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      No skills added yet. Type a skill and press Enter or click Add.
                    </Typography>
                  )}
                </Box>

                {/* ── Section: Portfolio ──────────────────────────────── */}
                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Typography fontWeight={700} fontSize={15}>Portfolio</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addPortfolioItem}
                      sx={{ fontSize: 12, borderColor: '#e2e8f0', color: '#4f46e5' }}
                    >
                      Add Item
                    </Button>
                  </Stack>

                  {portfolio.length === 0 ? (
                    <Box
                      sx={{
                        py: 4, textAlign: 'center', border: '2px dashed #e2e8f0',
                        borderRadius: 2, cursor: 'pointer',
                      }}
                      onClick={addPortfolioItem}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <Image size={36} color="#94a3b8" />
                      </Box>
                      <Typography fontSize={14} color="text.secondary">
                        No portfolio items yet. Click to add your first project.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={3}>
                      {portfolio.map((item, idx) => (
                        <Box key={idx}>
                          {idx > 0 && <Divider sx={{ mb: 3 }} />}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Typography fontSize={13} fontWeight={600} color="#64748b">
                              Item #{idx + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => removePortfolioItem(idx)}
                              sx={{ color: '#dc2626' }}
                            >
                              <DeleteIcon size={20} />
                            </IconButton>
                          </Stack>

                          {/* Image preview */}
                          {item.imageUrl && (
                            <Box
                              component="img"
                              src={item.imageUrl}
                              alt={item.title}
                              sx={{
                                width: '100%', height: 160, objectFit: 'cover',
                                borderRadius: 2, mb: 1.5, border: '1px solid #e2e8f0',
                              }}
                              onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                          )}

                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth size="small"
                                label="Project Title"
                                placeholder="3D Apartment Rendering"
                                value={item.title}
                                onChange={(e) => updatePortfolioItem(idx, 'title', e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth size="small"
                                label="Image URL"
                                placeholder="https://..."
                                value={item.imageUrl}
                                onChange={(e) => updatePortfolioItem(idx, 'imageUrl', e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth size="small"
                                label="Description (optional)"
                                placeholder="Brief description of this project..."
                                value={item.description}
                                onChange={(e) => updatePortfolioItem(idx, 'description', e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            )}

            {/* ── Save Button ──────────────────────────────────────────── */}
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SaveIcon />}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, px: 4, fontWeight: 700 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push(`/profile/${currentUser._id}`)}
                sx={{ color: '#64748b', borderColor: '#e2e8f0' }}
              >
                Cancel
              </Button>
            </Stack>

          </Stack>
        </form>
      </Box>
    </>
  );
};

export default withLayoutBasic(EditProfilePage);
