import { createHash } from 'node:crypto';
export const imageHash = value => createHash('sha256').update(value).digest('hex');
export function adminImageSlots(slots) {
  return slots.map(({ value, ...slot }) => {
    const legacy = value.startsWith('data:image/');
    return { ...slot, value: legacy ? '' : value, expectedHash: imageHash(value), preview: legacy ? `/api/media?${new URLSearchParams({ dataset: slot.dataset, slot: slot.id, v: imageHash(value).slice(0, 16) })}` : value };
  });
}
