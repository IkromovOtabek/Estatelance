import { jwtDecode } from 'jwt-decode';
import { apolloClient, saveToken, removeToken } from '../../apollo/client';
import { userVar, setUserFromToken, clearUser } from '../../apollo/store';
import { LOGIN, SIGNUP, LOGIN_WITH_TELEGRAM } from '../../apollo/user/mutation';

// ─── Log in with username + password ─────────────────────────────────────────
export async function loginWithPassword(username: string, password: string): Promise<void> {
  const result = await apolloClient.mutate({
    mutation: LOGIN,
    variables: { input: { username, password } },
    fetchPolicy: 'network-only',
  });

  const user = result?.data?.login;
  if (!user?.accessToken) throw new Error('Login failed — no token returned');

  saveToken(user.accessToken);
  setUserFromToken(jwtDecode(user.accessToken));
}

// ─── Sign up with username + password ────────────────────────────────────────
export async function signupWithPassword(
  username: string,
  password: string,
  userType: string,
  fullName?: string,
  location?: string,
  profileImage?: string,
): Promise<void> {
  const result = await apolloClient.mutate({
    mutation: SIGNUP,
    variables: { input: { username, password, userType, fullName, location, profileImage } },
    fetchPolicy: 'network-only',
  });

  const user = result?.data?.signup;
  if (!user?.accessToken) throw new Error('Signup failed — no token returned');

  saveToken(user.accessToken);
  setUserFromToken(jwtDecode(user.accessToken));
}

// ─── Log in via Telegram ─────────────────────────────────────────────────────
// This is called by the TelegramLoginButton component when the user
// successfully authenticates with Telegram.
// The `telegramData` object is provided directly by Telegram's login widget.
export async function loginWithTelegram(telegramData: {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}): Promise<boolean> {
  const input = { ...telegramData, id: String(telegramData.id) };

  const result = await apolloClient.mutate({
    mutation: LOGIN_WITH_TELEGRAM,
    variables: { input },
    fetchPolicy: 'network-only',
  });

  const user = result?.data?.loginWithTelegram;
  if (!user?.accessToken) throw new Error('Telegram login failed — no token returned');

  saveToken(user.accessToken);
  setUserFromToken(jwtDecode(user.accessToken));
  return !!user.needsOnboarding;
}

// ─── Restore session on page load ────────────────────────────────────────────
// Call this in _app.tsx to restore the user session from localStorage
export function restoreUserSession(): void {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('accessToken');
  if (!token) return;

  try {
    const decoded: any = jwtDecode(token);

    // Check if the token is expired
    const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
    if (isExpired) {
      removeToken();
      return;
    }

    setUserFromToken(decoded);
  } catch {
    removeToken();
  }
}

// ─── Log out ──────────────────────────────────────────────────────────────────
export function logout(): void {
  removeToken();
  clearUser();
  apolloClient.clearStore();
}
