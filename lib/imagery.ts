import { existsSync } from "node:fs";
import { join } from "node:path";
import { imagery, type Photo } from "@/config/imagery";

// Runs at build time: a photo that is listed but missing would otherwise
// show up as a broken image on the live site.
const listed: Photo[] = [...(imagery.hero ? [imagery.hero] : []), ...Object.values(imagery.categories)];
const missing = listed.filter((p) => !p.src.startsWith("/") || !existsSync(join(process.cwd(), "public", p.src)));
if (missing.length > 0) {
  throw new Error(
    "config/imagery.ts lists photos that are not in public/:\n" + missing.map((p) => `  - ${p.src}`).join("\n"),
  );
}

export const heroPhoto: Photo | null = imagery.hero;

export function categoryPhoto(category: string): Photo | null {
  return imagery.categories[category] ?? null;
}
