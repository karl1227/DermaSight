import { readFileSync } from 'node:fs';

// Serve the same root-level files used by the public static host. Keep old
// development URLs working for installed app versions during the transition.
const pages = new Map();
for (const name of [
  'index.html',
  'privacy.html',
  'medical-disclaimer.html',
  'styles.css',
]) {
  const page = {
    type: name.endsWith('.css') ? 'text/css' : 'text/html',
    body: readFileSync(new URL(`../website/${name}`, import.meta.url)),
  };
  pages.set(`/${name}`, page);
  pages.set(`/policies/${name}`, page);
  if (name === 'index.html') {
    pages.set('/', page);
    pages.set('/policies/about.html', page);
  }
}

export function servePublicPage(req, res) {
  const path = (req.url || '').split('?')[0];
  const page = pages.get(path);
  if (!page || !['GET', 'HEAD'].includes(req.method)) return false;
  res.writeHead(200, {
    'Content-Type': `${page.type}; charset=utf-8`,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  });
  res.end(req.method === 'HEAD' ? undefined : page.body);
  return true;
}
