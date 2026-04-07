const express = require('express');
const { google } = require('googleapis');
const db = require('../db');
const { getOAuthClient } = require('./auth');
const router = express.Router();

// Map post types to Google Calendar event colors (colorId 1–11)
const TYPE_COLOR_MAP = {
  'Customer Launch':            '2',  // Sage (green)
  'Case Study':                 '1',  // Lavender (blue-ish)
  'New Product':                '3',  // Grape (purple)
  'Employee Shoutout':          '5',  // Banana (yellow)
  'GovTech Thought Leadership': '6',  // Tangerine (orange)
  'Conference Recap':           '11'  // Tomato (red)
};

function getFirstNWords(text, n = 6) {
  return text.split(/\s+/).slice(0, n).join(' ');
}

// POST /calendar/sync — create or update a Google Calendar event for a post
router.post('/sync', async (req, res) => {
  const { postId } = req.body;

  if (!req.session.googleTokens) {
    return res.status(401).json({ error: 'Not authenticated with Google. Visit /auth/google first.' });
  }

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(req.session.googleTokens);

    // Refresh token if expired
    oauth2Client.on('tokens', (tokens) => {
      req.session.googleTokens = { ...req.session.googleTokens, ...tokens };
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const title = `[${post.type}] — ${getFirstNWords(post.copy)}`;
    const description = [
      post.copy,
      '',
      post.image_query ? `Image suggestion: ${post.image_query}` : '',
      post.best_time ? `Best time to post: ${post.best_time}` : '',
      post.notes ? `\nNotes: ${post.notes}` : ''
    ].filter(Boolean).join('\n');

    // Use the post date; default to 9 AM–10 AM local time
    const startDateTime = `${post.date}T09:00:00`;
    const endDateTime = `${post.date}T10:00:00`;

    const eventBody = {
      summary: title,
      description,
      start: { dateTime: startDateTime, timeZone: 'America/New_York' },
      end: { dateTime: endDateTime, timeZone: 'America/New_York' },
      colorId: TYPE_COLOR_MAP[post.type] || '1',
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 30 }]
      }
    };

    let event;
    if (post.google_event_id) {
      // Update existing event
      event = await calendar.events.update({
        calendarId: 'primary',
        eventId: post.google_event_id,
        requestBody: eventBody
      });
    } else {
      // Create new event
      event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventBody
      });
    }

    // Save event ID back to post
    db.prepare('UPDATE posts SET google_event_id = ? WHERE id = ?').run(event.data.id, postId);

    res.json({ success: true, eventId: event.data.id, eventLink: event.data.htmlLink });
  } catch (err) {
    console.error('Google Calendar sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
