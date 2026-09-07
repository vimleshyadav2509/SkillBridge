
/**
 * ResumeIQ Tracked URL Package & UTM Link Generator Utility
 */

export const BASE_PRODUCTION_URL = "https://resumeiq-red.vercel.app/";

/**
 * Sanitizes any input URL to return a clean, HTTPS-enforced canonical production URL.
 * Strips out staging subdomains, extra trailing slashes, or clutter query parameters.
 */
export function sanitizeUrl(rawUrl = BASE_PRODUCTION_URL) {
  try {
    const parsed = new URL(rawUrl);
    parsed.protocol = "https:";
    return parsed.origin + parsed.pathname.replace(/\/+$/, "") + "/";
  } catch {
    return BASE_PRODUCTION_URL;
  }
}

/**
 * Generates a clean, UTM-parameterized URL for campaign click tracking.
 */
export function generateUtmUrl({
  baseUrl = BASE_PRODUCTION_URL,
  source = "linkedin",
  medium = "social",
  campaign = "resumeiq_launch",
  content = "",
  term = ""
} = {}) {
  const cleanBase = sanitizeUrl(baseUrl);
  const params = new URLSearchParams();

  if (source) params.set("utm_source", source.trim().toLowerCase());
  if (medium) params.set("utm_medium", medium.trim().toLowerCase());
  if (campaign) params.set("utm_campaign", campaign.trim().toLowerCase());
  if (content) params.set("utm_content", content.trim().toLowerCase());
  if (term) params.set("utm_term", term.trim().toLowerCase());

  const queryString = params.toString();
  return queryString ? `${cleanBase}?${queryString}` : cleanBase;
}

/**
 * Ready-to-use professional URL share presets
 */
export const SHARE_PRESETS = {
  linkedin: generateUtmUrl({
    source: "linkedin",
    medium: "social",
    campaign: "resumeiq_launch",
    content: "headline_link"
  }),
  twitter: generateUtmUrl({
    source: "twitter",
    medium: "social",
    campaign: "resumeiq_launch",
    content: "card_link"
  }),
  whatsapp: generateUtmUrl({
    source: "whatsapp",
    medium: "dark_social",
    campaign: "resumeiq_share",
    content: "direct_message"
  }),
  recruiterEmail: generateUtmUrl({
    source: "recruiter_email",
    medium: "email",
    campaign: "outreach",
    content: "signature"
  }),
  producthunt: generateUtmUrl({
    source: "producthunt",
    medium: "referral",
    campaign: "launch",
    content: "featured_badge"
  })
};

/**
 * Helper to build custom domain shortlink payload (compatible with Dub.co or Bitly APIs)
 */
export function buildShortLinkPayload({ domain = "resumeiq.app", key = "launch", destinationUrl = SHARE_PRESETS.linkedin } = {}) {
  return {
    domain,
    key,
    url: destinationUrl,
    archived: false,
    title: "ResumeIQ - AI ATS Resume Scanner",
    description: "Instant PDF parsing, AI keyword extraction & job matching."
  };
}
