import type { SyncStats } from "../database";

export interface FormatStatusInput {
  canDiff: boolean;
  stats: SyncStats;
}
export function formatStatus({ canDiff, stats }: FormatStatusInput) {
  const { ahead, behind, conflict, total } = stats;

  const segments: string[] = [];
  if (conflict && canDiff) segments.push(`${conflict} conflict`);
  if (behind && canDiff) segments.push(`${behind} in`);
  if (ahead && canDiff) segments.push(`${ahead} out`);

  segments.push(`${total} total`);
  if (!canDiff) segments.push("local mode");

  return segments.join(" | ");
}
