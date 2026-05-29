import { makeVar } from '@apollo/client';

// ─── Global User State ────────────────────────────────────────────────────────
// This stores the currently logged-in user's basic info.
// Components read this with: const user = useReactiveVar(userVar)
// When the user logs in, call setUserFromToken() to populate it.
// When the user logs out, call clearUser() to reset it.

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
