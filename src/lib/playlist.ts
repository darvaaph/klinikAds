// Weighted rotation for the TV content player (TASKS T-011).
//
// Smooth weighted round-robin (the nginx algorithm): over every cycle of
// sum(bobot) picks, each item plays exactly `bobot` times, spread out rather than
// bunched. That keeps sponsor airtime exactly proportional to the weight they paid
// for, which a random pick cannot guarantee. On top of that, the item that just
// played is never picked again directly when there is any other item.

export type ItemBerbobot = { kontenId: string; bobot: number };

export type StatusRotasi = Map<string, number>; // kontenId → current weight

export function buatStatusRotasi(): StatusRotasi {
  return new Map();
}

/**
 * Picks the next item and updates `status` in place. Returns null for an empty list.
 * `sebelumnya` is the kontenId that played last.
 */
export function pilihBerikutnya<T extends ItemBerbobot>(
  playlist: readonly T[],
  status: StatusRotasi,
  sebelumnya: string | null,
): T | null {
  if (playlist.length === 0) return null;

  const total = playlist.reduce((s, i) => s + Math.max(1, i.bobot), 0);
  for (const item of playlist) {
    status.set(item.kontenId, (status.get(item.kontenId) ?? 0) + Math.max(1, item.bobot));
  }

  let terpilih: T | null = null;
  for (const item of playlist) {
    if (playlist.length > 1 && item.kontenId === sebelumnya) continue;
    if (!terpilih || status.get(item.kontenId)! > status.get(terpilih.kontenId)!) terpilih = item;
  }

  status.set(terpilih!.kontenId, status.get(terpilih!.kontenId)! - total);
  return terpilih;
}

/** Identity of a playlist's contents; when it changes the rotation restarts. */
export function sidikPlaylist(playlist: readonly ItemBerbobot[]): string {
  return playlist.map((i) => `${i.kontenId}:${i.bobot}`).join("|");
}
