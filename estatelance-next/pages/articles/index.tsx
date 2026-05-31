import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import { Alert, Avatar, Box, Button, CircularProgress, Divider, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Heart as FavoriteIcon, Heart as FavoriteBorderIcon, Eye as VisibilityIcon } from '@phosphor-icons/react';
import { GET_POSTS, GET_POST_BY_ID } from '../../apollo/user/query';
// GET_POSTS imported for refetchQueries
import { CREATE_POST, TOGGLE_LIKE_POST, ADD_COMMENT } from '../../apollo/user/mutation';
import { apolloClient } from '../../apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Post } from '../../libs/types';

const ArticlesPage = () => {
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
  const [commentError, setCommentError] = useState('');
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});

  const { data, loading, refetch } = useQuery(GET_POSTS, {
    variables: { page: 1, limit: 20 },
  });

  const [createPost, { loading: creating }] = useMutation(CREATE_POST);
  const [toggleLike] = useMutation(TOGGLE_LIKE_POST);
  const [addComment] = useMutation(ADD_COMMENT);

  const posts: Post[] = data?.getPosts ?? [];

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
    if (!isLoggedIn) return;
    await toggleLike({ variables: { postId }, refetchQueries: ['GetPosts'] });
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    if (!user._id) {
      setCommentError("Izoh yozish uchun tizimga kiring.");
      return;
    }
    setCommentSending(prev => ({ ...prev, [postId]: true }));
    try {
      const result = await addComment({
        variables: { input: { postId, text } },
        refetchQueries: [{ query: GET_POSTS, variables: { page: 1, limit: 20 } }],
      });
      if (result?.data) {
        setCommentText(prev => ({ ...prev, [postId]: '' }));
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

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Sohaviy maqolalar</Typography>
          <Typography color="text.secondary" fontSize={14}>Mutaxassislardan maslahat va tahlillar</Typography>
        </Box>
        {isLoggedIn && (
          <Button variant="contained" onClick={() => setShowWriteForm(!showWriteForm)} sx={{ bgcolor: '#4f46e5' }}>
            Maqola yozish
          </Button>
        )}
      </Stack>

      {showWriteForm && (
        <Box className="card-base" sx={{ p: 4, mb: 4 }}>
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
                  <Typography fontSize={13} color="#64748b">Mazmun *</Typography>
                </Stack>
                <TextField
                  value={postBody} onChange={e => setPostBody(e.target.value)}
                  fullWidth size="small" multiline rows={5} required
                  placeholder="Maqola matni..."
                />
              </Box>

              <TextField label="Muqova rasm URL (ixtiyoriy)" value={postImageUrl} onChange={e => setPostImageUrl(e.target.value)} fullWidth size="small" />
              <Button type="submit" variant="contained" disabled={creating} sx={{ bgcolor: '#4f46e5', alignSelf: 'flex-start' }}>
                {creating ? 'Joylashtirilmoqda...' : 'Maqolani e\'lon qilish'}
              </Button>
            </Stack>
          </form>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#4f46e5' }} /></Box>
      ) : (
        <Stack spacing={4}>
          {posts.map((post) => {
            const isLiked = post.likedByUserIds?.includes(user._id);
            const isExpanded = expandedPost === post._id;

            return (
              <Box key={post._id} className="card-base" sx={{ overflow: 'hidden' }}>
                {post.imageUrl && (
                  <Box sx={{ height: 220, overflow: 'hidden' }}>
                    <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}

                <Box sx={{ p: 4 }}>
                  {/* Author — clickable → profile */}
                  <Link href={`/profile/${post.authorId}`} style={{ textDecoration: 'none' }}>
                    <Stack
                      direction="row" spacing={1.5} alignItems="center" mb={2}
                      sx={{
                        width: 'fit-content',
                        '&:hover .author-name': { color: '#4f46e5' },
                        '&:hover .author-avatar': { borderColor: '#4f46e5' },
                      }}
                    >
                      <Avatar
                        className="author-avatar"
                        src={post.authorAvatar}
                        sx={{ width: 36, height: 36, border: '2px solid transparent', transition: 'border-color 0.15s' }}
                      >
                        {post.authorName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography
                          className="author-name"
                          fontWeight={600}
                          fontSize={14}
                          color="#0f172a"
                          sx={{ transition: 'color 0.15s' }}
                        >
                          {post.authorName}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">{post.createdAt?.slice(0, 10)}</Typography>
                      </Box>
                    </Stack>
                  </Link>

                  <Typography variant="h6" fontWeight={800} mb={1}>{post.title}</Typography>
                  <Typography fontSize={14} color="text.secondary" mb={2} sx={isExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.body}
                  </Typography>

                  <Button size="small" onClick={() => handleExpand(post._id)} sx={{ color: '#4f46e5', fontSize: 12, p: 0, mb: 2 }}>
                    {isExpanded ? 'Kamroq ko\'rish' : 'Ko\'proq o\'qish'}
                  </Button>

                  {/* Like + View */}
                  <Stack direction="row" spacing={2} alignItems="center" py={2} borderTop="1px solid #f1f5f9">
                    <Button size="small" startIcon={isLiked ? <FavoriteIcon weight="fill" color="#dc2626" /> : <FavoriteBorderIcon />} onClick={() => handleLike(post._id)} sx={{ color: '#64748b', fontSize: 12 }}>
                      {post.likeCount}
                    </Button>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <VisibilityIcon size={14} color="#94a3b8" />
                      <Typography fontSize={12} color="text.secondary">{post.viewCount}</Typography>
                    </Stack>
                    <Button size="small" onClick={() => handleExpand(post._id)} sx={{ color: '#64748b', fontSize: 12, ml: 'auto' }}>
                      {post.comments.length} ta izoh
                    </Button>
                  </Stack>

                  {/* Comments section */}
                  {isExpanded && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      {post.comments.map(c => (
                        <Stack key={c._id} direction="row" spacing={1.5} mb={2}>
                          <Avatar src={c.authorAvatar} sx={{ width: 28, height: 28, fontSize: 12 }}>{c.authorName?.[0]}</Avatar>
                          <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, flex: 1 }}>
                            <Typography fontWeight={600} fontSize={12}>{c.authorName}</Typography>
                            <Typography fontSize={13} color="text.secondary">{c.text}</Typography>
                          </Box>
                        </Stack>
                      ))}

                      {isLoggedIn && (
                        <Stack direction="row" spacing={1} mt={2}>
                          <TextField
                            size="small"
                            placeholder="Comment yozing... (Enter — yuborish)"
                            fullWidth
                            value={commentText[post._id] ?? ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                            disabled={commentSending[post._id]}
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
                            sx={{ bgcolor: '#4f46e5', whiteSpace: 'nowrap', minWidth: 72 }}
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
