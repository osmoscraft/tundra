import type { SyncStats } from "../database";

export interface FormatStatusInput {
  hasConnection: boolean;
  hasRemote: boolean;
  stats: SyncStats;
}
export function formatStatus({ hasConnection, hasRemote, stats }: FormatStatusInput) {
  const { ahead, behind, conflict, total } = stats;

  const canCompare = hasConnection && hasRemote;

  const segments: string[] = [];
  if (ahead && canCompare) segments.push(`↑ ${ahead}`);
  if (behind && canCompare) segments.push(`↓ ${behind}`);
  if (conflict && canCompare) segments.push(`! ${conflict}`);

  const synced = canCompare ? total - conflict - ahead - behind : 0;
  if (synced) segments.push(`${synced} synced`);

  const localOnly = !canCompare ? total : 0;
  if (localOnly) segments.push(`${localOnly} local`);

  if (!segments.length) return "Empty";

  return segments.join(" | ");
}
