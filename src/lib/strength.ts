/**
 * Passphrase strength estimation.
 *
 * This is a heuristic entropy estimate, not a cryptographic guarantee. It is
 * intentionally conservative about alphabetic content: because these
 * passphrases are built from song/artist titles (real dictionary words),
 * scoring each letter as if it were drawn from a uniform 26-letter charset
 * would wildly overstate the true entropy (an attacker guesses words, not
 * letters). Instead, each alphabetic "word" token is treated as contributing
 * a fixed ~11 bits (roughly log2 of a ~2000-word common-phrase dictionary),
 * while digits, symbols, and spaces are scored per-character against their
 * actual character sets, since those are not dictionary-constrained.
 */

export type StrengthTier = "weak" | "fair" | "good" | "strong";

export interface StrengthEstimate {
  bits: number;
  tier: StrengthTier;
  label: string;
}

/** Assumed bits of entropy contributed by a single dictionary word token. */
const BITS_PER_WORD = 11;

/** Character set sizes used for non-dictionary character classes. */
const DIGIT_CHARSET_SIZE = 10;
const SYMBOL_CHARSET_SIZE = 32;
/** Spaces are highly predictable placement-wise; count them lightly. */
const SPACE_BITS = 1;

const TIER_THRESHOLDS: Record<StrengthTier, number> = {
  weak: 0,
  fair: 28,
  good: 45,
  strong: 60,
};

const TIER_LABELS: Record<StrengthTier, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

function bitsToTier(bits: number): StrengthTier {
  if (bits >= TIER_THRESHOLDS.strong) return "strong";
  if (bits >= TIER_THRESHOLDS.good) return "good";
  if (bits >= TIER_THRESHOLDS.fair) return "fair";
  return "weak";
}

/**
 * Estimates the entropy (in bits) of a passphrase and maps it to a
 * human-friendly strength tier.
 *
 * Approach: tokenize the phrase into alphabetic word runs, digit runs, and
 * individual symbol/space characters. Word runs are scored as whole
 * dictionary-word guesses (BITS_PER_WORD each) rather than per-letter
 * charset entropy, since these passphrases are composed of real words
 * (song/artist titles). Digits and symbols are scored per-character
 * against their charset size, since an attacker cannot dictionary-guess
 * those. A small, capped bonus rewards mixing multiple character classes.
 */
export function estimatePassphraseStrength(passphrase: string): StrengthEstimate {
  const trimmed = passphrase.trim();

  if (trimmed.length === 0) {
    return { bits: 0, tier: "weak", label: TIER_LABELS.weak };
  }

  let bits = 0;
  const classesPresent = new Set<"lower" | "upper" | "digit" | "symbol" | "space">();

  // Tokenize into runs: consecutive letters form a "word", everything else
  // (digits, symbols, spaces) is scored character-by-character.
  const tokens = trimmed.match(/[A-Za-z]+|[^A-Za-z]/g) ?? [];

  for (const token of tokens) {
    if (/^[A-Za-z]+$/.test(token)) {
      bits += BITS_PER_WORD;
      if (/[a-z]/.test(token)) classesPresent.add("lower");
      if (/[A-Z]/.test(token)) classesPresent.add("upper");
    } else if (/^[0-9]$/.test(token)) {
      bits += Math.log2(DIGIT_CHARSET_SIZE);
      classesPresent.add("digit");
    } else if (/^\s$/.test(token)) {
      bits += SPACE_BITS;
      classesPresent.add("space");
    } else {
      bits += Math.log2(SYMBOL_CHARSET_SIZE);
      classesPresent.add("symbol");
    }
  }

  // Small, capped bonus for mixing multiple character classes on top of
  // word content, reflecting that an attacker must consider more than one
  // guessing strategy at once. Capped so it can't turn a short phrase strong.
  const diversityBonus = Math.min((classesPresent.size - 1) * 2, 8);
  bits += Math.max(diversityBonus, 0);

  const roundedBits = Math.round(bits);
  const tier = bitsToTier(roundedBits);

  return {
    bits: roundedBits,
    tier,
    label: TIER_LABELS[tier],
  };
}
