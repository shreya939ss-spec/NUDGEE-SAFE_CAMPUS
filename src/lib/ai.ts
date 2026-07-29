import { supabase } from './supabase';

const AI_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-router`;

export type AiMode = 'companion' | 'shield' | 'report_normalizer' | 'insights';

export type AiResponse = {
  reply: string;
  hostel?: string;
  category?: string;
  description?: string;
  error?: string;
};

export const SHIELD_FALLBACK = `**Escape Line:** "Nah, I'm good — I've got an early morning and I'm trying to stay sharp. You go ahead though."

**Reframe:** Saying no doesn't make you less part of the group — it makes you the person who's strong enough to choose for themselves. People respect that more than they admit. You're not missing out on anything; you're keeping your edge.

**Mentor Support:** If this kind of pressure keeps coming up, reach out to a mentor — they've helped plenty of students handle exactly this. You don't have to figure it out alone.`;

export async function callAi(mode: AiMode, message: string, context?: string, timeoutMs = 8000): Promise<AiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(AI_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ mode, message, context }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return { reply: '', error: errBody.error || `Request failed (${response.status})` };
    }

    const data = await response.json();
    return data as AiResponse;
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('aborted') || msg.includes('timeout') || msg.includes('fetch')) {
      return { reply: '', error: 'timeout' };
    }
    return { reply: '', error: msg };
  }
}
