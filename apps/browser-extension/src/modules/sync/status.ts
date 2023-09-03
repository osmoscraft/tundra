import type { SyncStats } from "../database";

export interface FormatStatusInput {
  hasRemote: boolean;
  stats: SyncStats;
}
export function formatStatus({ hasRemote, stats }: FormatStatusInput) {
  const { ahead, behind, conflict, total } = stats;

  // if (!hasRemote) return "Local only";

  const segments: string[] = [];
  if (ahead && hasRemote) segments.push(`↑ ${ahead}`);
  if (behind && hasRemote) segments.push(`↓ ${behind}`);
  if (conflict && hasRemote) segments.push(`! ${conflict}`);

  const synced = hasRemote ? total - conflict - ahead - behind : 0;
  if (synced) segments.push(`${synced} synced`);

  const localOnly = !hasRemote ? total : 0;
  if (localOnly) segments.push(`${localOnly} local`);

  if (!segments.length) return "Empty";

  return segments.join(" | ");
}
