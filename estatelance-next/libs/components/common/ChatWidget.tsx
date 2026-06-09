import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useReactiveVar, useQuery, useMutation } from '@apollo/client';
import { useTheme } from 'next-themes';
import {
  Avatar, Box, Button, IconButton,
  Stack, TextField, Typography,
} from '@mui/material';
import {
  ChatCircle, X, ArrowLeft, PaperPlaneTilt,
  Check, ArrowSquareOut, Users, Sparkle, Robot, CircleNotch,
} from '@phosphor-icons/react';
import { io, Socket } from 'socket.io-client';
import { userVar } from '../../../apollo/store';
import { GET_MY_CONVERSATIONS, GET_CONVERSATION } from '../../../apollo/user/query';
import { SEND_MESSAGE, MARK_MESSAGES_READ } from '../../../apollo/user/mutation';
import { Message } from '../../types';

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3007/graphql')
    .replace('/graphql', '');

function safeTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(/^\d+$/.test(String(iso)) ? Number(iso) : iso);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
}

function safeDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(/^\d+$/.test(String(iso)) ? Number(iso) : iso);
    if (isNaN(d.getTime())) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return safeTime(iso);
    if (diff === 1) return 'Kecha';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch { return ''; }
}

interface PublicMsg {
  id: string; senderName: string; senderId: string;
  isGuest: boolean; text: string; createdAt: string; color: string;
}

interface ConvSummary {
  otherUserId: string; otherUserName: string; otherUserAvatar?: string;
  lastText: string; lastTime?: string; isUnread: boolean; isMine: boolean;
}
function buildConvs(msgs: Message[], myId: string): ConvSummary[] {
  return msgs.map(m => {
    const mine = m.senderId === myId;
    return {
      otherUserId:     mine ? m.receiverId   : m.senderId,
      otherUserName:   mine ? m.receiverName : m.senderName,
      otherUserAvatar: mine ? (m as any).receiverAvatar : (m as any).senderAvatar,
      lastText: m.text, lastTime: m.createdAt,
      isUnread: !m.isRead && !mine, isMine: mine,
    };
  });
}

// view: 'public' | 'namePrompt' | 'dm'
export default function ChatWidget() {
  const router = useRouter();
  const user   = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [open,       setOpen]       = useState(false);
  const [view,       setView]       = useState<'public'|'namePrompt'|'dm'|'ai'>('ai');
  const [input,      setInput]      = useState('');

  // AI yordamchi
  type AiMsg = { role: 'user' | 'assistant'; content: string };
  const [aiMsgs,    setAiMsgs]    = useState<AiMsg[]>([]);
  const [aiInput,   setAiInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottom = useRef<HTMLDivElement>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [unread,     setUnread]     = useState(0);
  const [joinedPublic, setJoinedPublic] = useState(false);

  // Public
  const [publicMsgs, setPublicMsgs] = useState<PublicMsg[]>([]);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestId] = useState(() => {
    if (typeof window === 'undefined') return `g-${Date.now()}`;
    let id = localStorage.getItem('bufu_gid');
    if (!id) { id = `g-${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem('bufu_gid', id); }
    return id;
  });

  // DM
  const [peerId,     setPeerId]     = useState<string | null>(null);
  const [peerName,   setPeerName]   = useState('');
  const [peerAvatar, setPeerAvatar] = useState<string | undefined>();
  const [localMsgs,  setLocalMsgs]  = useState<any[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const pubBottom = useRef<HTMLDivElement>(null);
  const dmBottom  = useRef<HTMLDivElement>(null);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/chat`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (user._id) socket.emit('join', { userId: user._id });
    });

    socket.on('onlineCount',   ({ count }: any) => setOnlineCount(count));
    socket.on('publicHistory', (msgs: PublicMsg[]) => setPublicMsgs(msgs));
    socket.on('publicMessage', (msg: PublicMsg) => setPublicMsgs(p => [...p, msg]));

    socket.on('newMessage', (msg: any) => {
      setLocalMsgs(prev =>
        prev.some(m => m._id === msg._id) ? prev : [...prev, msg]
      );
      if (view !== 'dm' || !open) setUnread(n => n + 1);
    });
    socket.on('messageSent', (msg: any) => {
      setLocalMsgs(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user._id]);

  // Re-join private room on userId change
  useEffect(() => {
    if (user._id && socketRef.current?.connected) {
      socketRef.current.emit('join', { userId: user._id });
    }
  }, [user._id]);

  // Auto-scroll
  useEffect(() => { pubBottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [publicMsgs.length]);
  useEffect(() => { dmBottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [localMsgs.length]);
  useEffect(() => { aiBottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMsgs.length, aiLoading]);

  // ── AI yordamchiga xabar yuborish ──────────────────────────────────────────
  const sendAi = useCallback(async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput('');
    const nextMsgs: AiMsg[] = [...aiMsgs, { role: 'user', content: text }];
    setAiMsgs(nextMsgs);
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMsgs }),
      });
      const data = await res.json();
      const reply = res.ok
        ? (data.reply as string)
        : (data.error as string) || "Kechirasiz, javob bera olmadim.";
      setAiMsgs((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setAiMsgs((prev) => [...prev, { role: 'assistant', content: "Tarmoq xatosi. Qayta urinib ko'ring." }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMsgs]);

  // ── When widget opens — join public immediately ────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (view === 'public' && !joinedPublic) {
      const name = user._id
        ? (user.fullName ?? user.username ?? 'User')
        : (guestName || localStorage.getItem('bufu_guest_name') || '');

      if (name) {
        doJoinPublic(name);
      } else {
        setView('namePrompt');
      }
    }
  }, [open]);

  const doJoinPublic = useCallback((name: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    const id = user._id || guestId;
    socket.emit('joinPublic', { senderName: name, senderId: id, isGuest: !user._id });
    setJoinedPublic(true);
    setView('public');
  }, [user._id, guestId]);

  const handleNameSubmit = () => {
    const name = guestNameInput.trim();
    if (!name) return;
    localStorage.setItem('bufu_guest_name', name);
    setGuestName(name);
    doJoinPublic(name);
  };

  // "Jonli chat" tabiga o'tish (kerak bo'lsa public'ga ulanadi yoki ism so'raydi)
  const openPublicTab = useCallback(() => {
    if (joinedPublic) { setView('public'); return; }
    const name = user._id
      ? (user.fullName ?? user.username ?? 'User')
      : (guestName || (typeof window !== 'undefined' ? localStorage.getItem('bufu_guest_name') : '') || '');
    if (name) { setView('public'); setTimeout(() => doJoinPublic(name), 50); }
    else { setView('namePrompt'); }
  }, [joinedPublic, user._id, guestName, doJoinPublic]);

  // ── DM queries ─────────────────────────────────────────────────────────────
  const { data: convData, refetch: refetchConvs } = useQuery(GET_MY_CONVERSATIONS, {
    skip: !user._id, fetchPolicy: 'cache-and-network', pollInterval: 8000,
  });
  const { data: msgData } = useQuery(GET_CONVERSATION, {
    variables: { otherUserId: peerId ?? '' },
    skip: !peerId || !user._id, fetchPolicy: 'cache-and-network',
  });
  const [sendMessage]  = useMutation(SEND_MESSAGE);
  const [markAsRead]   = useMutation(MARK_MESSAGES_READ);

  const rawConvs: Message[] = convData?.getMyConversations ?? [];
  const convs = buildConvs(rawConvs, user._id);
  useEffect(() => { if (view !== 'dm') setUnread(convs.filter(c => c.isUnread).length); }, [convs.length]);

  const serverMsgs: Message[] = msgData?.getConversation ?? [];
  const allMsgs = useMemo(() => {
    const ids = new Set(serverMsgs.map((m: any) => m._id));
    return [...serverMsgs, ...localMsgs.filter(m => !ids.has(m._id))]
      .sort((a: any, b: any) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
  }, [serverMsgs, localMsgs]);

  useEffect(() => {
    if (peerId && open && view === 'dm') {
      markAsRead({ variables: { otherUserId: peerId } }).catch(() => {});
      setUnread(0);
    }
  }, [peerId, open, view]);

  // ── Open DM from profile page ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { userId, userName, avatar } = e.detail;
      setPeerId(userId); setPeerName(userName); setPeerAvatar(avatar);
      setLocalMsgs([]); setView('dm'); setOpen(true);
    };
    window.addEventListener('openChat' as any, handler);
    return () => window.removeEventListener('openChat' as any, handler);
  }, []);

  // ── Send public ────────────────────────────────────────────────────────────
  const sendPublic = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current) return;
    setInput('');
    const name = user._id ? (user.fullName ?? user.username ?? 'User') : guestName;
    socketRef.current.emit('publicMessage', {
      senderName: name, senderId: user._id || guestId, isGuest: !user._id, text,
    });
  }, [input, user._id, guestName, guestId]);

  // ── Send DM ────────────────────────────────────────────────────────────────
  const sendDm = useCallback(async () => {
    const text = input.trim();
    if (!text || !peerId) return;
    setInput('');
    const opt: any = {
      _id: `opt-${Date.now()}`, senderId: user._id,
      senderName: user.fullName ?? user.username,
      receiverId: peerId, text, isRead: false, createdAt: new Date().toISOString(),
    };
    setLocalMsgs(prev => [...prev, opt]);
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', {
        senderId: user._id, senderName: user.fullName ?? user.username,
        receiverId: peerId, text,
      });
    } else {
      try {
        await sendMessage({ variables: { input: { receiverId: peerId, text } }, refetchQueries: ['GetConversation', 'GetMyConversations'] });
        refetchConvs();
      } catch { setLocalMsgs(p => p.filter(m => m._id !== opt._id)); }
    }
  }, [input, peerId, user._id]);

  const { resolvedTheme } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';

  if (!mounted) return null;
  if (router.pathname === '/messages') return null;

  const myId = user._id || guestId;

  // Background for the messages area
  const chatBg = isDark
    ? 'linear-gradient(160deg, #1a0533 0%, #0d1b4b 40%, #0a2a4a 70%, #130826 100%)'
    : 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 40%, #ddd6fe 70%, #fae8ff 100%)';

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>

      {/* ── Panel ── */}
      {open && (
        <Box sx={{
          position: 'absolute', bottom: 72, right: 0,
          width: 340, height: 490,
          background: chatBg,
          borderRadius: 3,
          boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(99,102,241,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: isDark ? '1px solid #16161F' : '1px solid #c7d2fe',
        }}>

          {/* Header */}
          <Box sx={{
            px: 2, py: 1.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {view === 'dm' && (
                <IconButton size="small" onClick={() => { setInput(''); openPublicTab(); }}
                  sx={{ color: 'rgba(255,255,255,0.8)', p: 0.25 }}>
                  <ArrowLeft size={17} />
                </IconButton>
              )}

              {view === 'dm' ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar src={peerAvatar} sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    {peerName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography fontWeight={700} fontSize={13} color="white">{peerName}</Typography>
                </Stack>
              ) : view === 'ai' ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkle size={15} color="white" weight="fill" />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} fontSize={14} color="white" lineHeight={1.1}>AI yordamchi</Typography>
                    <Typography fontSize={10} color="rgba(255,255,255,0.7)">BuFu bo'yicha savollar</Typography>
                  </Box>
                </Stack>
              ) : (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ChatCircle size={17} color="white" weight="fill" />
                    <Typography fontWeight={800} fontSize={14} color="white">
                      {view === 'namePrompt' ? 'Ismingizni kiriting' : 'Online Chat'}
                    </Typography>
                  </Stack>
                  {view === 'public' && onlineCount > 0 && (
                    <Stack direction="row" alignItems="center" spacing={0.5} mt={0.2}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80' }} />
                      <Typography fontSize={11} color="rgba(255,255,255,0.7)">{onlineCount} kishi onlayn</Typography>
                    </Stack>
                  )}
                </Box>
              )}
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              {view === 'dm' && (
                <IconButton size="small"
                  onClick={() => router.push(`/messages?userId=${peerId}&userName=${encodeURIComponent(peerName)}`)}
                  sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }}>
                  <ArrowSquareOut size={15} />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }}>
                <X size={17} />
              </IconButton>
            </Stack>
          </Box>

          {/* ── Tabs (AI / Jonli chat) ── */}
          {(view === 'ai' || view === 'public') && (
            <Stack direction="row" sx={{ flexShrink: 0, bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)', borderBottom: `1px solid ${isDark ? '#16161F' : '#c7d2fe'}` }}>
              {[
                { key: 'ai' as const, label: 'AI yordamchi', icon: <Sparkle size={15} weight="fill" /> },
                { key: 'public' as const, label: 'Jonli chat', icon: <ChatCircle size={15} weight="fill" /> },
              ].map((t) => {
                const active = view === t.key;
                return (
                  <Box
                    key={t.key}
                    onClick={() => (t.key === 'public' ? openPublicTab() : setView('ai'))}
                    sx={{
                      flex: 1, py: 1, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                      color: active ? '#6366f1' : (isDark ? '#94a3b8' : '#64748b'),
                      fontWeight: active ? 800 : 600, fontSize: 12,
                      borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* ── AI ASSISTANT ── */}
          {view === 'ai' && (
            <>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, background: 'transparent' }}>
                {aiMsgs.length === 0 && !aiLoading && (
                  <Box sx={{ textAlign: 'center', py: 4, px: 1.5 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <Robot size={26} color="white" weight="fill" />
                    </Box>
                    <Typography fontWeight={800} fontSize={14} color={isDark ? '#e2e8f0' : '#0f172a'} mb={0.5}>
                      Salom! Men BuFu AI yordamchisiman
                    </Typography>
                    <Typography fontSize={12} color={isDark ? '#94a3b8' : '#64748b'} mb={2}>
                      Platforma, frilanserlik yoki ish topish bo'yicha xohlagan savolingizni bering.
                    </Typography>
                    <Stack spacing={0.75}>
                      {[
                        'BuFu qanday ishlaydi?',
                        'Frilanser sifatida qanday boshlash mumkin?',
                        "To'lovlar qanday himoyalangan?",
                      ].map((q) => (
                        <Box
                          key={q}
                          onClick={() => { setAiInput(q); }}
                          sx={{
                            px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer', fontSize: 12,
                            bgcolor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                            border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.18)'}`,
                            color: isDark ? '#c7d2fe' : '#4f46e5', fontWeight: 600,
                            '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.14)' },
                          }}
                        >
                          {q}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
                <Stack spacing={0.75}>
                  {aiMsgs.map((msg, idx) => {
                    const isMine = msg.role === 'user';
                    return (
                      <Stack key={idx} direction="row"
                        justifyContent={isMine ? 'flex-end' : 'flex-start'}
                        alignItems="flex-end" spacing={0.75}>
                        {!isMine && (
                          <Box sx={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkle size={13} color="white" weight="fill" />
                          </Box>
                        )}
                        <Box sx={{
                          maxWidth: '78%', px: 1.5, py: 0.9,
                          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          bgcolor: isMine ? '#4f46e5' : (isDark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.92)'),
                          color: isMine ? 'white' : (isDark ? '#e2e8f0' : '#0f172a'),
                          boxShadow: isMine ? '0 2px 8px rgba(79,70,229,0.35)' : (isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)'),
                          backdropFilter: 'blur(4px)',
                        }}>
                          <Typography fontSize={13} lineHeight={1.55} sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                  {aiLoading && (
                    <Stack direction="row" alignItems="flex-end" spacing={0.75}>
                      <Box sx={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkle size={13} color="white" weight="fill" />
                      </Box>
                      <Box sx={{
                        px: 1.5, py: 1, borderRadius: '14px 14px 14px 4px',
                        bgcolor: isDark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.92)',
                        display: 'flex', alignItems: 'center', gap: 0.75,
                      }}>
                        <CircleNotch size={15} color="#6366f1" className="ai-spin" />
                        <Typography fontSize={12} color={isDark ? '#94a3b8' : '#64748b'}>Yozmoqda...</Typography>
                      </Box>
                    </Stack>
                  )}
                  <div ref={aiBottom} />
                </Stack>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${isDark ? '#16161F' : '#c7d2fe'}`, flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    size="small" fullWidth multiline maxRows={3}
                    placeholder="Savolingizni yozing..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAi(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)', fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#27272F' : '#c7d2fe' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }, '& .MuiInputBase-input': { color: isDark ? '#e2e8f0' : '#0f172a' } }}
                  />
                  <IconButton onClick={sendAi} disabled={!aiInput.trim() || aiLoading}
                    sx={{ bgcolor: aiInput.trim() && !aiLoading ? '#4f46e5' : '#e2e8f0', color: aiInput.trim() && !aiLoading ? 'white' : '#94a3b8', width: 36, height: 36, borderRadius: 2, flexShrink: 0, '&:hover': { bgcolor: aiInput.trim() && !aiLoading ? '#4338ca' : '#e2e8f0' }, transition: 'all 0.15s' }}>
                    <PaperPlaneTilt size={17} weight="fill" />
                  </IconButton>
                </Stack>
              </Box>
            </>
          )}

          {/* ── NAME PROMPT ── */}
          {view === 'namePrompt' && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 3, gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: isDark ? 'rgba(99,102,241,0.2)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Users size={28} color="#818cf8" weight="fill" />
                </Box>
                <Typography fontWeight={800} fontSize={15} color={isDark ? '#e2e8f0' : '#0f172a'} mb={0.5}>Chatga kirish</Typography>
                <Typography fontSize={13} color={isDark ? '#94a3b8' : '#64748b'}>Ismingizni kiriting — ro'yxatdan o'tish shart emas</Typography>
              </Box>
              <TextField
                autoFocus size="small"
                placeholder="Ismingiz (masalan: Akbar)"
                value={guestNameInput}
                onChange={e => setGuestNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNameSubmit(); }}
                inputProps={{ maxLength: 30 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', fontSize: 14 } }}
              />
              <Button variant="contained" disabled={!guestNameInput.trim()} onClick={handleNameSubmit}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 700, py: 1 }}>
                Kirish
              </Button>
            </Box>
          )}

          {/* ── PUBLIC CHAT ── */}
          {view === 'public' && (
            <>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, background: 'transparent' }}>
                {publicMsgs.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography fontSize={12} color="#94a3b8">Birinchi xabarni yuboring! 👋</Typography>
                  </Box>
                )}
                <Stack spacing={0.75}>
                  {publicMsgs.map((msg, idx) => {
                    const isMine = msg.senderId === myId;
                    const prev   = publicMsgs[idx - 1];
                    const showName = !isMine && (!prev || prev.senderId !== msg.senderId);
                    return (
                      <Stack key={msg.id} direction="row"
                        justifyContent={isMine ? 'flex-end' : 'flex-start'}
                        alignItems="flex-end" spacing={0.75}>
                        {!isMine && (
                          <Box sx={{ width: 26, flexShrink: 0 }}>
                            {showName && (
                              <Avatar sx={{ width: 24, height: 24, bgcolor: msg.color, fontSize: 10, fontWeight: 700 }}>
                                {msg.senderName?.[0]?.toUpperCase()}
                              </Avatar>
                            )}
                          </Box>
                        )}
                        <Box sx={{ maxWidth: '72%' }}>
                          {showName && (
                            <Typography fontSize={10} color={msg.color} fontWeight={700} mb={0.25} pl={0.25}>
                              {msg.senderName}
                              {msg.isGuest && (
                                <Box component="span" sx={{ ml: 0.5, bgcolor: '#f1f5f9', color: '#94a3b8', fontSize: 9, px: 0.6, py: 0.1, borderRadius: 1, fontWeight: 600 }}>
                                  mehmon
                                </Box>
                              )}
                            </Typography>
                          )}
                          <Box sx={{
                            px: 1.5, py: 0.75,
                            borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            bgcolor: isMine ? '#4f46e5' : (isDark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.9)'),
                            color: isMine ? 'white' : (isDark ? '#e2e8f0' : '#0f172a'),
                            boxShadow: isMine ? '0 2px 8px rgba(79,70,229,0.35)' : (isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)'),
                            backdropFilter: 'blur(4px)',
                          }}>
                            <Typography fontSize={13} lineHeight={1.5}>{msg.text}</Typography>
                            <Typography fontSize={10} sx={{ opacity: 0.5, mt: 0.25, textAlign: 'right' }}>
                              {safeTime(msg.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    );
                  })}
                  <div ref={pubBottom} />
                </Stack>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${isDark ? '#16161F' : '#c7d2fe'}`, flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    size="small" fullWidth multiline maxRows={3}
                    placeholder="Xabar yozing..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPublic(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)', fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#27272F' : '#c7d2fe' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }, '& .MuiInputBase-input': { color: isDark ? '#e2e8f0' : '#0f172a' } }}
                  />
                  <IconButton onClick={sendPublic} disabled={!input.trim()}
                    sx={{ bgcolor: input.trim() ? '#4f46e5' : '#e2e8f0', color: input.trim() ? 'white' : '#94a3b8', width: 36, height: 36, borderRadius: 2, flexShrink: 0, '&:hover': { bgcolor: input.trim() ? '#4338ca' : '#e2e8f0' }, transition: 'all 0.15s' }}>
                    <PaperPlaneTilt size={17} weight="fill" />
                  </IconButton>
                </Stack>
              </Box>
            </>
          )}

          {/* ── DM CHAT ── */}
          {view === 'dm' && (
            <>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, background: 'transparent' }}>
                {allMsgs.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography fontSize={12} color="#94a3b8">Salomlashing! 👋</Typography>
                  </Box>
                )}
                <Stack spacing={0.75}>
                  {allMsgs.map((msg: any, idx: number) => {
                    const isMine = msg.senderId === user._id;
                    const prev   = allMsgs[idx - 1];
                    const showAv = !isMine && (!prev || (prev as any).senderId !== msg.senderId);
                    return (
                      <Stack key={msg._id} direction="row"
                        justifyContent={isMine ? 'flex-end' : 'flex-start'}
                        alignItems="flex-end" spacing={0.75}>
                        {!isMine && (
                          <Box sx={{ width: 24, flexShrink: 0 }}>
                            {showAv && (
                              <Avatar src={peerAvatar} sx={{ width: 24, height: 24, bgcolor: '#4f46e5', fontSize: 10 }}>
                                {peerName?.[0]?.toUpperCase()}
                              </Avatar>
                            )}
                          </Box>
                        )}
                        <Box sx={{
                          maxWidth: '72%', px: 1.5, py: 0.75,
                          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          bgcolor: isMine ? '#4f46e5' : (isDark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.9)'),
                          color: isMine ? 'white' : (isDark ? '#e2e8f0' : '#0f172a'),
                          boxShadow: isMine ? '0 2px 8px rgba(79,70,229,0.35)' : (isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)'),
                          backdropFilter: 'blur(4px)',
                        }}>
                          <Typography fontSize={13} lineHeight={1.5}>{msg.text}</Typography>
                          <Typography fontSize={10} sx={{ opacity: 0.55, mt: 0.25, textAlign: 'right' }}>
                            {safeTime(msg.createdAt)}
                            {isMine && <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5, verticalAlign: 'middle' }}><Check size={9} /></Box>}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                  <div ref={dmBottom} />
                </Stack>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${isDark ? '#16161F' : '#c7d2fe'}`, flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    size="small" fullWidth multiline maxRows={3}
                    placeholder="Xabar yozing..."
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDm(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)', fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#27272F' : '#c7d2fe' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }, '& .MuiInputBase-input': { color: isDark ? '#e2e8f0' : '#0f172a' } }}
                  />
                  <IconButton onClick={sendDm} disabled={!input.trim()}
                    sx={{ bgcolor: input.trim() ? '#4f46e5' : '#e2e8f0', color: input.trim() ? 'white' : '#94a3b8', width: 36, height: 36, borderRadius: 2, flexShrink: 0, transition: 'all 0.15s' }}>
                    <PaperPlaneTilt size={17} weight="fill" />
                  </IconButton>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* ── Toggle button ── */}
      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        {/* Online pill */}
        {onlineCount > 0 && !open && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            bgcolor: 'white', border: '1px solid #e2e8f0',
            borderRadius: 10, px: 1, py: 0.3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16a34a' }} />
            <Typography fontSize={11} fontWeight={700} color="#0f172a">{onlineCount}</Typography>
          </Box>
        )}

        <IconButton
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next && view === 'public') {
              // Auto-join public on open (faqat jonli chat tab ochiq bo'lsa)
              const name = user._id
                ? (user.fullName ?? user.username ?? 'User')
                : (guestName || (typeof window !== 'undefined' ? localStorage.getItem('bufu_guest_name') : '') || '');
              if (name && !joinedPublic) {
                setTimeout(() => doJoinPublic(name), 100);
              } else if (!name && !user._id) {
                setView('namePrompt');
              }
            }
          }}
          sx={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white', borderRadius: '50%',
            boxShadow: '0 4px 20px rgba(79,70,229,0.45)',
            '&:hover': { transform: 'scale(1.08)' },
            transition: 'transform 0.15s',
          }}
        >
          {open ? <X size={22} weight="bold" /> : <Sparkle size={24} weight="fill" />}
        </IconButton>

        {!open && unread > 0 && (
          <Box sx={{
            position: 'absolute', top: onlineCount > 0 ? 26 : 2, right: 2,
            bgcolor: '#ef4444', color: 'white',
            borderRadius: '50%', minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, border: '2px solid white', pointerEvents: 'none',
          }}>
            {unread > 9 ? '9+' : unread}
          </Box>
        )}
      </Box>
    </Box>
  );
}
