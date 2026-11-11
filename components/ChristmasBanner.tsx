"use client";

import { useEffect, useState } from "react";
import { christmasBannerState, type ChristmasBannerState, type ChristmasDelivery } from "@/lib/christmas";

interface Props {
  config: ChristmasDelivery;
  /** State at the moment the site was built; corrected in the browser. */
  initialState: ChristmasBannerState;
  beforeText: string;
  /** Left out where a passed deadline needs no message of its own. */
  afterText?: string;
  className: string;
}

// The site is static, so the HTML carries whatever was true at build time.
// The browser re-checks against the real clock, which is what makes the
// message switch at the cutoff without anyone redeploying.
export function ChristmasBanner({ config, initialState, beforeText, afterText, className }: Props) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(christmasBannerState(new Date(), config));
  }, [config]);

  const text = state === "before-cutoff" ? beforeText : state === "after-cutoff" ? afterText : undefined;
  if (!text) return null;
  return (
    <p className={className} data-state={state}>
      {text}
    </p>
  );
}
