import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();

export const filePaths = {
  site: path.join(root, 'public', 'data', 'siteData.json'),
  rooms: path.join(root, 'public', 'data', 'roomsData.json'),
  bookings: path.join(root, 'data', 'bookings.json'),
  expenses: path.join(process.cwd(), 'data', 'expenses.json'),
  messages: path.join(root, 'data', 'messages.json'),
  blogs: path.join(root, 'data', 'blogs.json'),
  authors: path.join(root, 'data', 'authors.json')
};

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}
