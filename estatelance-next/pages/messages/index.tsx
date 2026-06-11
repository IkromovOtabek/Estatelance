import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
  PaperPlaneTilt as SendIcon,
  ArrowSquareOut as OpenInNewIcon,
  ChatCircle,
  EnvelopeSimple,
  Check,
  Hand,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { GET_MY_CONVERSATIONS, GET_CONVERSATION } from '../../apollo/user/query';
import { SEND_MESSAGE, MARK_MESSAGES_READ } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Message } from '../../libs/types';

// ─── Conversation summary ──────────────────────────────────────────────────────
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

function safeTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
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
    if (diffDays < 7) return ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'][d.getDay()];
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch { return ''; }
}

// ─── Tiny Avatar component ─────────────────────────────────────────────────────
const AvatarEl = ({
  src, name, size = 'md', onClick, className = '',
}: { src?: string; name?: string; size?: 'sm' | 'md'; onClick?: () => void; className?: string }) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div
      onClick={onClick}
      className={`${sz} rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : (name?.[0]?.toUpperCase() ?? '?')}
    </div>
  );
};

// ─── Messages Page ─────────────────────────────────────────────────────────────
const MessagesPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;

  const [selectedUserId,     setSelectedUserId]    = useState<string | null>(null);
  const [selectedUserName,   setSelectedUserName]  = useState('');
  const [selectedUsername,   setSelectedUsername]  = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>();
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (router.isReady && router.query.userId) {
      setSelectedUserId(router.query.userId as string);
      setSelectedUserName(decodeURIComponent((router.query.userName as string) ?? 'User'));
    }
  }, [router.isReady, router.query.userId]);

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
  const [markAsRead] = useMutation(MARK_MESSAGES_READ);

  const rawConvMessages: Message[] = convData?.getMyConversations ?? [];
  const conversations = buildConversationList(rawConvMessages, user._id);
  const messages: Message[] = msgData?.getConversation ?? [];

  const filteredConvs = conversations.filter(c =>
    !search || c.otherUserName.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (selectedUserId && conversations.length > 0) {
      const found = conversations.find(c => c.otherUserId === selectedUserId);
      if (found) {
        if (found.otherUserAvatar) setSelectedUserAvatar(found.otherUserAvatar);
        if (found.otherUsername)   setSelectedUsername(found.otherUsername);
      }
    }
  }, [conversations, selectedUserId]);

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

  if (mounted && !isLoggedIn) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bufu-auth-required'));
    }
    return (
      <div className="text-center py-16 text-slate-500">
        Xabarlarni ko&apos;rish uchun tizimga kiring.
      </div>
    );
  }

  return (
    <>
      <Head><title>Xabarlar — BuFu</title></Head>

      <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 130px)' }}>

        {/* ══ LEFT: Conversation list ══ */}
        <div className="w-72 flex flex-col flex-shrink-0 border-r border-slate-200">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <ChatCircle size={18} color="#4f46e5" weight="fill" />
            <span className="font-extrabold text-base text-slate-900">Xabarlar</span>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-slate-100">
            <div className="relative">
              <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {convLoading && conversations.length === 0 && (
              <div className="flex justify-center pt-8">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            )}
            {!convLoading && conversations.length === 0 && (
              <div className="text-center px-4 pt-10">
                <EnvelopeSimple size={36} color="#94a3b8" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Yozishmalar yo'q</p>
                <p className="text-xs text-slate-400 mt-1">Frilanser profiliga kiring va "Xabar" tugmasini bosing</p>
              </div>
            )}

            {filteredConvs.map(conv => {
              const isActive = selectedUserId === conv.otherUserId;
              return (
                <div
                  key={conv.otherUserId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-l-2 transition-all ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-600'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <AvatarEl src={conv.otherUserAvatar} name={conv.otherUserName} />
                    {conv.isUnread && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${conv.isUnread ? 'font-extrabold' : 'font-semibold'} ${isActive ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {conv.otherUserName}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{safeDate(conv.lastMessageTime)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 flex items-center gap-0.5 ${conv.isUnread ? 'font-semibold text-indigo-600' : 'text-slate-400'}`}>
                      {conv.iMine && <Check size={10} />}
                      {conv.lastMessageText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ RIGHT: Chat area ══ */}
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">

          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <ChatCircle size={52} color="#c7d2fe" weight="fill" className="mx-auto mb-3" />
                <p className="font-bold text-slate-800 mb-1">Suhbatni tanlang</p>
                <p className="text-sm text-slate-400">Chapdan biron suhbatni tanlang yoki frilanser profilidan xabar yuboring</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
                <AvatarEl
                  src={selectedUserAvatar}
                  name={selectedUserName}
                  onClick={() => router.push(`/profile/${selectedUserId}`)}
                />
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => router.push(`/profile/${selectedUserId}`)}
                    className="font-bold text-sm text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    {selectedUserName}
                  </p>
                  {selectedUsername && (
                    <p className="text-xs text-slate-400">@{selectedUsername}</p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/profile/${selectedUserId}`)}
                  className="w-8 h-8 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 transition-colors"
                >
                  <OpenInNewIcon size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {msgLoading && messages.length === 0 ? (
                  <div className="flex justify-center pt-8">
                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.length === 0 && (
                      <div className="text-center py-10">
                        <Hand size={32} color="#94a3b8" weight="fill" className="mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Hali xabar yo'q. Salomlashing!</p>
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId === user._id;
                      const prevMsg = messages[idx - 1];
                      const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Other person's avatar */}
                          {!isMine && (
                            <div className="w-7 flex-shrink-0">
                              {showAvatar && (
                                <AvatarEl
                                  src={selectedUserAvatar}
                                  name={selectedUserName}
                                  size="sm"
                                  onClick={() => router.push(`/profile/${selectedUserId}`)}
                                />
                              )}
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={`max-w-[65%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-white text-slate-900 rounded-2xl rounded-bl-md border border-slate-200'
                            }`}
                          >
                            {msg.text}
                            <div className={`flex items-center justify-end gap-0.5 mt-0.5 text-[10px] opacity-60`}>
                              {safeTime(msg.createdAt)}
                              {isMine && (
                                <span className="flex items-center">
                                  {msg.isRead
                                    ? <><Check size={9} /><Check size={9} style={{ marginLeft: -3 }} /></>
                                    : <Check size={9} />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t border-slate-200">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    placeholder="Xabar yozing... (Enter — yuborish)"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 rounded-xl flex items-center justify-center text-white transition-colors flex-shrink-0"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <SendIcon size={18} />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(MessagesPage);
