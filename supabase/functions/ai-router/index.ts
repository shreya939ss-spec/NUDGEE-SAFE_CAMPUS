import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPTS: Record<string, string> = {
  companion: `You are NUDGEE Companion, a warm, practical AI assistant for college students. You help with exam stress, peer pressure, career guidance, resume help, and general wellness. You are campus-context-aware and speak like a supportive friend — never clinical or robotic. Keep responses concise (3-5 sentences), actionable, and encouraging. Never give medical or diagnostic advice. If a student mentions self-harm, depression, or serious mental health concerns, gently refer them to a campus counselor or mentor and provide the SOS guidance. You are NOT a replacement for professional help.`,

  shield: `You are NUDGEE Pressure Shield, an AI that helps students escape peer-pressure situations involving cigarettes, alcohol, drugs, or other risky behavior. The student describes a pressure situation. Your response MUST follow this exact format:

**Escape Line:** Give a short, natural-sounding excuse the student can say right now to get out of the situation (1-2 sentences, conversational, something a real student would actually say).

**Reframe:** Give a confidence-building reframe — a short statement that helps the student feel strong about their choice to say no (2-3 sentences).

**Mentor Support:** Remind them they can reach out to a mentor for ongoing support.

Keep it warm, practical, and empowering. Never judge the student. Never lecture. The student needs something they can use RIGHT NOW.`,

  report_normalizer: `You are NUDGEE Report Normalizer. The student submits a free-text experience report about peer pressure on campus. Your job:
1. Strip ALL identifying details (names, specific room numbers, identifying details). Replace with generic references.
2. Determine the category: one of "tobacco", "alcohol", "drugs", "academic", "social", or "other".
3. Determine the hostel if mentioned, otherwise use "Unknown".
4. Return a clean, anonymous version of the description (2-3 sentences max).

Respond in EXACTLY this JSON format, no other text:
{"hostel": "...", "category": "...", "description": "..."}`,

  insights: `You are NUDGEE Insights AI for campus administrators. You receive aggregated, non-identifying data about wellness check-ins and anonymous pressure reports. Generate a short, actionable natural-language insight (3-5 sentences) that:
1. Identifies trends (e.g. rising pressure in a specific hostel, declining wellness)
2. Suggests a specific intervention (e.g. sports night, mentorship push, wellness workshop)
3. Notes any urgent concerns

Be specific, practical, and data-driven. Do not mention individual students. Do not give medical advice.`,
};

type RequestBody = {
  mode: "companion" | "shield" | "report_normalizer" | "insights";
  message: string;
  context?: string;
};

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error("Empty response from Groq");
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleInsights(supabase: any): Promise<string> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [wellnessRes, reportsRes] = await Promise.all([
    supabase.from("wellness_checks").select("mood, created_at").gte("created_at", sevenDaysAgo),
    supabase.from("pressure_reports").select("hostel, category, created_at").gte("created_at", sevenDaysAgo),
  ]);

  const wellness = wellnessRes.data || [];
  const reports = reportsRes.data || [];

  const moodCounts: Record<string, number> = { happy: 0, neutral: 0, low: 0 };
  wellness.forEach((w: { mood: string }) => {
    moodCounts[w.mood] = (moodCounts[w.mood] || 0) + 1;
  });

  const hostelCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  reports.forEach((r: { hostel: string | null; category: string | null }) => {
    const h = r.hostel || "Unknown";
    hostelCounts[h] = (hostelCounts[h] || 0) + 1;
    const c = r.category || "other";
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });

  const contextStr = JSON.stringify({
    period: "last 7 days",
    wellness: { total: wellness.length, moods: moodCounts },
    pressure_reports: { total: reports.length, by_hostel: hostelCounts, by_category: categoryCounts },
  });

  return callGroq(SYSTEM_PROMPTS.insights, `Here is the aggregated campus data:\n\n${contextStr}\n\nProvide your insight and recommendations.`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { mode, message, context } = body;

    if (!mode || !SYSTEM_PROMPTS[mode]) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insights mode reads from the database
    if (mode === "insights") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const insight = await handleInsights(supabase);
      return new Response(JSON.stringify({ reply: insight }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // report_normalizer: parse JSON from response
    let userMessage = message;
    if (context) userMessage += `\n\nAdditional context: ${context}`;

    const reply = await callGroq(SYSTEM_PROMPTS[mode], userMessage);

    if (mode === "report_normalizer") {
      let parsed: { hostel?: string; category?: string; description?: string } = {};
      try {
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // If JSON parse fails, return raw reply
      }
      return new Response(JSON.stringify({
        reply,
        hostel: parsed.hostel || "Unknown",
        category: parsed.category || "other",
        description: parsed.description || message,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
