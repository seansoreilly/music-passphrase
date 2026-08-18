import { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { randomInt } from 'node:crypto';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const requestBodySchema = z.object({
  keywords: z
    .string()
    .trim()
    .min(1, 'Keywords are required')
    .max(200, 'Keywords must be 200 characters or fewer'),
  addNumber: z.boolean(),
  addSpecialChar: z.boolean(),
  includeSpaces: z.boolean(),
  length: z.coerce.number().int().min(5).max(20),
});

type RequestBody = z.infer<typeof requestBodySchema>;

// Allowed origins for CORS: production domain, its www alias, any localhost
// dev port, and any Vercel preview deployment.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/musicpassphrase\.com$/,
  /^https:\/\/www\.musicpassphrase\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

// Lightweight, per-instance, in-memory rate limiting. This is best-effort
// only: Vercel Fluid Compute reuses instances across invocations, but a cold
// start or routing to a different instance resets the counters. For
// production-grade protection, use Vercel WAF rate limiting rules instead.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestTimestamps.get(ip) ?? []).filter(ts => ts > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestTimestamps.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  requestTimestamps.set(ip, timestamps);
  return false;
}

function getClientIp(req: VercelRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (forwardedIp) {
    return forwardedIp.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS: only reflect the origin back when it's an allowed origin. Same-origin
  // requests via /api don't need CORS headers at all, so no wildcard.
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment and try again.',
      success: false,
    });
  }

  const parseResult = requestBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: parseResult.error.issues[0]?.message || 'Invalid request body',
      success: false,
    });
  }

  const { keywords, addNumber, addSpecialChar, includeSpaces, length }: RequestBody =
    parseResult.data;

  try {
    const charCount = length;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const prompt = `Generate 5 unique short phrases (approximately ${charCount} characters each, including spaces) from the artist "${keywords}".

    Requirements:
    - Use ACTUAL CONSECUTIVE WORDS from published song titles
    - Do NOT invent or modify titles
    - Do NOT change the order of words
    - Do NOT provide duplicates
    - Each phrase must be exactly as it appears in the original public song titles

    RESPONSE FORMAT: Return ONLY the phrases, one per line, with NO explanatory text, NO introductions, NO headers.

    If you're not certain about exact lyrics, don't guess.`;

    // Even more conservative settings
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'openai/gpt-oss-120b', // Larger model for better factual accuracy
      temperature: 0.1, // Very low for maximum accuracy
      max_tokens: 1000, // Reasoning tokens count toward this limit
      top_p: 0.9,
      reasoning_effort: 'low',
      stream: false,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response content from Groq API');
    }

    // Parse the response to extract passphrases
    const rawPassphrases = responseContent
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter((phrase, index, self) => self.indexOf(phrase) === index)
      .slice(0, 5); // Ensure we only take 5 passphrases

    if (rawPassphrases.length === 0) {
      throw new Error('Failed to extract passphrases from Groq response');
    }

    // Process passphrases with optional number and special character
    const processedPassphrases = rawPassphrases.map(phrase => {
      let processed = phrase.trim();

      // Remove any quotation marks
      processed = processed.replace(/["""'']/g, '');

      // Remove any numbering (e.g., "1. " or "1) ")
      processed = processed.replace(/^\d+[.)\-\s]+/, '');

      // Ensure first letter is capitalized and rest are lowercase
      processed = processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase();

      // Remove spaces if includeSpaces is false
      if (!includeSpaces) {
        processed = processed.replace(/\s+/g, '');
      }

      // Calculate suffix length to reserve space
      let suffix = '';
      if (addNumber) {
        const randomNumber = randomInt(10, 100); // 10-99
        suffix += includeSpaces ? ` ${randomNumber}` : `${randomNumber}`;
      }
      if (addSpecialChar) {
        const specialChars = ['!', '@', '#', '$', '%', '&', '*', '?'];
        suffix += specialChars[randomInt(0, specialChars.length)];
      }

      // Truncate base text to fit within charCount including suffix
      const maxBase = charCount - suffix.length;
      if (processed.length > maxBase) {
        processed = processed.slice(0, maxBase).replace(/\s+$/, '');
      }

      return processed + suffix;
    });

    return res.status(200).json({
      passphrases: processedPassphrases,
      success: true
    });

  } catch (error) {
    console.error('Error generating passphrases:', error);

    // Check if it's a Groq API error
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to generate passphrases',
        details: error.message,
        success: false
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      success: false
    });
  }
}