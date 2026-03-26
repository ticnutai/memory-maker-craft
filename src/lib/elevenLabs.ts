// ElevenLabs integration service — TTS, SFX, Music
// Uses edge functions to keep API key secure

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Audio cache to avoid re-fetching the same TTS/SFX
const audioCache = new Map<string, string>();

async function fetchAudio(functionName: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const msg = `ElevenLabs ${functionName} failed (${response.status})${response.status === 500 ? " — API key probably not set in Supabase secrets (ELEVENLABS_API_KEY)" : ""}`;
      console.warn(msg);
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn(`ElevenLabs ${functionName} error:`, err);
    return null;
  }
}

// ─── TTS ───────────────────────────────────────────────
export async function elevenLabsSpeak(text: string, voiceId?: string): Promise<boolean> {
  const cacheKey = `tts:${text}:${voiceId || "default"}`;
  let url = audioCache.get(cacheKey);

  if (!url) {
    url = await fetchAudio("elevenlabs-tts", { text, voiceId }) ?? undefined;
    if (url) audioCache.set(cacheKey, url);
  }

  if (url) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.85;
      await audio.play();
      return true;
    } catch { /* fallback */ }
  }
  return false;
}

// ─── SFX ───────────────────────────────────────────────
const SFX_PROMPTS: Record<string, string> = {
  match: "Cheerful magical sparkle chime for a children's game, short happy success sound",
  mismatch: "Gentle soft wrong answer buzz for a children's game, not scary, short",
  win: "Triumphant celebratory fanfare for a children's game, exciting victory jingle",
  flip: "Soft card flip swoosh sound, quick page turn",
  star: "Quick magical sparkle ding, rewarding star earned",
};

export async function elevenLabsSfx(eventType: string): Promise<boolean> {
  const cacheKey = `sfx:${eventType}`;
  let url = audioCache.get(cacheKey);

  if (!url) {
    const prompt = SFX_PROMPTS[eventType];
    if (!prompt) return false;
    const duration = eventType === "win" ? 5 : eventType === "match" ? 3 : 2;
    url = await fetchAudio("elevenlabs-sfx", { prompt, duration }) ?? undefined;
    if (url) audioCache.set(cacheKey, url);
  }

  if (url) {
    try {
      const audio = new Audio(url);
      audio.volume = eventType === "win" ? 0.9 : 0.7;
      await audio.play();
      return true;
    } catch { /* fallback */ }
  }
  return false;
}

// ─── Music ─────────────────────────────────────────────
export async function elevenLabsGenerateMusic(prompt: string, duration: number = 30): Promise<string | null> {
  return fetchAudio("elevenlabs-music", { prompt, duration });
}

// ─── Pre-warm cache ────────────────────────────────────
export function preWarmElevenLabsCache() {
  // Pre-generate common SFX in background
  ["match", "mismatch", "flip", "star"].forEach((evt) => {
    if (!audioCache.has(`sfx:${evt}`)) {
      elevenLabsSfx(evt).catch(() => {});
    }
  });
}

// ─── Cleanup ───────────────────────────────────────────
export function clearElevenLabsCache() {
  audioCache.forEach((url) => URL.revokeObjectURL(url));
  audioCache.clear();
}
