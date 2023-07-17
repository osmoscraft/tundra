export function formatStatus(aheadCount: number, behindCount: number, conflictCount: number) {
  if (!aheadCount && !behindCount && !conflictCount) return "Up to date";
  const segments: string[] = [];
  if (aheadCount) segments.push(`↑ ${aheadCount}`);
  if (behindCount) segments.push(`↓ ${behindCount}`);
  if (conflictCount) segments.push(`! ${conflictCount}`);

  return segments.join(" | ");
}
