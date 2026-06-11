import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowLeft,
  Heart as FavoriteIcon,
  Eye as VisibilityIcon,
  ChatCircle,
} from '@phosphor-icons/react';
import { GET_POST_BY_ID } from '../../apollo/user/query';
import { TOGGLE_LIKE_POST, ADD_COMMENT } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';

function fixImgUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/uploads/${url}`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'hozirgina';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

const ArticleDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;

  const { data, loading, refetch } = useQuery(GET_POST_BY_ID, {
    variables: { postId: id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const [toggleLike] = useMutation(TOGGLE_LIKE_POST);
  const [addComment] = useMutation(ADD_COMMENT);

  const post = data?.getPostById;
  const isLiked = post?.likedByUserIds?.includes(user._id);

  const handleLike = async () => {
    if (!post) return;
    if (!isLoggedIn) { window.dispatchEvent(new CustomEvent('bufu-auth-required')); return; }
    await toggleLike({ variables: { postId: post._id }, refetchQueries: ['GetPostById'] });
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    if (!isLoggedIn) { window.dispatchEvent(new CustomEvent('bufu-auth-required')); return; }
    setSending(true);
    try {
      await addComment({ variables: { postId: post._id, text: commentText.trim() } });
      setCommentText('');
      refetch();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary" mb={3}>Maqola topilmadi</Typography>
        <Button variant="contained" onClick={() => router.push('/articles')} startIcon={<ArrowLeft size={16} />}>
          Maqolalarga qaytish
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} — BuFu Maqolalar</title>
        <meta name="description" content={post.body?.slice(0, 160)} />
      </Head>

      {/* ── Back link ── */}
      <Box sx={{ mb: 3 }}>
        <Link href="/articles" style={{ textDecoration: 'none' }}>
          <Button
            size="small"
            startIcon={<ArrowLeft size={16} />}
            sx={{ color: 'text.secondary', fontSize: 13, px: 1, '&:hover': { color: 'primary.main' } }}
          >
            Barcha maqolalar
          </Button>
        </Link>
      </Box>

      <Box className="card-base" sx={{ overflow: 'hidden', maxWidth: 800, mx: 'auto' }}>
        {/* Cover image */}
        {post.imageUrl && (
          <Box sx={{ height: { xs: 220, sm: 360 }, overflow: 'hidden' }}>
            <img
              src={fixImgUrl(post.imageUrl)}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}

        <Box sx={{ p: { xs: 2.5, sm: 5 } }}>
          {/* Author */}
          <Link href={`/profile/${post.authorId}`} style={{ textDecoration: 'none' }}>
            <Stack
              direction="row" spacing={1.5} alignItems="center" mb={3}
              sx={{ width: 'fit-content', '&:hover .aname': { color: 'primary.main' } }}
            >
              <Avatar
                src={fixImgUrl(post.authorAvatar)}
                sx={(t) => ({
                  width: 42, height: 42,
                  bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.18 : 0.1),
                  color: 'primary.main', fontWeight: 700,
                })}
              >
                {post.authorName?.[0]}
              </Avatar>
              <Box>
                <Typography className="aname" fontWeight={700} fontSize={15} color="text.primary" sx={{ transition: 'color 0.15s' }}>
                  {post.authorName}
                </Typography>
                <Typography fontSize={12} color="text.secondary">{timeAgo(post.createdAt)}</Typography>
              </Box>
            </Stack>
          </Link>

          {/* Title */}
          <Typography variant="h4" fontWeight={900} mb={3} sx={{ lineHeight: 1.25, letterSpacing: -0.5 }}>
            {post.title}
          </Typography>

          {/* Body */}
          <Typography
            fontSize={16}
            color="text.secondary"
            sx={{ lineHeight: 1.85, whiteSpace: 'pre-wrap', mb: 4 }}
          >
            {post.body}
          </Typography>

          {/* Stats row */}
          <Stack
            direction="row" spacing={2} alignItems="center"
            sx={(t) => ({ py: 2.5, borderTop: `1px solid ${t.palette.divider}`, borderBottom: `1px solid ${t.palette.divider}`, mb: 4 })}
          >
            <Button
              size="small"
              startIcon={<FavoriteIcon weight={isLiked ? 'fill' : 'regular'} color="currentColor" />}
              onClick={handleLike}
              sx={{
                color: isLiked ? 'error.main' : 'text.secondary',
                fontSize: 13, px: 1,
                '&:hover': { bgcolor: 'action.hover', color: isLiked ? 'error.main' : 'primary.main' },
              }}
            >
              {post.likeCount} ta like
            </Button>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <VisibilityIcon size={16} color="currentColor" />
              <Typography fontSize={13} color="text.secondary">{post.viewCount} ta ko'rish</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ChatCircle size={16} color="currentColor" />
              <Typography fontSize={13} color="text.secondary">{post.comments?.length ?? 0} ta izoh</Typography>
            </Stack>
          </Stack>

          {/* Comments */}
          <Typography fontWeight={800} fontSize={17} mb={3}>
            Izohlar ({post.comments?.length ?? 0})
          </Typography>

          {(post.comments ?? []).length === 0 && (
            <Typography fontSize={14} color="text.secondary" mb={4}>Hozircha izoh yo'q. Birinchi bo'ling!</Typography>
          )}

          <Stack spacing={3} mb={4}>
            {(post.comments ?? []).map((c: any) => (
              <Stack key={c._id} direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                  src={fixImgUrl(c.authorAvatar)}
                  sx={(t) => ({
                    width: 34, height: 34,
                    bgcolor: alpha(t.palette.primary.main, 0.12),
                    color: 'primary.main', fontSize: 13, fontWeight: 700,
                  })}
                >
                  {c.authorName?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    <Typography fontWeight={700} fontSize={13} color="text.primary">{c.authorName}</Typography>
                    <Typography fontSize={11} color="text.secondary">{timeAgo(c.createdAt)}</Typography>
                  </Stack>
                  <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.6 }}>{c.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          {/* Add comment */}
          {isLoggedIn ? (
            <Box>
              <Divider sx={{ mb: 3 }} />
              <Typography fontWeight={700} fontSize={14} mb={1.5}>Izoh qoldirish</Typography>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                  src={fixImgUrl(user.profileImage)}
                  sx={(t) => ({ width: 34, height: 34, bgcolor: alpha(t.palette.primary.main, 0.12), color: 'primary.main', fontSize: 13, fontWeight: 700 })}
                >
                  {user.fullName?.[0] ?? user.username?.[0]}
                </Avatar>
                <Box flex={1}>
                  <TextField
                    fullWidth multiline minRows={2}
                    placeholder="Fikringizni yozing..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={sending}
                    size="small"
                    sx={{ mb: 1.5 }}
                  />
                  <Button
                    variant="contained" size="small"
                    onClick={handleComment}
                    disabled={sending || !commentText.trim()}
                    sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700, fontSize: 13 }}
                  >
                    {sending ? 'Yuborilmoqda…' : 'Yuborish'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Box sx={(t) => ({ p: 2.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.06), textAlign: 'center' })}>
              <Typography fontSize={14} color="text.secondary" mb={1.5}>Izoh qoldirish uchun tizimga kiring</Typography>
              <Link href="/account" style={{ textDecoration: 'none' }}>
                <Button variant="contained" size="small" sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}>
                  Kirish
                </Button>
              </Link>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default withLayoutBasic(ArticleDetailPage);
