# 🔖 Bookmark Manager

A self-hosted bookmark management tool, built with **React** and **Node.js**.

## Features

- **Tags** — Organize your bookmarks with colorful tags
- **Groups** — Group your bookmarks in a nested folder structure
- **Search** — Full-text search across titles, URLs, and descriptions
- **Import/Export** — Support for JSON and HTML (Netscape) bookmark formats
- **Multiple users** — Create multiple user accounts
- **Dark/Light theme** — Toggle between themes
- **Responsive design** — Works on desktop and mobile
- **Local SQLite database** — No external database needed

## Quick Start

### Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **npm** (comes with Node.js)

### Install & Run

```bash
# Install root dependencies
npm install

# Install all dependencies (server + client)
npm run install:all

# Start both server and client
npm start
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### First Run

1. Open http://localhost:3000
2. Click "Create one" to register a new account
3. Start adding bookmarks!

## Project Structure

```
BookMarkApp/
├── server/                 # Node.js backend
│   ├── index.js           # Express server entry
│   ├── db.js              # SQLite database setup
│   ├── middleware/
│   │   └── auth.js        # JWT authentication
│   └── routes/
│       ├── auth.js        # Login/Register endpoints
│       ├── bookmarks.js   # Bookmark CRUD + import/export
│       ├── tags.js        # Tag CRUD
│       └── groups.js      # Group CRUD (nested tree)
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── App.js         # Router setup
│       ├── api.js         # API client
│       ├── contexts/      # React context (state management)
│       ├── components/    # UI components
│       └── pages/         # Page components
└── package.json           # Root package with dev scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/bookmarks | List bookmarks (with search/filter) |
| POST | /api/bookmarks | Create bookmark |
| PUT | /api/bookmarks/:id | Update bookmark |
| DELETE | /api/bookmarks/:id | Delete bookmark |
| GET | /api/bookmarks/export/json | Export as JSON |
| GET | /api/bookmarks/export/html | Export as HTML |
| POST | /api/bookmarks/import/json | Import bookmarks |
| GET | /api/tags | List tags |
| POST | /api/tags | Create tag |
| PUT | /api/tags/:id | Update tag |
| DELETE | /api/tags/:id | Delete tag |
| GET | /api/groups | List groups (tree) |
| GET | /api/groups/flat | List groups (flat) |
| POST | /api/groups | Create group |
| PUT | /api/groups/:id | Update group |
| DELETE | /api/groups/:id | Delete group |

## Tech Stack

- **Frontend**: React, React Router, Lucide Icons, React Hot Toast
- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken
- **Database**: SQLite (stored locally as `server/bookmarks.db`)
