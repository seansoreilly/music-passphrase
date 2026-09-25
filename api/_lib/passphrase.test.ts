import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPassphrase, isRefusal, parsePhrases, requestPhrases } from './passphrase.ts';

test('parsePhrases splits lines, strips numbering/bullets/quotes, dedupes, caps at 5', () => {
  const content = '1. "Enter Sandman"\n- Fade to Black\n\n* Fade to Black\n2) Don’t Tread on Me\nSad but True\nMaster of Puppets\nBattery';
  assert.deepEqual(parsePhrases(content), ['Enter Sandman', 'Fade to Black', 'Dont Tread on Me', 'Sad but True', 'Master of Puppets']);
});

test('parsePhrases drops refusal lines', () => {
  assert.deepEqual(parsePhrases("I'm sorry, but I can't fulfill that request."), []);
  assert.deepEqual(parsePhrases('I appreciate your request, but I need to be honest: I cannot reliably verify that.\nLove Story'), ['Love Story']);
});

test('isRefusal flags assistant prose but not song titles', () => {
  for (const line of ["I'm sorry, but I can't help", 'I cannot guarantee these are exact', 'Rather than risk inaccuracy, I should decline', 'As an AI, I am unable to']) {
    assert.equal(isRefusal(line), true, line);
  }
  for (const title of ["Don't Dream It's Over", "Bitch, Don't Kill My Vibe", 'Sorry', 'I Knew You Were Trouble', "Can't Stop"]) {
    assert.equal(isRefusal(title), false, title);
  }
});

test('formatPassphrase capitalises, applies suffix and length cap', () => {
  const opts = { addNumber: true, addSpecialChar: true, includeSpaces: true, charCount: 20 };
  const r = formatPassphrase('ENTER SANDMAN', opts, () => 0);
  assert.equal(r, 'Enter sandman 10!');
  const long = formatPassphrase('Four Seasons In One Day', { ...opts, charCount: 12 }, () => 0);
  assert.ok(long.length <= 12, long);
  assert.equal(formatPassphrase('Money Trees', { ...opts, addNumber: false, addSpecialChar: false, includeSpaces: false }, () => 0), 'Moneytrees');
});

function fakeFetch(responses: Array<{ status?: number; body: unknown } | Error>) {
  const calls: Array<{ model: string; reasoning: unknown }> = [];
  const fn = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse(String(init?.body));
    calls.push({ model: body.model, reasoning: body.reasoning });
    const next = responses.shift();
    if (!next) throw new Error('unexpected call');
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
  };
  return { fn: fn as typeof fetch, calls };
}

const ok = (content: string) => ({ body: { choices: [{ message: { content }, finish_reason: 'stop' }] } });

test('requestPhrases uses primary model with reasoning off', async () => {
  const f = fakeFetch([ok('Love Story\nBlank Space')]);
  const r = await requestPhrases('Taylor Swift', 10, { apiKey: 'k', fetchImpl: f.fn });
  assert.deepEqual(r, { phrases: ['Love Story', 'Blank Space'], model: 'openai/gpt-5.4-mini' });
  assert.deepEqual(f.calls, [{ model: 'openai/gpt-5.4-mini', reasoning: { effort: 'none' } }]);
});

test('requestPhrases falls back on empty content, refusal, HTTP error, or throw', async () => {
  for (const first of [ok(''), ok("I'm sorry, but I can't fulfill that request."), { status: 502, body: { error: { message: 'x' } } }, new Error('timeout')]) {
    const f = fakeFetch([first, ok('Enter Sandman')]);
    const r = await requestPhrases('Metallica', 10, { apiKey: 'k', fetchImpl: f.fn });
    assert.deepEqual(r, { phrases: ['Enter Sandman'], model: 'deepseek/deepseek-v4.1-flash' });
    assert.deepEqual(f.calls[1], { model: 'deepseek/deepseek-v4.1-flash', reasoning: { enabled: false } });
  }
});

test('requestPhrases throws when every model fails', async () => {
  const f = fakeFetch([ok(''), ok('')]);
  await assert.rejects(requestPhrases('X', 10, { apiKey: 'k', fetchImpl: f.fn }), /All models failed/);
});
