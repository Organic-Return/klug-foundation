// Server-side content spam heuristics.
//
// This complements reCAPTCHA, which scores the *visitor* (human vs. bot) but
// never inspects what was typed. Scripted spam often scores as "human," so we
// also reject submissions whose *content* is obvious junk: keyboard-mash names
// and messages, link spam, and throwaway-alias emails.
//
// Deliberately conservative — it aims to catch clear bot/junk output without
// blocking short but genuine inquiries ("Is this still available? Call me").

export interface SpamCheckInput {
  name?: string;
  message?: string;
  email?: string;
}

export interface SpamCheckResult {
  spam: boolean;
  reason?: string;
}

const URL_RE = /(https?:\/\/|www\.)/i;

// Longest run of consecutive consonants in a token (a keyboard-mash signal).
function longestConsonantRun(word: string): number {
  const runs = word.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]+/g);
  return runs ? Math.max(...runs.map((s) => s.length)) : 0;
}

// Count lower<->upper transitions inside a token. Real words switch case at most
// once or twice ("McDonald", "iPhone"); random-case bot output switches often.
function caseTransitions(word: string): number {
  let t = 0;
  for (let i = 1; i < word.length; i++) {
    const prev = word[i - 1];
    const cur = word[i];
    if ((/[a-z]/.test(prev) && /[A-Z]/.test(cur)) || (/[A-Z]/.test(prev) && /[a-z]/.test(cur))) {
      t++;
    }
  }
  return t;
}

function vowelRatio(word: string): number {
  const letters = word.replace(/[^a-z]/gi, '');
  if (!letters.length) return 1;
  const vowels = letters.match(/[aeiou]/gi)?.length || 0;
  return vowels / letters.length;
}

// Does a single token look like random keyboard-mash?
//
// Tuned to avoid false positives on real names — including low-vowel Slavic
// ones like "Krzysztof" — by leaning on signals genuine names never exhibit:
// random mid-word case switching, and extreme length with almost no vowels.
function tokenLooksRandom(word: string): boolean {
  const letters = word.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 8) return false; // too short to judge confidently

  const transitions = caseTransitions(letters);
  const vowels = vowelRatio(letters);

  // Random mixed-case within one token — humans don't type this, bots do.
  // (Real names capitalize once: "McDonald" = 2 transitions at most.)
  if (transitions >= 4) return true;
  // A long token that is almost entirely consonants is keyboard-mash; the high
  // length + very low vowel ratio clears real names, which are shorter.
  if (letters.length >= 12 && vowels < 0.15) return true;

  return false;
}

// Does free text look like gibberish? Flags if any long-enough token is random.
function textLooksGibberish(text: string): boolean {
  const tokens = text.trim().split(/\s+/);
  return tokens.some((t) => tokenLooksRandom(t));
}

/**
 * Inspect a form submission's content. Returns `{ spam: true, reason }` when the
 * content looks like bot/junk output, otherwise `{ spam: false }`.
 */
export function checkSpam(input: SpamCheckInput): SpamCheckResult {
  const name = (input.name || '').trim();
  const message = (input.message || '').trim();
  const email = (input.email || '').trim();

  if (message && URL_RE.test(message)) {
    return { spam: true, reason: 'message_contains_link' };
  }
  if (name && textLooksGibberish(name)) {
    return { spam: true, reason: 'gibberish_name' };
  }
  if (message && textLooksGibberish(message)) {
    return { spam: true, reason: 'gibberish_message' };
  }
  // Gmail-style dot abuse in the local part signals a throwaway alias.
  const localPart = email.split('@')[0] || '';
  if ((localPart.match(/\./g)?.length || 0) >= 5) {
    return { spam: true, reason: 'email_alias_abuse' };
  }

  return { spam: false };
}
