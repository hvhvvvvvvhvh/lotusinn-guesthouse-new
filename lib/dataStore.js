import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'node:crypto';

const root = process.cwd();
const dataRoot = process.env.LOTUS_DATA_DIR || path.join(root, 'data');
const publicDataRoot = process.env.LOTUS_PUBLIC_DATA_DIR || path.join(root, 'public', 'data');

export const filePaths = {
  site: path.join(publicDataRoot, 'siteData.json'),
  rooms: path.join(publicDataRoot, 'roomsData.json'),
  bookings: path.join(dataRoot, 'bookings.json'),
  expenses: path.join(dataRoot, 'expenses.json'),
  messages: path.join(dataRoot, 'messages.json'),
  blogs: path.join(dataRoot, 'blogs.json'),
  authors: path.join(dataRoot, 'authors.json')
};

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function writeJson(filePath, value) {
  return updateJson(filePath, () => value);
}

// Serialize updates in this Node process; rename prevents partially read JSON.
// Next can bundle the same helper into several API routes. Share the queue
// across those bundles so guest submissions and admin edits use the same lock.
const queueKey = Symbol.for('lotus.jsonWrites');
const pendingWrites = globalThis[queueKey] ||= new Map();
export function updateJson(filePath, update) {
  const previous = pendingWrites.get(filePath) || Promise.resolve();
  const current = previous.catch(() => {}).then(async () => {
    let existing;
    try { existing = await readJson(filePath); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const value = await update(existing);
    await atomicWrite(filePath, value);
    return value;
  });
  pendingWrites.set(filePath, current);
  const clear = () => { if (pendingWrites.get(filePath) === current) pendingWrites.delete(filePath); };
  current.then(clear, clear);
  return current;
}

async function atomicWrite(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), 'utf8');
    await fs.rename(temporary, filePath);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
