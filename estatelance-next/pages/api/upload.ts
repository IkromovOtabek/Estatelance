import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// ─── File Upload API ──────────────────────────────────────────────────────────
// Accepts: POST with JSON body { base64: string, fileName: string }
// Returns: { url: "/uploads/filename.ext" }
// Supports: images (jpeg/png/gif/webp) and PDF files

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default function uploadHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64, fileName } = req.body as { base64: string; fileName: string };

    if (!base64 || !fileName) {
      return res.status(400).json({ error: 'base64 and fileName are required' });
    }

    // Strip the data URL prefix — works for any MIME type:
    // "data:image/jpeg;base64,"  →  pure base64
    // "data:application/pdf;base64,"  →  pure base64
    const pureBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(pureBase64, 'base64');

    // Create a unique filename, preserving original extension
    const timestamp = Date.now();
    const ext = path.extname(fileName).toLowerCase() || '.bin';
    const prefix = ext === '.pdf' ? 'file' : 'avatar';
    const safeName = `${prefix}_${timestamp}${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadsDir, safeName), buffer);

    return res.status(200).json({ url: `/uploads/${safeName}` });
  } catch (err: any) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: 'Upload failed', details: err?.message });
  }
}
