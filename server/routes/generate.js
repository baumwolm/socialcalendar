const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { HttpsProxyAgent } = require('https-proxy-agent');
const router = express.Router();

// Lazily create the client so dotenv has time to populate process.env
let _client = null;
function getClient() {
  if (!_client) {
    const opts = { apiKey: process.env.ANTHROPIC_API_KEY };
    const proxyUrl = process.env.GLOBAL_AGENT_HTTP_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy;
    if (proxyUrl) {
      opts.httpAgent = new HttpsProxyAgent(proxyUrl);
    }
    _client = new Anthropic(opts);
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a social media strategist for Rep'd, a GovTech SaaS company that helps government agencies modernize operations. Your audience is city/county officials, procurement leads, and civic tech professionals on LinkedIn. Write posts that are confident, clear, and human — no jargon, no fluff. Lead with a hook. Deliver value fast. End with a question or CTA. Keep it to 150–250 words. Always return a JSON object with: { copy: string, imageQueries: string[3], bestTime: string, postType: string }`;

const POST_TYPE_CONTEXT = {
  'Customer Launch': 'A government agency is going live with Rep\'d. Celebrate the milestone, highlight the agency, and convey the real-world impact for residents.',
  'Case Study': 'Share measurable results and outcomes from a Rep\'d customer. Be specific with data when provided. Tell the story of transformation.',
  'New Product': 'Rep\'d is releasing a new feature or product. Lead with the problem it solves, not the feature itself. Make officials curious.',
  'Employee Shoutout': 'Recognize a Rep\'d team member. Be genuine, specific, and make it feel personal — not like an HR announcement.',
  'GovTech Thought Leadership': 'Share an industry take, trend, or opinion on the GovTech space. Be bold. Spark conversation. Position Rep\'d as the smart voice in the room.',
  'Conference Recap': 'Rep\'d attended or spoke at an event. Share key takeaways, who you met, and why it matters for the GovTech community.'
};

router.post('/', async (req, res) => {
  const { prompt, postType } = req.body;

  if (!prompt || !postType) {
    return res.status(400).json({ error: 'prompt and postType are required' });
  }

  const typeContext = POST_TYPE_CONTEXT[postType] || '';
  const userMessage = `Post type: ${postType}\nContext for this post type: ${typeContext}\n\nUser's input: ${prompt}\n\nGenerate a LinkedIn post for Rep'd. Return ONLY valid JSON.`;

  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const rawText = message.content[0].text.trim();

    // Extract JSON robustly — strip markdown fences if present
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Model returned malformed response', raw: rawText });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure required fields
    const result = {
      copy: parsed.copy || '',
      imageQueries: Array.isArray(parsed.imageQueries) ? parsed.imageQueries.slice(0, 3) : [],
      bestTime: parsed.bestTime || 'Tuesday–Thursday, 8–10 AM or 5–6 PM',
      postType: parsed.postType || postType
    };

    res.json(result);
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
