import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { prepareBranding } from './prepare-branding.mjs';
const require = createRequire(import.meta.url);
const postcss = require('postcss');
await prepareBranding();

await fs.mkdir('public/fonts', { recursive: true });
const faces = [];
for (const weight of [300, 400, 500, 600, 700, 800]) {
  await fs.copyFile(`node_modules/@fontsource/poppins/files/poppins-latin-${weight}-normal.woff2`, `public/fonts/poppins-${weight}.woff2`);
  faces.push(`@font-face{font-family:Poppins;font-style:normal;font-weight:${weight};font-display:swap;src:url('/fonts/poppins-${weight}.woff2') format('woff2')}`);
}
await fs.writeFile('styles/fonts.css', faces.join('\n'));

// Use vector paths for the icons this application uses, without downloading an icon font.
let source = '';
async function scan(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.(js|jsx|json)$/.test(file)) source += await fs.readFile(file, 'utf8');
  }
}
for (const directory of ['components', 'pages', 'public/data', 'data']) await scan(directory);
const names = new Set([...source.matchAll(/\bfa-([a-z0-9-]+)/g)].map(match => match[1]));
const iconAliases = { hamburger: 'burger', 'shield-alt': 'shield-halved' };
const rules = ['/* Font Awesome Free 6.5.1 — Fonticons, Inc. — Icons: CC BY 4.0 https://fontawesome.com/license/free */', '.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{display:inline-block;font-style:normal;line-height:1}',
  '.fa:before,.fas:before,.far:before,.fab:before,.fa-solid:before,.fa-regular:before,.fa-brands:before{content:"";display:inline-block;width:1em;height:1em;vertical-align:-.125em;background:currentColor;mask:var(--fa-icon) center/contain no-repeat;-webkit-mask:var(--fa-icon) center/contain no-repeat}'];
for (const name of names) {
  let found = false;
  for (const variant of ['solid', 'brands', 'regular']) {
    let svg;
    try { svg = await fs.readFile(`node_modules/@fortawesome/fontawesome-free/svgs/${variant}/${iconAliases[name] || name}.svg`, 'utf8'); } catch { continue; }
    svg = svg.replace(/<!--[\s\S]*?-->/g, '').trim();
    rules.push(`${found && variant === 'regular' ? '.fa-regular' : ''}.fa-${name}{--fa-icon:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`);
    found = true;
  }
}
await fs.writeFile('styles/icons.css', rules.join('\n'));

const adminRoot = postcss.parse(await fs.readFile('styles/admin.css', 'utf8'));
function splitRules(node, publicRules) {
  const copy = node.clone();
  if (copy.type === 'rule') {
    const selectors = postcss.list.comma(copy.selector).filter(selector => /\.lotus-/.test(selector) === publicRules);
    if (!selectors.length) return null;
    copy.selector = selectors.join(',');
  } else if (copy.nodes && copy.type !== 'decl') {
    copy.removeAll();
    for (const child of node.nodes) { const selected = splitRules(child, publicRules); if (selected) copy.append(selected); }
    if (!copy.nodes.length) return null;
  } else if (copy.type !== 'decl') return null;
  return copy;
}
for (const [output, inputs] of Object.entries({ public: ['style', 'gallery', 'roomDetail'], admin: [] })) {
  const css = await Promise.all(inputs.map(name => fs.readFile(`styles/${name}.css`, 'utf8')));
  const root = postcss.parse(css.join('\n'));
  for (const node of adminRoot.nodes) { const selected = splitRules(node, output === 'public'); if (selected) root.append(selected); }
  root.walkComments(comment => comment.remove());
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    rule.selector = postcss.list.comma(rule.selector).map(selector => {
      if (selector === 'body' || selector === ':root') return '.surface';
      return `.surface :global(${selector.replace(/^body(?=[ .:#[])/, '')})`;
    }).join(',');
  });
  await fs.writeFile(`styles/${output}.module.css`, root.toString());
}
console.log(`Prepared scoped styles, six Latin font files, and ${names.size} application icon names.`);
