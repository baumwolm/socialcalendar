const express = require('express');
const { HttpsProxyAgent } = require('https-proxy-agent');
const Anthropic = require('@anthropic-ai/sdk');
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

const REFINE_INSTRUCTIONS = {
  shorter:       'Shorten this LinkedIn post by ~30%. Keep the hook and CTA. Cut filler, redundancy, and any weak sentences. Return ONLY the revised post copy, no explanation.',
  much_shorter:  'Cut this LinkedIn post to under 100 words. Keep the single strongest hook and one clear CTA. Ruthlessly cut everything else. Return ONLY the revised post copy, no explanation.',
  more_human:    'Rewrite this LinkedIn post to sound more human, warm, and conversational — less corporate. Keep the same message and structure but make it feel like a real person wrote it, not a marketing team. Return ONLY the revised post copy, no explanation.',
}

// POST /refine — refine existing copy with a quick instruction
router.post('/', async (req, res) => {
  const { copy, instruction } = req.body;

  if (!copy || !instruction) {
    return res.status(400).json({ error: 'copy and instruction are required' });
  }

  const instructionText = REFINE_INSTRUCTIONS[instruction];
  if (!instructionText) {
    return res.status(400).json({ error: `Unknown instruction. Valid: ${Object.keys(REFINE_INSTRUCTIONS).join(', ')}` });
  }

  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `${instructionText}\n\n---\n\n${copy}`
      }]
    });

    res.json({ copy: message.content[0].text.trim() });
  } catch (err) {
    console.error('Refine error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
