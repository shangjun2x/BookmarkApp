const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { generateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);

    const user = { id: result.lastInsertRowid, email, name };
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest login (anonymous) — reuse existing guest if token still valid
router.post('/guest', (req, res) => {
  try {
    const db = getDb();

    // Check if client sent an existing guest token to resume
    const authHeader = req.headers['authorization'];
    const existingToken = authHeader && authHeader.split(' ')[1];
    if (existingToken) {
      try {
        const decoded = jwt.verify(existingToken, JWT_SECRET);
        if (decoded.isGuest) {
          const existingUser = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(decoded.id);
          if (existingUser) {
            const user = { id: existingUser.id, email: existingUser.email, name: existingUser.name, isGuest: true };
            const token = generateToken(user);
            return res.json({ user, token });
          }
        }
      } catch (e) { /* token expired or invalid — create new guest */ }
    }

    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const guestEmail = guestId + '@guest.local';
    const guestName = 'Guest';
    const hashedPassword = bcrypt.hashSync(guestId, 10);

    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(guestName, guestEmail, hashedPassword);
    const user = { id: result.lastInsertRowid, email: guestEmail, name: guestName, isGuest: true };
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
