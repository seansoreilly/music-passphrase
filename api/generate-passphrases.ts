import { VercelRequest, VercelResponse } from '@vercel/node';
import { formatPassphrase, requestPhrases, targetPhraseLength } from './_lib/passphrase.js';

const MAX_PASSPHRASE_LENGTH = Number(process.env.MAX_PASSPHRASE_LENGTH) || 40;

interface RequestBody {
  keywords: string;
  addNumber: boolean;
  addSpecialChar: boolean;
  includeSpaces: boolean;
  length: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    const { keywords, addNumber, addSpecialChar, includeSpaces, length }: RequestBody = req.body;
    const charCount = Math.min(Math.max(length || 10, 5), MAX_PASSPHRASE_LENGTH);

    if (!keywords || keywords.trim().length === 0) {
      return res.status(400).json({ error: 'Keywords are required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const formatOptions = { addNumber, addSpecialChar, includeSpaces, charCount };
    const { phrases, model } = await requestPhrases(keywords.trim(), targetPhraseLength(formatOptions), { apiKey });

    const processedPassphrases = phrases.map(phrase => formatPassphrase(phrase, formatOptions));

    console.log(`Processed passphrases (${model}):`, processedPassphrases);

    return res.status(200).json({
      passphrases: processedPassphrases,
      success: true
    });

  } catch (error) {
    console.error('Error generating passphrases:', error);

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
