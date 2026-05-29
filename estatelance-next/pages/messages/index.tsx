import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { PaperPlaneTilt as SendIcon, ArrowSquareOut as OpenInNewIcon, ChatCircle, EnvelopeSimple, Check, Hand } from '@phosphor-icons/react';
import { GET_MY_CONVERSATIONS, GET_CONVERSATION } from '../../apollo/user/query';
import { SEND_MESSAGE, MARK_MESSAGES_READ } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Message } from '../../libs/types';

// ─── Conversation summary ─────────────────────────────────────────────────────
interface ConversationSummary {
  otherUserId: string;
  otherUserName: string;
  otherUsername?: string;
  otherUserAvatar?: string;
  lastMessageText: string;
  lastMessageTime?: string;
  isUnread: boolean;
  iMine: boolean;
}

function buildConversationList(messages: Message[], myId: string): ConversationSummary[] {
  return messages.map((msg) => {
    const iAmSender = msg.senderId === myId;
    return {
      otherUserId:     iAmSender ? msg.receiverId       : msg.senderId,
      otherUserName:   iAmSender ? msg.receiverName     : msg.senderName,
      otherUsername:   iAmSender ? msg.receiverUsername : msg.senderUsername,
      otherUserAvatar: iAmSender ? msg.receiverAvatar   : msg.senderAvatar,
      lastMessageText: msg.text,
      lastMessageTime: msg.createdAt,
      isUnread: !msg.isRead && !iAmSender,
      iMine: iAmSender,
    };
  });
}

// ─── Robust time formatter — no locale dependency ─────────────────────────────
// Fixes "Invalid Date" caused by unsupported 'uz' locale in toLocaleTimeString()
function safeTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

function safeDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return safeTime(iso);
    if (diffDays === 1) return 'Kecha';
    if (diffDays < 7) {
      const days = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'];
      return days[d.getDay()];
    }
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return '';
  }
}

// ─── Messages Page ─────────────────────────────────────────────────────────────
const MessagesPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;

  const [selectedUserId,    setSelectedUserId]    = useState<string | null>(null);
  const [selectedUserName,  setSelectedUserName]  = useState('');
  const [selectedUsername,  setSelectedUsername]  = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>();
  const [messageText, setMessageText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Auto-select from query param ───────────────────────────────────────────
  useEffect(() => {
    if (router.isReady && router.query.userId) {
      setSelectedUserId(router.query.userId as string);
      setSelectedUserName(decodeURIComponent((router.query.userName as string) ?? 'User'));
    }
  }, [router.isReady, router.query.userId]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: convData, loading: convLoading, refetch: refetchConvs } = useQuery(GET_MY_CONVERSATIONS, {
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000,
  });

  const { data: msgData, loading: msgLoading } = useQuery(GET_CONVERSATION, {
    variables: { otherUserId: selectedUserId ?? '' },
    skip: !selectedUserId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 4000,
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);
  const [markAsRead]  = useMutation(MARK_MESSAGES_READ);

  const rawConvMessages: Message[] = convData?.getMyConversations ?? [];
  const conversations = buildConversationList(rawConvMessages, user._id);
  const messages: Message[] = msgData?.getConversation ?? [];

  // Sync avatar + username from conversations once data arrives
  useEffect(() => {
    if (selectedUserId && conversations.length > 0) {
      const found = conversations.find((c) => c.otherUserId === selectedUserId);
      if (found) {
        if (found.otherUserAvatar) setSelectedUserAvatar(found.otherUserAvatar);
        if (found.otherUsername)   setSelectedUsername(found.otherUsername);
      }
    }
  }, [conversations, selectedUserId]);

  // Sync username from messages (fallback)
  useEffect(() => {
    if (messages.length > 0 && !selectedUsername) {
      const msg = messages[0];
      const iAmSender = msg.senderId === user._id;
      const uname = iAmSender ? msg.receiverUsername : msg.senderUsername;
      if (uname) setSelectedUsername(uname);
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) {
      markAsRead({ variables: { otherUserId: selectedUserId } }).catch(() => {});
    }
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSelectConversation = (conv: ConversationSummary) => {
    setSelectedUserId(conv.otherUserId);
    setSelectedUserName(conv.otherUserName);
    setSelectedUsername(conv.otherUsername ?? '');
    setSelectedUserAvatar(conv.otherUserAvatar);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedUserId) return;
    setMessageText('');
    try {
      await sendMessage({
        variables: { input: { receiverId: selectedUserId, text } },
        refetchQueries: ['GetConversation', 'GetMyConversations'],
      });
      refetchConvs();
    } catch {
      setMessageText(text);
    }
  };

  if (!isLoggedIn) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography color="text.secondary">Xabarlarni ko'rish uchun tizimga kiring.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Head><title>Xabarlar — BuFu</title></Head>

      <Box sx={{
        display: 'flex',
        height: 'calc(100vh - 130px)',
        border: '1px solid #e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>

        {/* ══ LEFT: Conversation list ══ */}
        <Box sx={{
          width: 300,
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ChatCircle size={18} color="#4f46e5" weight="fill" />
              <Typography fontWeight={800} fontSize={16} color="#0f172a">Xabarlar</Typography>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {convLoading && conversations.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={24} sx={{ color: '#4f46e5' }} />
              </Box>
            )}
            {!convLoading && conversations.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <EnvelopeSimple size={40} color="#94a3b8" />
                </Box>
                <Typography fontSize={13} fontWeight={600} color="#0f172a">Yozishmalar yo'q</Typography>
                <Typography fontSize={12} color="text.secondary" mt={0.5}>
                  Freelancer profiliga kiring va "Message" tugmasini bosing
                </Typography>
              </Box>
            )}

            {conversations.map((conv) => {
              const isActive = selectedUserId === conv.otherUserId;
              return (
                <Box
                  key={conv.otherUserId}
                  onClick={() => handleSelectConversation(conv)}
                  sx={{
                    px: 2, py: 1.5,
                    cursor: 'pointer',
                    bgcolor: isActive ? '#eef2ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                    '&:hover': { bgcolor: isActive ? '#eef2ff' : '#f8fafc' },
                    transition: 'all 0.15s',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar
                        src={conv.otherUserAvatar || undefined}
                        sx={{
                          width: 42, height: 42,
                          bgcolor: '#4f46e5', fontSize: 16,
                          border: isActive ? '2px solid #4f46e5' : '2px solid transparent',
                        }}
                      >
                        {conv.otherUserName?.[0]?.toUpperCase()}
                      </Avatar>
                      {conv.isUnread && (
                        <Box sx={{
                          position: 'absolute', top: 0, right: 0,
                          width: 11, height: 11, borderRadius: '50%',
                          bgcolor: '#ef4444', border: '2px solid white',
                        }} />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          fontWeight={conv.isUnread ? 800 : 600}
                          fontSize={13}
                          color={isActive ? '#4f46e5' : '#0f172a'}
                          noWrap sx={{ maxWidth: 130 }}
                        >
                          {conv.otherUserName}
                        </Typography>
                        <Typography fontSize={10} color="#94a3b8" flexShrink={0} ml={0.5}>
                          {safeDate(conv.lastMessageTime)}
                        </Typography>
                      </Stack>
                      <Typography
                        fontSize={12}
                        color={conv.isUnread ? '#4f46e5' : 'text.secondary'}
                        fontWeight={conv.isUnread ? 600 : 400}
                        noWrap
                      >
                        {conv.iMine && <Check size={11} style={{ marginRight: 2, flexShrink: 0 }} />}{conv.lastMessageText}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ══ RIGHT: Chat area ══ */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f8fafc' }}>

          {!selectedUserId ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', px: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <ChatCircle size={56} color="#c7d2fe" weight="fill" />
                </Box>
                <Typography fontWeight={700} fontSize={16} color="#0f172a" mb={0.5}>Suhbatni tanlang</Typography>
                <Typography color="text.secondary" fontSize={13}>
                  Chapdan biron suhbatni tanlang yoki freelancer profilidan xabar yuboring
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* Chat Header */}
              <Box sx={{
                px: 2.5, py: 1.5,
                borderBottom: '1px solid #e2e8f0',
                bgcolor: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Tooltip title="Profilga o'tish">
                    <Avatar
                      src={selectedUserAvatar || undefined}
                      onClick={() => router.push(`/profile/${selectedUserId}`)}
                      sx={{
                        width: 38, height: 38, bgcolor: '#4f46e5', fontSize: 15,
                        cursor: 'pointer', '&:hover': { opacity: 0.85 }, transition: 'opacity 0.15s',
                      }}
                    >
                      {selectedUserName?.[0]?.toUpperCase()}
                    </Avatar>
                  </Tooltip>

                  <Box sx={{ flex: 1 }}>
                    {/* ── Ismga bosganda profil pagega o'tadi ── */}
                    <Typography
                      fontWeight={700} fontSize={14} color="#0f172a"
                      onClick={() => router.push(`/profile/${selectedUserId}`)}
                      sx={{
                        cursor: 'pointer', display: 'inline-block',
                        '&:hover': { color: '#4f46e5' }, transition: 'color 0.15s',
                      }}
                    >
                      {selectedUserName}
                    </Typography>
                    {/* @username — "Profilni ko'rish uchun bosing" o'rniga */}
                    {selectedUsername && (
                      <Typography fontSize={12} color="#94a3b8">
                        @{selectedUsername}
                      </Typography>
                    )}
                  </Box>

                  <Tooltip title="Profilga o'tish">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/profile/${selectedUserId}`)}
                      sx={{ color: '#4f46e5', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                    >
                      <OpenInNewIcon size={20} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
                {msgLoading && messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                    <CircularProgress size={24} sx={{ color: '#4f46e5' }} />
                  </Box>
                ) : (
                  <Stack spacing={0.75}>
                    {messages.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                          <Hand size={36} color="#94a3b8" weight="fill" />
                        </Box>
                        <Typography fontSize={13} color="text.secondary">Hali xabar yo'q. Salomlashing!</Typography>
                      </Box>
                    )}

                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId === user._id;
                      const prevMsg = messages[idx - 1];
                      // Show avatar only on first message in a consecutive group from same sender
                      const showAvatar = !isMine && (
                        !prevMsg || prevMsg.senderId !== msg.senderId
                      );

                      return (
                        <Stack
                          key={msg._id}
                          direction="row"
                          justifyContent={isMine ? 'flex-end' : 'flex-start'}
                          alignItems="flex-end"
                          spacing={1}
                        >
                          {/* Other person's small avatar */}
                          {!isMine && (
                            <Box sx={{ width: 28, flexShrink: 0 }}>
                              {showAvatar && (
                                <Tooltip title={selectedUserName}>
                                  <Avatar
                                    src={selectedUserAvatar || undefined}
                                    onClick={() => router.push(`/profile/${selectedUserId}`)}
                                    sx={{
                                      width: 26, height: 26, bgcolor: '#4f46e5',
                                      fontSize: 10, cursor: 'pointer',
                                      '&:hover': { opacity: 0.8 },
                                    }}
                                  >
                                    {selectedUserName?.[0]?.toUpperCase()}
                                  </Avatar>
                                </Tooltip>
                              )}
                            </Box>
                          )}

                          {/* Bubble */}
                          <Box
                            sx={{
                              maxWidth: '65%',
                              px: 1.75, py: 0.75,
                              borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              bgcolor: isMine ? '#4f46e5' : 'white',
                              color: isMine ? 'white' : '#0f172a',
                              boxShadow: isMine
                                ? '0 2px 8px rgba(79,70,229,0.25)'
                                : '0 1px 4px rgba(0,0,0,0.07)',
                            }}
                          >
                            <Typography fontSize={13} lineHeight={1.5}>{msg.text}</Typography>
                            {/* ── Vaqt — "Invalid Date" bo'lmasligi uchun safeTime() ishlatiladi ── */}
                            <Typography fontSize={10} sx={{ opacity: 0.55, mt: 0.25, textAlign: 'right' }}>
                              {safeTime(msg.createdAt)}
                              {isMine && (
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5, verticalAlign: 'middle' }}>
                                  {msg.isRead
                                    ? <><Check size={9} /><Check size={9} style={{ marginLeft: -3 }} /></>
                                    : <Check size={9} />}
                                </Box>
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                      );
                    })}
                    <div ref={bottomRef} />
                  </Stack>
                )}
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                <form onSubmit={handleSend}>
                  <Stack direction="row" spacing={1} alignItems="flex-end">
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Xabar yozing... (Enter — yuborish)"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e as any);
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3, bgcolor: '#f8fafc',
                          '&:hover fieldset':   { borderColor: '#4f46e5' },
                          '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={sending || !messageText.trim()}
                      sx={{
                        bgcolor: '#4f46e5', minWidth: 44, height: 40,
                        borderRadius: 2.5,
                        '&:hover': { bgcolor: '#4338ca' },
                        '&:disabled': { bgcolor: '#c7d2fe' },
                      }}
                    >
                      {sending
                        ? <CircularProgress size={16} sx={{ color: 'white' }} />
                        : <SendIcon size={20} />}
                    </Button>
                  </Stack>
                </form>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default withLayoutBasic(MessagesPage);
