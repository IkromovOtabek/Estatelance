import { ApolloClient, InMemoryCache, from, HttpLink, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { showSpamModal, clearUser } from './store';

// Get the stored JWT token from localStorage (runs only in the browser)
export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') ?? '';
}

// Save the JWT token to localStorage
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

// Remove the JWT token (logout)
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
}

// Add the Authorization header to every request if we have a token
const authLink = setContext((_, { headers }) => {
  const token = getStoredToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Handle errors from GraphQL responses
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const gqlError of graphQLErrors) {
      const { message } = gqlError;
      const code: string = (gqlError.extensions?.code ?? (gqlError as any).code ?? '') as string;

      // Unauthenticated yoki Forbidden — tokenni o'chirib foydalanuvchini tozalash.
      if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
        // Faqat token mavjud bo'lsa tozalash (login sahifasidagi xatolarni o'tkazib yuborish)
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          removeToken();
          clearUser();
        }
        return;
      }

      // Spam cheklangan — modal ko'rsatish va xatoni YUTATISH
      // onError dan Observable qaytarsak, xato komponentga yetmaydi (dev overlay yo'qoladi)
      if (message.startsWith('SPAM_RESTRICTED|')) {
        const reason = message.split('|')[1] ?? '';
        showSpamModal(reason);
        // Bo'sh natija qaytaramiz — komponent xato ko'rmaydi
        return new Observable((observer) => {
          observer.next({ data: {} });
          observer.complete();
        });
      }
    }
  }

  if (networkError) {
    console.error(`[Network Error] ${networkError.message}`);
  }
});

// The HTTP link sends requests through our Next.js proxy (/api/graphql).
// Using a relative URL means it works correctly on every device — the browser
// sends the request to the same host it loaded the page from (even via ngrok),
// and the Next.js server forwards it to the local NestJS backend.
const httpLink = new HttpLink({
  uri: '/api/graphql',
});

// Create the Apollo Client with all links chained together
export const apolloClient = new ApolloClient({
  ssrMode: typeof window === 'undefined', // Enable SSR mode on the server
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
