const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();

let ProxyAgent = null;
try {
  const mod = require('https-proxy-agent');
  ProxyAgent = mod.HttpsProxyAgent;
} catch (_) {}

// Fetch a URL and return raw HTML, following one redirect
function fetchHtml(url, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 3) return reject(new Error('Too many redirects'));

    const proxyUrl =
      process.env.GLOBAL_AGENT_HTTP_PROXY ||
      process.env.HTTPS_PROXY ||
      process.env.https_proxy;

    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkedInBot/1.0; +https://www.linkedin.com/help/linkedin/answer/a415886)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    };
    if (proxyUrl && ProxyAgent) options.agent = new ProxyAgent(proxyUrl);

    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, options, (resp) => {
      // Follow redirect
      if (
        resp.statusCode >= 301 &&
        resp.statusCode <= 308 &&
        resp.headers.location
      ) {
        const next = resp.headers.location.startsWith('http')
          ? resp.headers.location
          : new URL(resp.headers.location, url).href;
        resp.resume();
        return fetchHtml(next, depth + 1).then(resolve).catch(reject);
      }

      let data = '';
      resp.setEncoding('utf8');
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => resolve(data));
    });

    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

function extractMeta(html, ...patterns) {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeEntities(m[1].trim());
  }
  return '';
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// POST /scrape  { url }
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const html = await fetchHtml(url.trim());

    const description = extractMeta(
      html,
      /<meta\s[^>]*property=["']og:description["'][^>]*content=["']([^"']*?)["']/i,
      /<meta\s[^>]*content=["']([^"']*?)["'][^>]*property=["']og:description["']/i,
      /<meta\s[^>]*name=["']description["'][^>]*content=["']([^"']*?)["']/i,
      /<meta\s[^>]*content=["']([^"']*?)["'][^>]*name=["']description["']/i,
    );

    const imageUrl = extractMeta(
      html,
      /<meta\s[^>]*property=["']og:image["'][^>]*content=["']([^"']*?)["']/i,
      /<meta\s[^>]*content=["']([^"']*?)["'][^>]*property=["']og:image["']/i,
    );

    const title = extractMeta(
      html,
      /<meta\s[^>]*property=["']og:title["'][^>]*content=["']([^"']*?)["']/i,
      /<meta\s[^>]*content=["']([^"']*?)["'][^>]*property=["']og:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    );

    res.json({ copy: description, imageUrl, title });
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: 'Could not fetch URL: ' + err.message });
  }
});

module.exports = router;
