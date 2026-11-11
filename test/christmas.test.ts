import { test } from "node:test";
import assert from "node:assert/strict";
import { christmasBannerState } from "../lib/christmas.ts";

const config = { orderBy: "2026-12-10T23:59:59+02:00", seasonEnds: "2026-12-24T23:59:59+02:00" };
const at = (iso: string) => christmasBannerState(new Date(iso), config);

test("before the cutoff the banner promises Christmas delivery", () => {
  assert.equal(at("2026-11-27T12:00:00+02:00"), "before-cutoff");
  assert.equal(at("2026-12-10T23:59:59+02:00"), "before-cutoff");
});

test("one second after the cutoff the promise is gone", () => {
  assert.equal(at("2026-12-11T00:00:00+02:00"), "after-cutoff");
});

test("the cutoff is Estonian time, whatever the visitor's clock says", () => {
  // 22:30 UTC on 10 Dec is already 00:30 on 11 Dec in Estonia.
  assert.equal(at("2026-12-10T22:30:00Z"), "after-cutoff");
});

test("after the season the banner is hidden", () => {
  assert.equal(at("2026-12-25T00:00:00+02:00"), "hidden");
});
