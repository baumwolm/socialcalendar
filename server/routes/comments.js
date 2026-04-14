const express = require('express');
const db = require('../db');
const router = express.Router({ mergeParams: true });

// GET /posts/:postId/comments
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
    ).all(req.params.postId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /posts/:postId/comments
router.post('/', (req, res) => {
  const { author, text } = req.body;
  if (!author?.trim() || !text?.trim()) {
    return res.status(400).json({ error: 'author and text are required' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO comments (post_id, author, text) VALUES (?, ?, ?)'
    ).run(req.params.postId, author.trim(), text.trim());
    res.status(201).json(
      db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /posts/:postId/comments/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE id = ? AND post_id = ?').run(
      req.params.id, req.params.postId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
