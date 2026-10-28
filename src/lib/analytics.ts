/**
 * Google Analytics event tracking.
 *
 * Thin typed wrapper around the global `gtag` function. Page views are sent
 * automatically by the `gtag('config', ...)` call in index.html, so only
 * custom events go through here.
 *
 * Events are only sent from the production hostname so preview deployments,
 * localhost and *.vercel.app traffic don't pollute GA reports.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/events
 */

const PRODUCTION_HOSTNAME = "www.musicpassphrase.com";

/** Event names and their parameters. Keep in sync with GA4 custom dimensions. */
export interface AnalyticsEvents {
  generate_start: { artist_count: number };
  generate_passphrase: {
    artist_count: number;
    with_numbers: boolean;
    with_symbols: boolean;
    source: "api" | "mock";
  };
  generate_error: { error_type: "network" | "server" };
  copy_passphrase: { passphrase_index: number };
  toggle_option: { option_name: string; option_state: boolean };
}

const shouldSend = (): boolean =>
  typeof window !== "undefined" &&
  window.location.hostname === PRODUCTION_HOSTNAME &&
  typeof window.gtag === "function";

/**
 * Sends a custom event to Google Analytics.
 *
 * Off the production hostname the event is logged to the console instead.
 */
export const track = <K extends keyof AnalyticsEvents>(
  eventName: K,
  params: AnalyticsEvents[K]
): void => {
  if (!shouldSend()) {
    console.log(`[Analytics Event]: ${eventName}`, params);
    return;
  }

  try {
    window.gtag("event", eventName, params);
  } catch (error) {
    console.error(`[Analytics]: Failed to track event "${eventName}":`, error);
  }
};
