const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { HttpsProxyAgent } = require('https-proxy-agent');
const db = require('../db');
const router = express.Router();

let _client = null;
function getClient() {
  if (!_client) {
    const opts = { apiKey: process.env.ANTHROPIC_API_KEY };
    const proxyUrl = process.env.GLOBAL_AGENT_HTTP_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy;
    if (proxyUrl) opts.httpAgent = new HttpsProxyAgent(proxyUrl);
    _client = new Anthropic(opts);
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a social media strategist for Rep'd, a GovTech SaaS company that helps government agencies modernize operations. Your audience is city/county officials, procurement leads, and civic tech professionals on LinkedIn.

BRAND VOICE: When brand voice examples are provided, study them carefully and mirror that exact voice, tone, rhythm, and sentence structure — regardless of post type. Those examples represent Rep'd's real voice and must guide all output.

LINKEDIN BEST PRACTICES:
- Open with a bold hook on the very first line: a surprising stat, a relatable frustration, or a confident statement. No preambles.
- Use short paragraphs (1–3 sentences) with line breaks for mobile readability.
- Write conversationally — contractions, direct address, real language. No corporate speak.
- Lead with the problem or insight, not the product name or feature.
- Include one specific detail (number, city name, outcome) to make it feel real.
- End with a genuine question or clear CTA that invites a reply or click.
- Optimal length: 150–250 words. Never exceed 300.
- Avoid bullet-point walls, hashtag spam (max 3 relevant tags), and buzzword phrases.

Always return ONLY a valid JSON object: { copy: string, imageQueries: string[3], bestTime: string, postType: string }`;

const POST_TYPE_CONTEXT = {
  'Product Update':                                'Explain what Rep\'d does and how it helps government teams solve a specific problem. Lead with the problem, not the feature. Make it relatable.',
  'Customer Stories':                              'Highlight a real municipality using Rep\'d and the outcomes they\'re seeing. Be specific with numbers when provided. Tell the transformation story.',
  'Thought Leadership (Industry POV)':             'Share a bold perspective, trend, or opinion on the future of government and technology. Spark conversation. Position Rep\'d as the smart voice in the room.',
  'Announcements (Product, Partnerships, Launches)':'Communicate a major update — new customer, product release, or partnership. Lead with the impact, not the feature. Make officials pay attention.',
  'Video Content (Demos + Real Gov Voices)':       'Write copy to accompany a short-form video showcasing Rep\'d or amplifying authentic voices from government staff. Tease what\'s in the video.',
  'Platform Insights':                             'Surface a trend, stat, or pattern that helps governments understand resident needs or the GovTech landscape. Data-forward but written for humans.',
  "Rep'd Behind-the-Scenes":                       'Show the people, events, and relationships behind Rep\'d. Build trust and familiarity. Genuine and warm — not a press release.',
};

router.post('/', async (req, res) => {
  const { prompt, postType } = req.body;

  if (!prompt || !postType) {
    return res.status(400).json({ error: 'prompt and postType are required' });
  }

  // Fetch brand voice examples — type-matched first, then any, up to 5 total
  const examples = db.prepare(`
    SELECT copy FROM brand_examples
    ORDER BY CASE WHEN type = ? THEN 0 ELSE 1 END, created_at DESC
    LIMIT 5
  `).all(postType);

  const exampleBlock = examples.length > 0
    ? `\n\nBRAND VOICE EXAMPLES — these are real Rep'd LinkedIn posts. Mirror this voice exactly:\n\n${examples.map((e, i) => `--- Example ${i + 1} ---\n${e.copy}`).join('\n\n')}\n\n---\nApply this voice to all content you generate.`
    : '';

  const typeContext = POST_TYPE_CONTEXT[postType] || '';
  const userMessage = `Post type: ${postType}\nContext: ${typeContext}${exampleBlock}\n\nUser's input: ${prompt}\n\nGenerate a LinkedIn post for Rep'd. Return ONLY valid JSON.`;

  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const rawText = message.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Model returned malformed response', raw: rawText });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({
      copy: parsed.copy || '',
      imageQueries: Array.isArray(parsed.imageQueries) ? parsed.imageQueries.slice(0, 3) : [],
      bestTime: parsed.bestTime || 'Tuesday–Thursday, 8–10 AM or 5–6 PM',
      postType: parsed.postType || postType
    });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
