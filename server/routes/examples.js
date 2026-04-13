const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /examples — list all brand voice examples
router.get('/', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM brand_examples';
  const params = [];
  if (type) { sql += ' WHERE type = ?'; params.push(type); }
  sql += ' ORDER BY created_at DESC';
  try {
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /examples — add a brand voice example
router.post('/', (req, res) => {
  const { copy, type, url } = req.body;
  if (!copy?.trim()) return res.status(400).json({ error: 'copy is required' });
  try {
    const result = db.prepare('INSERT INTO brand_examples (type, copy, url) VALUES (?, ?, ?)').run(type || null, copy.trim(), url || null);
    res.status(201).json(db.prepare('SELECT * FROM brand_examples WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /examples/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM brand_examples WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
