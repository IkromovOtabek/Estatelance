import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// VPS dagi backend URL — .env dan o'qish yoki to'g'ridan-to'g'ri
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.bufu.uz/graphql';

export async function getToken(): Promise<string> {
  return (await AsyncStorage.getItem('accessToken')) ?? '';
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem('accessToken', token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem('accessToken');
}

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const httpLink = new HttpLink({ uri: API_URL });

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message }) => console.error('[GraphQL error]:', message));
  if (networkError)
    console.error('[Network error]:', networkError);
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
