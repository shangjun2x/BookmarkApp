const express = require('express');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all groups (nested tree)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const groups = db.prepare(`
      SELECT g.*,
        (
          SELECT COUNT(*) FROM bookmarks b
          WHERE b.group_id = g.id AND b.user_id = ?
        ) + (
          SELECT COUNT(*) FROM user_bookmark_groups ubg
          JOIN bookmarks b2 ON ubg.bookmark_id = b2.id
          WHERE ubg.group_id = g.id AND ubg.user_id = ?
        ) + (
          SELECT COUNT(*) FROM bookmarks b3
          JOIN users u ON b3.user_id = u.id
          WHERE b3.group_id = g.id AND b3.user_id != ?
            AND u.email LIKE '%@guest.local'
            AND NOT EXISTS (SELECT 1 FROM user_bookmark_groups ubg2 WHERE ubg2.bookmark_id = b3.id AND ubg2.user_id = ?)
        ) as bookmark_count
      FROM groups_table g
      WHERE g.user_id = ?
      ORDER BY g.sort_order ASC, g.name ASC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    // Build tree with recursive counts
    const tree = buildTree(groups);
    addRecursiveCounts(tree);
    res.json(tree);
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get flat groups list
router.get('/flat', (req, res) => {
  try {
    const db = getDb();
    const groups = db.prepare(`
      SELECT g.*,
        (
          SELECT COUNT(*) FROM bookmarks b
          WHERE b.group_id = g.id AND b.user_id = ?
        ) + (
          SELECT COUNT(*) FROM user_bookmark_groups ubg
          JOIN bookmarks b2 ON ubg.bookmark_id = b2.id
          WHERE ubg.group_id = g.id AND ubg.user_id = ?
        ) + (
          SELECT COUNT(*) FROM bookmarks b3
          JOIN users u ON b3.user_id = u.id
          WHERE b3.group_id = g.id AND b3.user_id != ?
            AND u.email LIKE '%@guest.local'
            AND NOT EXISTS (SELECT 1 FROM user_bookmark_groups ubg2 WHERE ubg2.bookmark_id = b3.id AND ubg2.user_id = ?)
        ) as bookmark_count
      FROM groups_table g
      WHERE g.user_id = ?
      ORDER BY g.sort_order ASC, g.name ASC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    res.json(groups);
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create group
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Verify parent exists and belongs to user
    if (parent_id) {
      const parent = db.prepare('SELECT id FROM groups_table WHERE id = ? AND user_id = ?').get(parent_id, req.user.id);
      if (!parent) return res.status(400).json({ error: 'Parent group not found' });
    }

    const result = db.prepare('INSERT INTO groups_table (name, parent_id, user_id) VALUES (?, ?, ?)').run(
      name,
      parent_id || null,
      req.user.id
    );

    const group = db.prepare('SELECT * FROM groups_table WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(group);
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update group
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, parent_id } = req.body;

    const existing = db.prepare('SELECT * FROM groups_table WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Group not found' });

    // Prevent circular reference
    if (parent_id && parent_id == req.params.id) {
      return res.status(400).json({ error: 'A group cannot be its own parent' });
    }

    db.prepare('UPDATE groups_table SET name = ?, parent_id = ? WHERE id = ?').run(
      name || existing.name,
      parent_id !== undefined ? parent_id : existing.parent_id,
      req.params.id
    );

    const group = db.prepare('SELECT * FROM groups_table WHERE id = ?').get(req.params.id);
    res.json(group);
  } catch (err) {
    console.error('Update group error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete group
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM groups_table WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Group not found' });

    // Move bookmarks to unsorted
    db.prepare('UPDATE bookmarks SET group_id = NULL WHERE group_id = ?').run(req.params.id);
    // Move child groups to parent
    db.prepare('UPDATE groups_table SET parent_id = ? WHERE parent_id = ?').run(existing.parent_id, req.params.id);

    db.prepare('DELETE FROM groups_table WHERE id = ?').run(req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function buildTree(groups) {
  const map = {};
  const roots = [];

  groups.forEach(g => {
    map[g.id] = { ...g, children: [] };
  });

  groups.forEach(g => {
    if (g.parent_id && map[g.parent_id]) {
      map[g.parent_id].children.push(map[g.id]);
    } else {
      roots.push(map[g.id]);
    }
  });

  return roots;
}

// Roll up bookmark_count from children into parents
function addRecursiveCounts(nodes) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      addRecursiveCounts(node.children);
      const childTotal = node.children.reduce((sum, c) => sum + c.bookmark_count, 0);
      node.bookmark_count += childTotal;
    }
  }
}

module.exports = router;
