const express = require('express');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all tags (user's own tags only)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const tags = db.prepare(`
      SELECT t.*, COUNT(bt.bookmark_id) as bookmark_count
      FROM tags t
      LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all(req.user.id);

    res.json(tags);
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create tag
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const result = db.prepare('INSERT INTO tags (name, color, user_id) VALUES (?, ?, ?)').run(
      name,
      color || '#6366f1',
      req.user.id
    );

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(tag);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Tag already exists' });
    }
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tag
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, color } = req.body;

    const existing = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Tag not found' });

    db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(
      name || existing.name,
      color || existing.color,
      req.params.id
    );

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    res.json(tag);
  } catch (err) {
    console.error('Update tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tag
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Tag not found' });

    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.json({ message: 'Tag deleted' });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
