const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
  );
}

// GET /auth/google — redirect to Google consent screen
router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({
      error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env'
    });
  }

  const oauth2Client = getOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// GET /auth/google/callback — exchange code for tokens
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code parameter');

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    req.session.googleTokens = tokens;

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    res.redirect(`${clientOrigin}?google_auth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed: ' + err.message);
  }
});

// GET /auth/status — check if authenticated
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!(req.session.googleTokens),
    hasClientId: !!process.env.GOOGLE_CLIENT_ID
  });
});

// POST /auth/logout — clear tokens
router.post('/logout', (req, res) => {
  req.session.googleTokens = null;
  res.json({ success: true });
});

module.exports = router;
module.exports.getOAuthClient = getOAuthClient;
