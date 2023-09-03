import type { SyncStats } from "../database";

export interface FormatStatusInput {
  hasRemote: boolean;
  stats: SyncStats;
}
export function formatStatus({ hasRemote, stats }: FormatStatusInput) {
  const { ahead, behind, conflict } = stats;

  if (!hasRemote) return "Local only";

  const segments: string[] = [];
  if (ahead) segments.push(`↑ ${ahead}`);
  if (behind) segments.push(`↓ ${behind}`);
  if (conflict) segments.push(`! ${conflict}`);

  if (!segments.length) return "Up to date";

  return segments.join(" | ");
}
