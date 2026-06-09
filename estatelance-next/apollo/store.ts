import { makeVar } from '@apollo/client';

// ═══════════════════════════════════════════════════════════════════════════
//  Global foydalanuvchi holati (Apollo reactive var)
//  ───────────────────────────────────────────────────────────────────────────
//  makeVar — Apollo'ning yengil global state mexanizmi (Redux'siz).
//  userVar butun ilova bo'ylab joriy (login qilgan) foydalanuvchini saqlaydi.
//
//  Qanday ishlatiladi:
//   • O'qish:  const user = useReactiveVar(userVar)   ← komponentda
//   • Login:   setUserFromToken() → userVar to'ladi
//   • Logout:  clearUser() → userVar tozalanadi
//
//  userVar o'zgarsa — uni o'qiyotgan BARCHA komponent avtomatik qayta render bo'ladi.
// ═══════════════════════════════════════════════════════════════════════════

export interface LoggedInUser {
  _id: string;
  username: string;
  userType: string;
  userStatus: string;
  profileImage?: string;
  fullName?: string;
  needsOnboarding?: boolean;
}

const emptyUser: LoggedInUser = {
  _id: '',
  username: '',
  userType: '',
  userStatus: '',
  profileImage: '',
  fullName: '',
  needsOnboarding: false,
};

export const userVar = makeVar<LoggedInUser>(emptyUser);

export function clearUser(): void {
  userVar(emptyUser);
}

export function setUserFromToken(tokenPayload: any): void {
  userVar({
    _id: tokenPayload._id,
    username: tokenPayload.username,
    userType: tokenPayload.userType,
    userStatus: tokenPayload.userStatus,
    profileImage: tokenPayload.profileImage ?? '',
    fullName: tokenPayload.fullName ?? '',
    needsOnboarding: tokenPayload.needsOnboarding ?? false,
  });
}

// ─── Spam Modal State ─────────────────────────────────────────────────────────
// When the backend throws SPAM_RESTRICTED, the Apollo errorLink sets this var.
// SpamModal reads it and displays the reason to the user.
export interface SpamModalState {
  open: boolean;
  reason: string;
}

export const spamModalVar = makeVar<SpamModalState>({ open: false, reason: '' });

export function showSpamModal(reason: string): void {
  spamModalVar({ open: true, reason });
}

export function closeSpamModal(): void {
  spamModalVar({ open: false, reason: '' });
}
