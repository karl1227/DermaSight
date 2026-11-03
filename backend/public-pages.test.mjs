import test from 'node:test';
import assert from 'node:assert/strict';
import { servePublicPage } from './public-pages.mjs';
test('all policy pages are public HTML with no scripts or private data', () => {
  for (const page of ['privacy', 'medical-disclaimer', 'about']) {
    let headers, body;
    const response = {
      writeHead: (status, value) => {
        assert.equal(status, 200);
        headers = value;
      },
      end: value => {
        body = value.toString();
      },
    };
    assert.equal(
      servePublicPage(
        { method: 'GET', url: `/policies/${page}.html` },
        response,
      ),
      true,
    );
    assert.match(headers['Content-Type'], /text\/html/);
    assert.match(headers['Content-Security-Policy'], /default-src 'none'/);
    assert.match(body, /DermaSight/);
    assert.doesNotMatch(body, /<script|GOCSPX-|password_hash|Bearer /);
  }
});
test('static allowlist cannot expose account data or arbitrary files', () => {
  for (const url of [
    '/policies/../data/auth.db',
    '/policies/%2e%2e/data/auth.db',
    '/policies/.env',
    '/policies/not-found.html',
  ]) {
    assert.equal(servePublicPage({ method: 'GET', url }, {}), false);
  }
  assert.equal(
    servePublicPage({ method: 'POST', url: '/policies/privacy.html' }, {}),
    false,
  );
});

test('root-level pages link to index.html and never the removed about.html', () => {
  for (const file of [
    'index.html',
    'privacy.html',
    'medical-disclaimer.html',
  ]) {
    let body;
    assert.equal(
      servePublicPage(
        { method: 'GET', url: `/${file}` },
        {
          writeHead: status => assert.equal(status, 200),
          end: value => {
            body = value.toString();
          },
        },
      ),
      true,
    );
    assert.match(body, /href="index.html"/);
    assert.match(body, /href="privacy.html"/);
    assert.match(body, /href="medical-disclaimer.html"/);
    assert.match(body, /href="styles.css"/);
    assert.doesNotMatch(body, /href="about.html"/);
  }
});
