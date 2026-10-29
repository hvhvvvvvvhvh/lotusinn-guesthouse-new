import { filePaths, readJson } from './dataStore.js';
import { withImageDefaults } from './imageSlots.js';
import { publicDataset } from './publicDataset.js';
export function cachePublicPage(res) { res?.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30'); }
export async function publicPage(context, dataset = 'site') {
  const [rawSite, other] = await Promise.all([readJson(filePaths.site), dataset === 'site' ? null : readJson(filePaths[dataset])]);
  const site = publicDataset(withImageDefaults(rawSite), 'site');
  const data = dataset === 'site' ? site : publicDataset(other, dataset);
  if (dataset === 'rooms') {
    const bySlug = Object.fromEntries(data.roomsPage.availableRooms.map(room => [room.slug, room]));
    data.roomsPage.masterRooms = data.roomsPage.masterRooms.filter(room => bySlug[room.slug]).map(room => ({ ...room, ...bySlug[room.slug], image: room.image || bySlug[room.slug].image }));
  }
  cachePublicPage(context.res);
  return { props: { data, siteLayout: site.layout, siteImages: site.images } };
}
