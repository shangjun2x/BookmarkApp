const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public bookmarks endpoint (optional auth for user-scoped tag filtering)
router.get('/public', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const maxCardCount = db.prepare("SELECT value FROM settings WHERE key = 'max_card_count'").get()?.value || '100000';
    const { search, page = 1, limit = maxCardCount } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, u.name as user_name FROM bookmarks b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      WHERE b.is_public = 1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(DISTINCT b.id) as total FROM');
    const { total } = db.prepare(countQuery).get(...params);

    query = `SELECT DISTINCT b.*, u.name as user_name FROM bookmarks b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      WHERE b.is_public = 1`;
    if (search) {
      query += ` AND (b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ?)`;
    }
    query += ` ORDER BY b.title COLLATE NOCASE ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const bookmarks = db.prepare(query).all(...params);

    // Only show tags owned by current user (if authenticated), otherwise no tags
    let result;
    if (req.user) {
      const tagStmt = db.prepare(`
        SELECT t.* FROM tags t
        JOIN bookmark_tags bt ON t.id = bt.tag_id
        WHERE bt.bookmark_id = ? AND t.user_id = ?
      `);
      result = bookmarks.map(b => ({
        ...b,
        tags: tagStmt.all(b.id, req.user.id),
      }));
    } else {
      result = bookmarks.map(b => ({ ...b, tags: [] }));
    }

    res.json({ bookmarks: result, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Get public bookmarks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use(authenticateToken);

// Get all bookmarks (with optional filters)
// include_public=1 => user's own bookmarks + public bookmarks from other users
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const maxCardCount = db.prepare("SELECT value FROM settings WHERE key = 'max_card_count'").get()?.value || '100000';
    const { search, tag_id, group_id, include_public, private_only, page = 1, limit = maxCardCount } = req.query;
    const offset = (page - 1) * limit;
    const showPublic = (include_public === '1' || include_public === 'true');
    const showPrivateOnly = (private_only === '1' || private_only === 'true');

    const params = [];
    let whereClause;

    if (showPrivateOnly) {
      // Only user's own private (non-public) bookmarks
      whereClause = `b.user_id = ? AND b.is_public = 0`;
      params.push(req.user.id);
    } else if (showPublic) {
      // User's own bookmarks + public bookmarks from all other users
      whereClause = `(b.user_id = ? OR b.is_public = 1)`;
      params.push(req.user.id);
    } else {
      whereClause = `b.user_id = ?`;
      params.push(req.user.id);
    }

    if (search) {
      whereClause += ` AND (b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (tag_id) {
      whereClause += ` AND bt.tag_id = ?`;
      params.push(tag_id);
    }

    // Join per-user group overrides
    const ubgJoin = 'LEFT JOIN user_bookmark_groups ubg ON b.id = ubg.bookmark_id AND ubg.user_id = ' + Number(req.user.id);

    if (group_id) {
      // Collect this group + all descendant group IDs recursively
      const allGroupIds = [Number(group_id)];
      const childStmt = db.prepare('SELECT id FROM groups_table WHERE parent_id = ?');
      const queue = [Number(group_id)];
      while (queue.length > 0) {
        const parentId = queue.shift();
        const children = childStmt.all(parentId);
        for (const child of children) {
          allGroupIds.push(child.id);
          queue.push(child.id);
        }
      }
      const groupList = allGroupIds.join(',');
      // Match own bookmarks by b.group_id OR others' bookmarks by per-user override (fallback to b.group_id for guest bookmarks)
      whereClause += ` AND (CASE WHEN b.user_id = ${Number(req.user.id)} THEN b.group_id ELSE COALESCE(ubg.group_id, b.group_id) END IN (${groupList}))`;
    }

    // Count total
    const countQuery = `SELECT COUNT(DISTINCT b.id) as total FROM bookmarks b
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      ${ubgJoin}
      WHERE ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // Fetch bookmarks — always join user so we can show user_name
    const selectFields = 'b.*, u.name as user_name, ubg.group_id as user_group_id';
    const joinUser = 'JOIN users u ON b.user_id = u.id';
    const fetchQuery = `SELECT DISTINCT ${selectFields} FROM bookmarks b
      ${joinUser}
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      ${ubgJoin}
      WHERE ${whereClause}
      ORDER BY b.title COLLATE NOCASE ASC LIMIT ? OFFSET ?`;
    const bookmarks = db.prepare(fetchQuery).all(...params, Number(limit), Number(offset));

    // Attach tags to each bookmark (only tags owned by current user)
    const tagStmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE bt.bookmark_id = ? AND t.user_id = ?
    `);

    const result = bookmarks.map(b => ({
      ...b,
      tags: tagStmt.all(b.id, req.user.id),
    }));

    res.json({ bookmarks: result, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single bookmark
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!bookmark) return res.status(404).json({ error: 'Bookmark not found' });

    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE bt.bookmark_id = ?
    `).all(bookmark.id);

    res.json({ ...bookmark, tags });
  } catch (err) {
    console.error('Get bookmark error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create bookmark
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { title, url, description, group_id, tag_ids, is_public, bg_color } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    // Guest users can only create public bookmarks
    const publicFlag = req.user.isGuest ? 1 : (is_public ? 1 : 0);

    // Check for duplicate URL + visibility (globally unique)
    const duplicate = db.prepare(
      'SELECT id FROM bookmarks WHERE url = ? AND is_public = ?'
    ).get(url, publicFlag);
    if (duplicate) {
      return res.status(409).json({ error: `A bookmark with this URL already exists with the same visibility` });
    }

    const result = db.prepare(
      'INSERT INTO bookmarks (title, url, description, is_public, bg_color, group_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(title, url, description || '', publicFlag, bg_color || null, group_id || null, req.user.id);

    const bookmarkId = result.lastInsertRowid;

    // Attach tags
    if (tag_ids && tag_ids.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');
      for (const tagId of tag_ids) {
        insertTag.run(bookmarkId, tagId);
      }
    }

    const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(bookmarkId);
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE bt.bookmark_id = ? AND t.user_id = ?
    `).all(bookmarkId, req.user.id);

    res.status(201).json({ ...bookmark, tags });
  } catch (err) {
    console.error('Create bookmark error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bookmark (own bookmarks + guest bookmarks)
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { title, url, description, group_id, tag_ids, is_public, bg_color } = req.body;

    // Allow editing own bookmarks OR guest bookmarks
    let existing = db.prepare('SELECT b.*, u.email as owner_email FROM bookmarks b JOIN users u ON b.user_id = u.id WHERE b.id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Bookmark not found' });
    const isOwner = existing.user_id === req.user.id;
    const isGuestBookmark = existing.owner_email && existing.owner_email.endsWith('@guest.local');

    // If not owner and not guest bookmark: only allow group and tag assignment (per-user)
    if (!isOwner && !isGuestBookmark) {
      if (existing.is_public !== 1) return res.status(403).json({ error: 'Not authorized' });

      // Store per-user group assignment in user_bookmark_groups
      if (group_id !== undefined) {
        const gid = group_id || null;
        db.prepare(
          `INSERT INTO user_bookmark_groups (user_id, bookmark_id, group_id) VALUES (?, ?, ?)
           ON CONFLICT(user_id, bookmark_id) DO UPDATE SET group_id = excluded.group_id`
        ).run(req.user.id, req.params.id, gid);
      }

      // Update tags — only touch current user's tags on this bookmark
      if (tag_ids !== undefined) {
        db.prepare(
          `DELETE FROM bookmark_tags WHERE bookmark_id = ? AND tag_id IN (SELECT id FROM tags WHERE user_id = ?)`
        ).run(req.params.id, req.user.id);
        if (tag_ids.length > 0) {
          const insertTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');
          for (const tagId of tag_ids) {
            insertTag.run(req.params.id, tagId);
          }
        }
      }

      const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id);
      const userGroup = db.prepare('SELECT group_id FROM user_bookmark_groups WHERE user_id = ? AND bookmark_id = ?').get(req.user.id, req.params.id);
      const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN bookmark_tags bt ON t.id = bt.tag_id
        WHERE bt.bookmark_id = ? AND t.user_id = ?
      `).all(req.params.id, req.user.id);

      return res.json({ ...bookmark, tags, user_group_id: userGroup ? userGroup.group_id : null });
    }

    // Guest bookmarks must stay public
    const resolvedPublic = isGuestBookmark ? 1 : (is_public !== undefined ? (is_public ? 1 : 0) : existing.is_public);

    db.prepare(
      'UPDATE bookmarks SET title = ?, url = ?, description = ?, is_public = ?, bg_color = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      title || existing.title,
      url || existing.url,
      description !== undefined ? description : existing.description,
      resolvedPublic,
      bg_color !== undefined ? (bg_color || null) : existing.bg_color,
      group_id !== undefined ? group_id : existing.group_id,
      req.params.id
    );

    // Update tags
    if (tag_ids !== undefined) {
      db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(req.params.id);
      if (tag_ids.length > 0) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');
        for (const tagId of tag_ids) {
          insertTag.run(req.params.id, tagId);
        }
      }
    }

    const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id);
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE bt.bookmark_id = ? AND t.user_id = ?
    `).all(req.params.id, req.user.id);

    res.json({ ...bookmark, tags });
  } catch (err) {
    console.error('Update bookmark error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete bookmark (own bookmarks + guest bookmarks)
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    let existing = db.prepare('SELECT b.*, u.email as owner_email FROM bookmarks b JOIN users u ON b.user_id = u.id WHERE b.id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Bookmark not found' });
    const isOwner = existing.user_id === req.user.id;
    const isGuestBookmark = existing.owner_email && existing.owner_email.endsWith('@guest.local');
    if (!isOwner && !isGuestBookmark) return res.status(403).json({ error: 'Not authorized' });

    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bookmark deleted' });
  } catch (err) {
    console.error('Delete bookmark error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export bookmarks as JSON
router.get('/export/json', (req, res) => {
  try {
    const db = getDb();
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

    const tagStmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE bt.bookmark_id = ?
    `);

    const result = bookmarks.map(b => ({
      ...b,
      tags: tagStmt.all(b.id),
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=bookmarks-export.json');
    res.json(result);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export bookmarks as HTML
router.get('/export/html', (req, res) => {
  try {
    const db = getDb();
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

    for (const b of bookmarks) {
      const ts = Math.floor(new Date(b.created_at).getTime() / 1000);
      html += `  <DT><A HREF="${b.url}" ADD_DATE="${ts}">${b.title}</A>\n`;
      if (b.description) {
        html += `  <DD>${b.description}\n`;
      }
    }

    html += `</DL><p>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=bookmarks-export.html');
    res.send(html);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import bookmarks from JSON
router.post('/import/json', (req, res) => {
  try {
    const db = getDb();
    const { bookmarks } = req.body;

    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ error: 'Expected an array of bookmarks' });
    }

    let imported = 0;
    let failed = 0;
    const publicFlag = req.user.isGuest ? 1 : 0;
    const insertBookmark = db.prepare(
      'INSERT INTO bookmarks (title, url, description, is_public, user_id) VALUES (?, ?, ?, ?, ?)'
    );

    for (const b of bookmarks) {
      if (b.title && b.url) {
        try {
          insertBookmark.run(b.title, b.url, b.description || '', publicFlag, req.user.id);
          imported++;
        } catch (itemErr) {
          failed++;
        }
      } else {
        failed++;
      }
    }

    res.json({ message: `Imported ${imported} bookmarks` + (failed > 0 ? ` (${failed} failed)` : '') });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
