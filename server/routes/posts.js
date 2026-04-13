const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /posts — list all, optionally filter by type or status
router.get('/', (req, res) => {
  const { type, status } = req.query;
  let sql = 'SELECT * FROM posts WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY date ASC, created_at ASC';

  try {
    const posts = db.prepare(sql).all(...params);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /posts/:id
router.get('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST /posts — create new post
router.post('/', (req, res) => {
  const { type, date, copy, status = 'draft', image_query, image_url, notes, best_time } = req.body;

  if (!type || !date || !copy) {
    return res.status(400).json({ error: 'type, date, and copy are required' });
  }

  const VALID_TYPES = [
    'Product Update',
    'Customer Stories',
    'Thought Leadership',
    'Announcements',
    'Video Content',
    'Platform Insights',
    'Rep Behind-the-Scenes',
    'Timely / Reactive',
  ];
  const VALID_STATUSES = ['draft', 'scheduled', 'published'];

  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid post type' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const stmt = db.prepare(`
      INSERT INTO posts (type, date, copy, status, image_query, image_url, notes, best_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(type, date, copy, status, image_query || null, image_url || null, notes || null, best_time || null);
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /posts/:id — partial update
router.patch('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const allowed = ['type', 'date', 'copy', 'status', 'image_query', 'image_url', 'notes', 'best_time', 'google_event_id'];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), req.params.id];

  try {
    db.prepare(`UPDATE posts SET ${setClause} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /posts/:id
router.delete('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  try {
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
