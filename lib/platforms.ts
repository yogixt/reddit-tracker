export const PLATFORMS = ["reddit", "quora", "linkedin"] as const;
export type Platform = (typeof PLATFORMS)[number];

export function isPlatform(v: unknown): v is Platform {
  return typeof v === "string" && (PLATFORMS as readonly string[]).includes(v);
}

interface PlatformMeta {
  key: Platform;
  label: string;
  color: string;
  /** employees column holding this platform's handle */
  handleField: "reddit_username" | "quora_username" | "linkedin_url";
  /** how the "communities" free-text field is labelled per platform */
  contextLabel: string;
  /** how engagement is auto-collected */
  source: "api" | "scraper";
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  reddit: {
    key: "reddit",
    label: "Reddit",
    color: "#ff4500",
    handleField: "reddit_username",
    contextLabel: "Subreddits",
    source: "api",
  },
  quora: {
    key: "quora",
    label: "Quora",
    color: "#b92b27",
    handleField: "quora_username",
    contextLabel: "Spaces / Topics",
    source: "scraper",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0a66c2",
    handleField: "linkedin_url",
    contextLabel: "Hashtags / Groups",
    source: "scraper",
  },
};
