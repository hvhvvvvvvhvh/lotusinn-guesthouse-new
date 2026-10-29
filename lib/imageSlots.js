// Only these existing image fields can be edited; client paths are never trusted.
export function imageSlots(site, rooms, { includeDerived = false } = {}) {
  const slots = [];
  function walk(value, path, dataset, group) {
    // Home room/blog thumbnails come from the canonical room and blog records.
    if (!includeDerived && dataset === 'site' && ['home.rooms.cards', 'home.blog.posts'].includes(path.join('.'))) return;
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, [...path, String(index)], dataset, group));
    if (value && typeof value === 'object') return Object.entries(value).forEach(([key, item]) => walk(item, [...path, key], dataset, group));
    const leaf = path.at(-1);
    if (typeof value === 'string' && (['image', 'src', 'logo', 'backgroundImage'].includes(leaf) || path.at(-2) === 'images')) {
      let label = path.join(' / ');
      const number = Number(path.findLast(part => /^\d+$/.test(part))) + 1;
      if (dataset === 'site') {
        if (path[0] === 'layout') label = 'Website logo';
        if (path[0] === 'images') label = { hero: 'Main page banner', bookingHero: 'Booking page banner', contactHero: 'Contact page banner' }[leaf] || leaf;
        if (path[0] === 'home' && path[1] === 'gallery') label = `Home gallery · Photo ${number}`;
        if (path[0] === 'home' && path[1] === 'reviews') label = `Guest review portrait · ${site.home.reviews.groups[path[3]]?.[path[4]]?.name || number}`;
        if (path[0] === 'about') {
          if (path[1] === 'intro') label = `About introduction · Photo ${number}`;
          if (path[1] === 'roomsPreview') label = `About room preview · ${site.about.roomsPreview.cards[path[3]]?.title || number}`;
          if (path[1] === 'hospitality') label = 'About hospitality photo';
          if (path[1] === 'gallery') label = `About gallery · Photo ${number}`;
        }
        if (path[0] === 'galleryPage') label = `Gallery · Photo ${number} · ${site.galleryPage.images[path[2]]?.category || 'Guest house'}`;
      } else {
        if (path[0] === 'roomsPage') label = `${path[1] === 'masterRooms' ? 'Featured room card' : 'Room card'} · ${rooms.roomsPage[path[1]]?.[path[2]]?.title || number}`;
        if (path[0] === 'roomDetails') label = `${rooms.roomDetails[path[1]]?.name || path[1]} gallery · Photo ${number}`;
      }
      slots.push({ id: `${dataset}:${path.join('.')}`, dataset, path, group, label, value });
    }
  }
  walk(site, [], 'site', 'Website');
  walk(rooms, [], 'rooms', 'Rooms');
  return slots;
}

export function withImageDefaults(site) {
  return { ...site, images: {
    hero: '/images/DSC_0271.JPG',
    bookingHero: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
    contactHero: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
    ...site.images,
  } };
}

export function setImageSlot(document, path, value) {
  let target = document;
  for (const key of path.slice(0, -1)) target = target[key];
  target[path.at(-1)] = value;
  return document;
}
