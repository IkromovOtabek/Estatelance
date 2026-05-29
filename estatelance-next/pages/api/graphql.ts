import type { NextApiRequest, NextApiResponse } from 'next';

// This proxy forwards GraphQL requests from the browser to the NestJS backend.
// Why do we need this?
//   When someone opens the app via ngrok from another device, their browser tries
//   to call "http://localhost:3007/graphql" — but their localhost is NOT our dev
//   machine. By routing through /api/graphql (a relative URL), the Next.js server
//   (which runs on our dev machine) forwards the request to the real backend.
//
// Flow:  Browser → /api/graphql (Next.js server) → localhost:3007/graphql (NestJS)

const BACKEND_URL = process.env.GRAPHQL_SERVER_URL || 'http://localhost:3007/graphql';

export const config = {
  api: {
    // Allow large request bodies (for file uploads, etc.)
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function graphqlProxy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward the Authorization header from the browser request
    const auth = req.headers['authorization'];
    if (auth) {
      headers['authorization'] = auth as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // For POST requests, forward the GraphQL body
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const backendResponse = await fetch(BACKEND_URL, fetchOptions);
    const data = await backendResponse.json();

    // Forward the status code and response body back to the browser
    res.status(backendResponse.status).json(data);
  } catch (error: any) {
    console.error('[GraphQL Proxy Error]', error?.message ?? error);
    res.status(502).json({ error: 'Could not connect to backend', details: error?.message });
  }
}
