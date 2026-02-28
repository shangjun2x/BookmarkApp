const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const authRoutes = require('./routes/auth');
const bookmarkRoutes = require('./routes/bookmarks');
const tagRoutes = require('./routes/tags');
const groupRoutes = require('./routes/groups');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({ origin: IS_PROD ? undefined : true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Initialize database on startup
getDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/groups', groupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files (production build)
const clientBuildPath = path.join(__dirname, '../client/build');
const fs = require('fs');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  console.log('  Serving frontend from client/build');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔖 Bookmark Manager running on http://localhost:${PORT}`);
  console.log(`   Database: ${path.join(__dirname, 'bookmarks.db')}\n`);
});
