import { readPublicJson } from './publicStore.js';
export async function getPublicBlogs() { return (await readPublicJson('blogs')).blogs || []; }
export async function getPublicAuthors() { return (await readPublicJson('authors')).authors || []; }
