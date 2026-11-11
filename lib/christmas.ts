// Decides which Christmas delivery message the sitewide banner shows.
// No imports on purpose: the tests run this file directly under Node.

export type ChristmasBannerState = "before-cutoff" | "after-cutoff" | "hidden";

export interface ChristmasDelivery {
  /** Last moment an order still arrives before Christmas Eve (ISO date-time). */
  orderBy: string;
  /** When the banner disappears altogether (ISO date-time). */
  seasonEnds: string;
}

export function christmasBannerState(now: Date, config: ChristmasDelivery): ChristmasBannerState {
  const t = now.getTime();
  if (t <= Date.parse(config.orderBy)) return "before-cutoff";
  if (t <= Date.parse(config.seasonEnds)) return "after-cutoff";
  return "hidden";
}
