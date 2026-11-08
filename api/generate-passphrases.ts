import { VercelRequest, VercelResponse } from '@vercel/node';
import { clientIp, createRateLimiter, validateRequestBody } from './_lib/request.js';
import { formatPassphrase, requestPhrases, targetPhraseLength } from './_lib/passphrase.js';

const MAX_PASSPHRASE_LENGTH = Number(process.env.MAX_PASSPHRASE_LENGTH) || 40;

// Best-effort per-IP limit (10 requests/minute). This lives in process memory, so it is
// per serverless instance: instances don't share it and a cold start resets it. It only
// blunts casual abuse. The durable control on cost is a spend cap on the OpenRouter key
// (plus a Vercel WAF rate-limit rule if needed).
const rateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  // No Allow-Credentials: it is invalid with a wildcard origin and this API uses no cookies.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = rateLimiter.check(clientIp(req.headers));
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.', success: false });
    }

    // @vercel/node parses the body lazily and its getter throws on malformed JSON;
    // read it in its own guard so bad input is a 400, not the generic 500 below.
    let body: unknown;
    try {
      body = req.body;
    } catch {
      return res.status(400).json({ error: 'Request body must be valid JSON', success: false });
    }

    const validation = validateRequestBody(body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error, success: false });
    }
    const { keywords, addNumber, addSpecialChar, includeSpaces, length } = validation.value;
    const charCount = Math.min(Math.max(length || 10, 5), MAX_PASSPHRASE_LENGTH);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const formatOptions = { addNumber, addSpecialChar, includeSpaces, charCount };
    const { phrases, model } = await requestPhrases(keywords, targetPhraseLength(formatOptions), { apiKey });

    const processedPassphrases = phrases.map(phrase => formatPassphrase(phrase, formatOptions));

    console.log(`Generated ${processedPassphrases.length} passphrases (${model})`);

    return res.status(200).json({
      passphrases: processedPassphrases,
      success: true
    });

  } catch (error) {
    console.error('Error generating passphrases:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to generate passphrases',
        success: false
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      success: false
    });
  }
}
