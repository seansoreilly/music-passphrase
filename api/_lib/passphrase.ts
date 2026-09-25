// Tried in order; first model returning usable phrases wins.
// Reasoning is disabled: it adds seconds of latency and, on reasoning models,
// can consume the token budget and leave the content empty.
export const MODELS: ReadonlyArray<{ id: string; reasoning: Record<string, unknown> }> = [
  { id: 'openai/gpt-5.4-mini', reasoning: { effort: 'none' } },
  { id: 'deepseek/deepseek-v4.1-flash', reasoning: { enabled: false } },
];

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 12000;
const MAX_PHRASE_LENGTH = 80;

export function buildPrompt(artist: string, charCount: number): string {
  const minChars = Math.max(charCount - 4, 1);
  return `Generate 5 unique passphrases built from song titles by the artist "${artist}".

    LENGTH: Each passphrase must be between ${minChars} and ${charCount} characters long, counting letters and spaces. Aim for ${charCount}. Never exceed ${charCount}.
    - If one song title is too short, join titles (or runs of consecutive words from titles) from two or more different songs, separated by single spaces, until the length is reached.
    - If a title is too long, use a run of consecutive words from it.
    - Example: for 27 characters, "Enter Sandman Fade to Black" joins two titles (13 + 1 + 13 = 27).
    - Count the characters of each passphrase before answering and fix any that are outside ${minChars}-${charCount}.

    Requirements:
    - Use ACTUAL CONSECUTIVE WORDS from published song titles
    - Do NOT invent or modify titles
    - Do NOT change the order of words within a title
    - Do NOT provide duplicates
    - No punctuation other than what appears in the titles

    RESPONSE FORMAT: Return ONLY the passphrases, one per line, with NO explanatory text, NO character counts, NO introductions, NO headers.

    If you're not certain a title exists, don't use it.`;
}

// Length the model should aim for: what's left after the number/symbol suffix,
// scaled up when spaces will be stripped so the final string still lands near charCount.
export function targetPhraseLength(opts: FormatOptions): number {
  let suffixLength = 0;
  if (opts.addNumber) suffixLength += opts.includeSpaces ? 3 : 2;
  if (opts.addSpecialChar) suffixLength += 1;
  const base = Math.max(opts.charCount - suffixLength, 3);
  return opts.includeSpaces ? base : Math.round(base * 1.15);
}

const REFUSAL_PATTERNS = [
  /\bI(?:'|’)?m sorry\b/i,
  /\bI (?:cannot|can(?:'|’)t|am unable to|need to be honest|should decline|must decline|apologi[sz]e)\b/i,
  /\bas an AI\b/i,
  /\bI appreciate your request\b/i,
  /\brather than (?:risk|guess)/i,
];

export function isRefusal(line: string): boolean {
  return REFUSAL_PATTERNS.some(p => p.test(line));
}

export function parsePhrases(content: string): string[] {
  const phrases = content
    .split('\n')
    .map(line => line.trim()
      .replace(/^(?:\d+[.)\-:]|[-*•])\s*/, '')
      .replace(/["“”'‘’]/g, '')
      .trim())
    .filter(line => line.length > 0 && line.length <= MAX_PHRASE_LENGTH && !isRefusal(line));
  return [...new Set(phrases)].slice(0, 5);
}

export interface FormatOptions {
  addNumber: boolean;
  addSpecialChar: boolean;
  includeSpaces: boolean;
  charCount: number;
}

export function formatPassphrase(phrase: string, opts: FormatOptions, random: () => number = Math.random): string {
  let processed = phrase.trim();
  processed = processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase();

  if (!opts.includeSpaces) {
    processed = processed.replace(/\s+/g, '');
  }

  let suffix = '';
  if (opts.addNumber) {
    const randomNumber = Math.floor(random() * 90) + 10; // 10-99
    suffix += opts.includeSpaces ? ` ${randomNumber}` : `${randomNumber}`;
  }
  if (opts.addSpecialChar) {
    const specialChars = ['!', '@', '#', '$', '%', '&', '*', '?'];
    suffix += specialChars[Math.floor(random() * specialChars.length)];
  }

  // Truncate base text to fit within charCount including suffix
  const maxBase = opts.charCount - suffix.length;
  if (processed.length > maxBase) {
    const cut = processed.slice(0, maxBase);
    // Prefer ending on a whole word when that keeps most of the length.
    const lastSpace = processed[maxBase] === ' ' ? maxBase : cut.lastIndexOf(' ');
    processed = (lastSpace >= maxBase * 0.75 ? cut.slice(0, lastSpace) : cut).replace(/\s+$/, '');
  }

  return processed + suffix;
}

interface RequestOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
  error?: { message?: string };
}

export async function requestPhrases(
  artist: string,
  charCount: number,
  { apiKey, fetchImpl = fetch }: RequestOptions
): Promise<{ phrases: string[]; model: string }> {
  const failures: string[] = [];

  for (const model of MODELS) {
    try {
      const res = await fetchImpl(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.musicpassphrase.com',
          'X-Title': 'Music Passphrase',
        },
        body: JSON.stringify({
          model: model.id,
          reasoning: model.reasoning,
          messages: [{ role: 'user', content: buildPrompt(artist, charCount) }],
          temperature: 0.1,
          max_tokens: 400,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const data = (await res.json().catch(() => ({}))) as ChatCompletion;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${data.error?.message ?? 'unknown error'}`);
      }

      const choice = data.choices?.[0];
      const content = choice?.message?.content ?? '';
      console.log(`Raw ${model.id} response (finish=${choice?.finish_reason}):`, content);

      const phrases = parsePhrases(content);
      if (phrases.length === 0) {
        throw new Error(content.trim() ? 'No usable phrases (refusal or unparseable)' : 'Empty content');
      }
      return { phrases, model: model.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Model ${model.id} failed: ${message}`);
      failures.push(`${model.id}: ${message}`);
    }
  }

  throw new Error(`All models failed — ${failures.join('; ')}`);
}
