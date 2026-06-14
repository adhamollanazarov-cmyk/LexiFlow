import { createClient } from "@/lib/supabase/client";

type AnalyticsMetadata = Record<string, unknown>;

const FORBIDDEN_METADATA_KEYS = new Set([
  "accessToken",
  "apiKey",
  "context",
  "documentText",
  "email",
  "file",
  "fileContent",
  "fileName",
  "filename",
  "refreshToken",
  "selectedSentence",
  "sentence",
  "text",
  "token",
  "word",
]);

function sanitizeMetadata(metadata: AnalyticsMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !FORBIDDEN_METADATA_KEYS.has(key))
      .map(([key, value]) => {
        if (typeof value === "string") {
          return [key, value.slice(0, 80)];
        }

        if (
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        ) {
          return [key, value];
        }

        return [key, String(value).slice(0, 80)];
      })
  );
}

export async function trackEvent(
  eventName: string,
  metadata: AnalyticsMetadata = {}
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: eventName,
      metadata: sanitizeMetadata(metadata),
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Analytics event failed:", error);
    }
  }
}
