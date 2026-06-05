import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.GRAPHQL_SERVER_URL || 'http://localhost:3007/graphql';

export const config = {
  api: { bodyParser: false },
};

async function readBody(req: NextApiRequest): Promise<{ sessionId?: string }> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as { sessionId?: string };
  }
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as { sessionId?: string };
  } catch {
    return {};
  }
}

export default async function endSessionHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = await readBody(req);
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation EndVisitorSession($input: EndSessionInput!) {
          endVisitorSession(input: $input)
        }`,
        variables: { input: { sessionId } },
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Backend error' });
    }

    return res.status(200).json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[end-session]', message);
    return res.status(500).json({ error: 'Could not end session' });
  }
}
