import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation } from '@apollo/client';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Eye as Visibility, EyeSlash as VisibilityOff, ShieldCheck } from '@phosphor-icons/react';
import { ADMIN_LOGIN } from '../../apollo/admin/mutation';
import { saveToken } from '../../apollo/client';
import { setUserFromToken } from '../../apollo/store';
import { jwtDecode } from 'jwt-decode';

// ─── Admin Login Page ─────────────────────────────────────────────────────────
// This page is for administrators only.
// Regular users (Telegram login) cannot access the admin panel.
// URL: /_admin/login

const AdminLoginPage = () => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [adminLogin, { loading }] = useMutation(ADMIN_LOGIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      const { data } = await adminLogin({
        variables: { input: { username: username.trim().toLowerCase(), password } },
      });

      const result = data?.adminLogin;
      if (!result?.accessToken) {
        setErrorMsg('Login failed. Please try again.');
        return;
      }

      // Save the token and update the global user state
      saveToken(result.accessToken);
      setUserFromToken(jwtDecode(result.accessToken));

      // Redirect to the admin dashboard
      router.push('/_admin');
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Login failed.';
      setErrorMsg(msg);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login — BuFu</title>
      </Head>

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            bgcolor: '#16161F',
            borderRadius: 3,
            p: 4,
            border: '1px solid #27272F',
          }}
        >
          {/* Logo area */}
          <Stack alignItems="center" spacing={1} mb={4}>
            <Box
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#dc2626',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={30} color="white" weight="fill" />
            </Box>
            <Typography fontWeight={800} fontSize={20} color="white">
              Admin Panel
            </Typography>
            <Typography fontSize={13} color="#94a3b8" textAlign="center">
              BuFu administrator access only.
            </Typography>
          </Stack>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, fontSize: 13 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography fontSize={13} fontWeight={600} color="#94a3b8" mb={0.5}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0f172a',
                      color: 'white',
                      '& fieldset': { borderColor: '#27272F' },
                      '&:hover fieldset': { borderColor: '#4f46e5' },
                      '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                    },
                    '& input': { color: 'white' },
                  }}
                />
              </Box>

              <Box>
                <Typography fontSize={13} fontWeight={600} color="#94a3b8" mb={0.5}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#64748b' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0f172a',
                      color: 'white',
                      '& fieldset': { borderColor: '#27272F' },
                      '&:hover fieldset': { borderColor: '#4f46e5' },
                      '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                    },
                    '& input': { color: 'white' },
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  bgcolor: '#dc2626',
                  '&:hover': { bgcolor: '#b91c1c' },
                  fontWeight: 700,
                  py: 1.25,
                  mt: 1,
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Sign In as Admin'}
              </Button>
            </Stack>
          </form>

          <Typography fontSize={12} color="#3A3A48" textAlign="center" mt={3}>
            This area is restricted to authorized administrators.
          </Typography>
        </Box>
      </Box>
    </>
  );
};

// No layout wrapper — admin login has its own full-screen design
export default AdminLoginPage;
