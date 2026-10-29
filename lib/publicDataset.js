import { createHash } from 'node:crypto';
import { imageSlots, setImageSlot } from './imageSlots.js';
// Legacy uploads stay out of HTML and JSON responses; fetch them as images.
export function publicDataset(input, dataset) {
  const result = structuredClone(input);
  const slots = imageSlots(dataset === 'site' ? result : {}, dataset === 'rooms' ? result : {}, { includeDerived: true });
  for (const slot of slots) if (slot.value.startsWith('data:image/')) {
    const v = createHash('sha256').update(slot.value).digest('hex').slice(0, 16);
    setImageSlot(result, slot.path, `/api/media?${new URLSearchParams({ dataset, slot: slot.id, v })}`);
  }
  return result;
}
