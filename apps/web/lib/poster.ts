// Deterministic graded "poster" for a project/media that has no real image yet — mirrors the
// prototype's cinematic gradient placeholders. Same slug → same grade.
export function poster(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const hue = (h >>> 0) % 360;
  const hue2 = (hue + 40) % 360;
  return `radial-gradient(80% 120% at 25% 15%, hsl(${hue} 32% 16%), #131315 60%), radial-gradient(90% 120% at 80% 90%, hsl(${hue2} 30% 14%), #111214)`;
}
