import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import { Alert, Avatar, Box, Button, CircularProgress, Divider, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Heart as FavoriteIcon, Heart as FavoriteBorderIcon, Eye as VisibilityIcon } from '@phosphor-icons/react';
import { GET_POSTS, GET_POST_BY_ID } from '../../apollo/user/query';
// GET_POSTS imported for refetchQueries
import { CREATE_POST, TOGGLE_LIKE_POST, ADD_COMMENT } from '../../apollo/user/mutation';
import { apolloClient } from '../../apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Post } from '../../libs/types';

// Eski DB da rasmlar "/uploads/" prefikssiz saqlangan — normalize qilamiz
function fixImgUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/uploads/${url}`;
}

const ArticlesPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;

  const [showWriteForm, setShowWriteForm] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const autoExpandedRef = useRef(false);
  const [commentError, setCommentError] = useState('');
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});

  const { data, loading, refetch } = useQuery(GET_POSTS, {
    variables: { page: 1, limit: 20 },
  });

  const [createPost, { loading: creating }] = useMutation(CREATE_POST);
  const [toggleLike] = useMutation(TOGGLE_LIKE_POST);
  const [addComment] = useMutation(ADD_COMMENT);

  const posts: Post[] = data?.getPosts ?? [];

  // ?post=<id> query param — hero cartidan o'tganda shu maqolani ochib, scrollaydi
  useEffect(() => {
    const postId = router.query.post as string | undefined;
    if (!postId || autoExpandedRef.current || posts.length === 0) return;
    const target = posts.find((p) => p._id === postId);
    if (!target) return;
    autoExpandedRef.current = true;
    setExpandedPost(postId);
    // Biroz kechikib DOM element paydo bo'lgach scroll qilamiz
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [posts, router.query.post]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPost({ variables: { input: { title: postTitle, body: postBody, imageUrl: postImageUrl || undefined } } });
    setPostTitle(''); setPostBody(''); setPostImageUrl('');
    setShowWriteForm(false);
    refetch();
  };

  // Ko'rishlar sonini oshirish — faqat birinchi ochilganda
  const viewedPosts = React.useRef<Set<string>>(new Set());

  const handleExpand = (postId: string) => {
    const isCurrentlyExpanded = expandedPost === postId;
    setExpandedPost(isCurrentlyExpanded ? null : postId);

    // Birinchi marta ochilganda backend ga viewCount increment yuborish
    if (!isCurrentlyExpanded && !viewedPosts.current.has(postId)) {
      viewedPosts.current.add(postId);
      apolloClient.query({
        query: GET_POST_BY_ID,
        variables: { postId },
        fetchPolicy: 'network-only',
      }).then(({ data }) => {
        // GET_POSTS cache dagi post ni yangilash
        const updatedPost = data?.getPostById;
        if (!updatedPost) return;
        try {
          const cached = apolloClient.readQuery({ query: GET_POSTS, variables: { page: 1, limit: 20 } }) as any;
          if (cached?.getPosts) {
            apolloClient.writeQuery({
              query: GET_POSTS,
              variables: { page: 1, limit: 20 },
              data: {
                getPosts: cached.getPosts.map((p: any) =>
                  p._id === postId ? { ...p, viewCount: updatedPost.viewCount } : p
                ),
              },
            });
          }
        } catch {/* cache miss */}
      }).catch(() => {/* silent */});
    }
  };

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent('bufu-auth-required'));
      return;
    }
    await toggleLike({ variables: { postId }, refetchQueries: ['GetPosts'] });
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    if (!user._id) {
      window.dispatchEvent(new CustomEvent('bufu-auth-required'));
      return;
    }
    setCommentSending(prev => ({ ...prev, [postId]: true }));
    try {
      const result = await addComment({
        variables: { input: { postId, text } },
      });
      if (result?.data) {
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        refetch();
      }
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.networkError?.message ?? err?.message ?? "Izoh yuborishda xatolik. Qayta urinib ko'ring.";
      setCommentError(msg);
    } finally {
      setCommentSending(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <>
      <Head>
        <title>Maqolalar — BuFu | Frilanserlik haqida maslahatlar</title>
        <meta name="description" content="Frilanserlik, IT, dizayn va boshqa sohalar bo'yicha mutaxassislardan foydali maqolalar va maslahatlar. BuFu blog." />
        <meta name="keywords" content="frilanser maqolalar, IT maslahat, frilanserlik qanday, O'zbekiston freelance blog" />
        <link rel="canonical" href="https://bufu.uz/articles" />
      </Head>

      {/* Comment error snackbar */}
      <Snackbar
        open={!!commentError}
        autoHideDuration={4000}
        onClose={() => setCommentError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setCommentError('')}>{commentError}</Alert>
      </Snackbar>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={4}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Sohaviy maqolalar</Typography>
          <Typography color="text.secondary" fontSize={14}>Mutaxassislardan maslahat va tahlillar</Typography>
        </Box>
        {isLoggedIn && (
          <Button variant="contained" onClick={() => setShowWriteForm(!showWriteForm)}>
            Maqola yozish
          </Button>
        )}
      </Stack>

      {showWriteForm && (
        <Box className="card-base" sx={{ p: { xs: 2.5, sm: 4 }, mb: 4 }}>
          <form onSubmit={handleCreatePost}>
            <Stack spacing={2}>
              {/* Title */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <TextField
                  label="Sarlavha *" value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  fullWidth size="small" required
                />
              </Stack>

              {/* Body */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography fontSize={13} color="text.secondary">Mazmun *</Typography>
                </Stack>
                <TextField
                  value={postBody} onChange={e => setPostBody(e.target.value)}
                  fullWidth size="small" multiline rows={5} required
                  placeholder="Maqola matni..."
                />
              </Box>

              <TextField label="Muqova rasm URL (ixtiyoriy)" value={postImageUrl} onChange={e => setPostImageUrl(e.target.value)} fullWidth size="small" />
              <Button type="submit" variant="contained" disabled={creating} sx={{ alignSelf: 'flex-start' }}>
                {creating ? 'Joylashtirilmoqda...' : 'Maqolani e\'lon qilish'}
              </Button>
            </Stack>
          </form>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress color="primary" /></Box>
      ) : (
        <Stack spacing={4}>
          {posts.map((post) => {
            const isLiked = post.likedByUserIds?.includes(user._id);
            const isExpanded = expandedPost === post._id;

            return (
              <Box key={post._id} id={`post-${post._id}`} className="card-base" sx={{ overflow: 'hidden' }}>
                {post.imageUrl && (
                  <Box sx={{ height: 220, overflow: 'hidden' }}>
                    <img src={fixImgUrl(post.imageUrl)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}

                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  {/* Author — clickable → profile */}
                  <Link href={`/profile/${post.authorId}`} style={{ textDecoration: 'none' }}>
                    <Stack
                      direction="row" spacing={1.5} alignItems="center" mb={2}
                      sx={{
                        width: 'fit-content',
                        '&:hover .author-name': { color: 'primary.main' },
                        '&:hover .author-avatar': { borderColor: 'primary.main' },
                      }}
                    >
                      <Avatar
                        className="author-avatar"
                        src={fixImgUrl(post.authorAvatar)}
                        sx={(theme) => ({
                          width: 36,
                          height: 36,
                          border: '2px solid transparent',
                          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
                          color: 'primary.main',
                          fontWeight: 700,
                          transition: 'border-color 0.15s',
                        })}
                      >
                        {post.authorName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography
                          className="author-name"
                          fontWeight={600}
                          fontSize={14}
                          color="text.primary"
                          sx={{ transition: 'color 0.15s' }}
                        >
                          {post.authorName}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">{post.createdAt?.slice(0, 10)}</Typography>
                      </Box>
                    </Stack>
                  </Link>

                  <Link href={`/articles/${post._id}`} style={{ textDecoration: 'none' }}>
                    <Typography variant="h6" fontWeight={800} mb={1} sx={{ '&:hover': { color: 'primary.main' }, transition: 'color 0.15s', cursor: 'pointer' }}>{post.title}</Typography>
                  </Link>
                  <Typography fontSize={14} color="text.secondary" mb={2} sx={isExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.body}
                  </Typography>

                  <Button size="small" onClick={() => handleExpand(post._id)} sx={{ color: 'primary.main', fontSize: 12, p: 0, mb: 2 }}>
                    {isExpanded ? 'Kamroq ko\'rish' : 'Ko\'proq o\'qish'}
                  </Button>

                  {/* Like + View */}
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={(theme) => ({
                      py: 2,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      color: 'text.secondary',
                      flexWrap: 'wrap',
                    })}
                  >
                    <Button
                      size="small"
                      startIcon={isLiked ? <FavoriteIcon weight="fill" color="currentColor" /> : <FavoriteBorderIcon color="currentColor" />}
                      onClick={() => handleLike(post._id)}
                      sx={{
                        color: isLiked ? 'error.main' : 'text.secondary',
                        fontSize: 12,
                        minWidth: 0,
                        px: 1,
                        '&:hover': { bgcolor: 'action.hover', color: isLiked ? 'error.main' : 'primary.main' },
                      }}
                    >
                      {post.likeCount}
                    </Button>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                      <VisibilityIcon size={14} color="currentColor" />
                      <Typography fontSize={12} color="text.secondary">{post.viewCount}</Typography>
                    </Stack>
                    <Button
                      size="small"
                      onClick={() => handleExpand(post._id)}
                      sx={{
                        color: isExpanded ? 'primary.main' : 'text.secondary',
                        bgcolor: isExpanded ? 'action.selected' : 'transparent',
                        fontSize: 12,
                        ml: 'auto',
                        px: 1.25,
                        '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
                      }}
                    >
                      {post.comments.length} ta izoh
                    </Button>
                  </Stack>

                  {/* Comments section */}
                  {isExpanded && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      {post.comments.map(c => (
                        <Stack key={c._id} direction="row" spacing={1.5} mb={2} alignItems="flex-start">
                          <Avatar
                            src={fixImgUrl(c.authorAvatar)}
                            sx={(theme) => ({
                              width: 30,
                              height: 30,
                              fontSize: 12,
                              bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.14 : 0.08),
                              color: 'text.primary',
                              fontWeight: 700,
                              flexShrink: 0,
                            })}
                          >
                            {c.authorName?.[0]}
                          </Avatar>
                          <Box
                            sx={(theme) => ({
                              bgcolor: theme.palette.mode === 'dark'
                                ? alpha(theme.palette.common.white, 0.055)
                                : alpha(theme.palette.primary.main, 0.035),
                              border: `1px solid ${
                                theme.palette.mode === 'dark'
                                  ? alpha(theme.palette.common.white, 0.08)
                                  : alpha(theme.palette.primary.main, 0.08)
                              }`,
                              p: 1.5,
                              borderRadius: 2,
                              flex: 1,
                              minWidth: 0,
                            })}
                          >
                            <Typography fontWeight={700} fontSize={12} color="text.primary">{c.authorName}</Typography>
                            <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>{c.text}</Typography>
                          </Box>
                        </Stack>
                      ))}

                      {isLoggedIn && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={2}>
                          <TextField
                            size="small"
                            placeholder="Comment yozing... (Enter — yuborish)"
                            fullWidth
                            value={commentText[post._id] ?? ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                            disabled={commentSending[post._id]}
                            sx={(theme) => ({
                              '& .MuiOutlinedInput-root': {
                                bgcolor: theme.palette.mode === 'dark'
                                  ? alpha(theme.palette.common.white, 0.035)
                                  : theme.palette.background.paper,
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 0.85,
                              },
                            })}
                            onKeyDown={e => {
                              // Enter without Shift → submit comment
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleComment(post._id);
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleComment(post._id)}
                            disabled={commentSending[post._id] || !commentText[post._id]?.trim()}
                            sx={{ whiteSpace: 'nowrap', minWidth: 96, width: { xs: '100%', sm: 'auto' } }}
                          >
                            {commentSending[post._id] ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Yuborish'}
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </>
  );
};

export default withLayoutBasic(ArticlesPage);
