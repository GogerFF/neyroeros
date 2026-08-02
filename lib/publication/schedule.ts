export function nextPublicationSlot(
  now: Date,
  occupiedSlots: Date[],
  itemsPerDay = 6,
): Date {
  const intervalHours = 24 / Math.max(1, itemsPerDay);
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const dayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const occupied = new Set(occupiedSlots.map((date) => date.getTime()));
  let slot = dayStart + Math.ceil((now.getTime() - dayStart) / intervalMs) * intervalMs;

  if (slot <= now.getTime()) slot += intervalMs;
  while (occupied.has(slot)) slot += intervalMs;

  return new Date(slot);
}
