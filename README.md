# 🔖 Bookmark Manager

A self-hosted bookmark management tool built with **React** and **Node.js**, powered by a local **SQLite** database.

## Features

### Bookmark Management
- **Create, edit, and delete** bookmarks with title, URL, and description
- **Public / Private visibility** — share bookmarks publicly or keep them private
- **Per-bookmark background color** — customize individual card colors with automatic contrast text
- **Favicon fetching** — displays site favicons via Google's favicon service
- **Duplicate URL detection** — prevents saving the same URL with the same visibility

### Organization
- **Tags** — color-coded labels (16 preset colors) to categorize bookmarks; user-scoped
  - **Edit tags** — double-click a tag in the sidebar to modify its name and color
  - **Delete tags** — remove tags from the edit dialog (bookmarks are preserved)
- **Groups** — nested folder structure with unlimited depth for hierarchical organization
- **Per-user group assignment** — assign other users' public bookmarks into your own groups and tags

### Search & Filtering
- **Full-text search** across titles, URLs, and descriptions
- **Filter views**: All Bookmarks, My Bookmarks, Private, Public, by Group, or by Tag

### Multi-User
- **User accounts** with registration and JWT-based login
- **Guest access** — browse and add public bookmarks without registering
- **Creator attribution** — public bookmarks display the author's name
- **Shared public bookmarks** — all users see public bookmarks; non-owners can assign them to personal groups/tags

### Import & Export
- **Export** bookmarks as **JSON** or **HTML** (Netscape bookmark format, compatible with all browsers)
- **Import** bookmarks from **JSON** or **HTML** files (Firefox, Chrome, Servas, and other managers)

### Customization
- **Dark / Light theme** toggle with persistent preference
- **Default card background color** — set a global card color from the sidebar
- **Card width and height sliders** — adjust the bookmark grid card dimensions (persisted in browser)

### Internationalization (i18n)
- **7 languages supported**: English, 中文 (Chinese), 日本語 (Japanese), 한국어 (Korean), Español (Spanish), Deutsch (German), Français (French)
- **Language switcher** available in the header toolbar and sidebar footer
- Language preference persisted in browser across sessions
- Locale-aware date formatting

### UI
- **Responsive design** — works on desktop and mobile with collapsible sidebar
- **Toast notifications** for all actions
- **Loading spinners** and empty state placeholders

---

## Quick Start

### Prerequisites

- **Node.js** 18+ ([https://nodejs.org](https://nodejs.org))
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
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### First Run

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **"Create one"** to register a new account, or click **"Continue as Guest"** to browse public bookmarks
3. Start adding bookmarks!

---

## User Manual

### Authentication

| Action | How |
|--------|-----|
| Register | Click "Create one" on the login page. Provide a name, email, and password (min 6 characters). |
| Login | Enter your email and password on the login page. |
| Guest access | Click "Continue as Guest" to browse and add public bookmarks without an account. |
| Logout | Click the logout icon next to your name in the sidebar. |

### Managing Bookmarks

- **Add**: Click the **"+ Add Bookmark"** button in the header. Enter a URL (title can auto-fill), description, group, tags, visibility, and optional background color.
- **Edit**: Click the ✏️ pencil icon on any bookmark card. For other users' public bookmarks you can assign your own group and tags.
- **Delete**: Click the 🗑️ trash icon (only your own bookmarks or guest bookmarks).
- **Open**: Click the bookmark title or the ↗ external link icon.

### Groups

- **Create**: Click the **+** button next to "Groups" in the sidebar. Optionally select a parent group for nesting.
- **Edit**: Double-click a group in the sidebar.
- **Delete**: Open the edit dialog and click "Delete". Child groups are re-parented; bookmarks become ungrouped.
- **Navigate**: Click a group to filter bookmarks. Click the chevron to expand/collapse children.

### Tags

- **Create**: Click the **+** button next to "Tags" in the sidebar. Pick a name and color from 16 presets.
- **Edit**: Double-click a tag in the sidebar to modify its name and color.
- **Delete**: Open the tag edit dialog (double-click) and click "Delete". Bookmarks are preserved.
- **Filter**: Click a tag in the sidebar to show matching bookmarks.

### Search & Filters

- **Search**: Type in the search bar in the header. Results update live across title, URL, and description.
- **Filters** (sidebar):
  - **All Bookmarks** — your bookmarks + public bookmarks from all users
  - **My Bookmarks** — only your own bookmarks
  - **Private Bookmarks** — your non-public bookmarks
  - **Public Bookmarks** — all public bookmarks from every user

### Import & Export

1. Click **"Import / Export"** in the sidebar footer.
2. **Export**: Choose JSON or HTML format. The file downloads immediately.
3. **Import**: Click "Choose File" and select a `.json` or `.html` bookmark file. Duplicate URLs are skipped.

### Customization (Sidebar Footer)

| Setting | Description |
|---------|-------------|
| **Card Color** | Color picker to set a default background for all bookmark cards. Click ✕ to reset. |
| **Card Size — W** | Slider (200–600px) to control the minimum card width in the grid. |
| **Card Size — H** | Slider (0–600px) to set a fixed card height. 0 = auto height. |
| **Dark / Light Mode** | Toggle between dark and light themes. |
| **Language** | Switch between English, 中文, 日本語, 한국어, Español, Deutsch, and Français. Also available in the header toolbar. |

All customization settings are saved in your browser and persist across sessions.

---

## Project Structure

```
BookmarkApp/
├── server/                     # Node.js backend (Express)
│   ├── index.js                # Server entry — Express setup, CORS, static files
│   ├── db.js                   # SQLite database schema & initialization
│   ├── middleware/
│   │   └── auth.js             # JWT authentication & optional-auth middleware
│   └── routes/
│       ├── auth.js             # Register, login, guest login, profile
│       ├── bookmarks.js        # Bookmark CRUD, search, public listing, import/export
│       ├── tags.js             # Tag CRUD with bookmark counts
│       └── groups.js           # Group CRUD with nested tree & recursive counts
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── index.js            # React entry point
│       ├── index.css           # All styles — themes, layout, components
│       ├── App.js              # Router setup (login, register, dashboard)
│       ├── api.js              # API client — all HTTP calls to the backend
│       ├── i18n/               # Internationalization
│       │   ├── index.js        # I18nProvider context, useI18n hook, language list
│       │   ├── en.js           # English translations
│       │   ├── zh.js           # Chinese translations
│       │   ├── ja.js           # Japanese translations
│       │   ├── ko.js           # Korean translations
│       │   ├── es.js           # Spanish translations
│       │   ├── de.js           # German translations
│       │   └── fr.js           # French translations
│       ├── contexts/
│       │   ├── AppContext.js    # Central state — bookmarks, tags, groups, filters, theme, card settings
│       │   └── AuthContext.js   # (Unused — auth is in AppContext)
│       ├── components/
│       │   ├── Sidebar.js      # Navigation, groups tree, tags, card settings, language switcher, user profile
│       │   ├── Header.js       # Page title, search bar, language switcher, add bookmark button
│       │   ├── BookmarkList.js # Responsive bookmark grid with customizable card dimensions
│       │   ├── BookmarkModal.js# Create/edit bookmark dialog
│       │   ├── GroupModal.js   # Create/edit group dialog
│       │   ├── TagModal.js     # Create/edit tag dialog
│       │   └── ImportExportModal.js # Import/export dialog
│       └── pages/
│           ├── LoginPage.js    # Login form + guest access
│           ├── RegisterPage.js # Registration form
│           └── DashboardPage.js# Main layout — sidebar + header + bookmark grid
└── package.json                # Root — dev scripts & concurrently
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user (name, email, password) |
| POST | `/api/auth/login` | Login with email and password |
| POST | `/api/auth/guest` | Login as guest (anonymous, public-only access) |
| GET | `/api/auth/me` | Get current user profile |

### Bookmarks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | List bookmarks (supports `search`, `tag_id`, `group_id`, `include_public`, `private_only`, `page`, `limit`) |
| GET | `/api/bookmarks/public` | List all public bookmarks |
| GET | `/api/bookmarks/:id` | Get a single bookmark |
| POST | `/api/bookmarks` | Create a bookmark |
| PUT | `/api/bookmarks/:id` | Update a bookmark (non-owners can assign group & tags only) |
| DELETE | `/api/bookmarks/:id` | Delete a bookmark (owner or guest bookmarks) |
| GET | `/api/bookmarks/export/json` | Export bookmarks as JSON |
| GET | `/api/bookmarks/export/html` | Export bookmarks as HTML (Netscape format) |
| POST | `/api/bookmarks/import/json` | Import bookmarks from JSON or HTML |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List user's tags with bookmark counts |
| POST | `/api/tags` | Create a tag (name, color) |
| PUT | `/api/tags/:id` | Update a tag |
| DELETE | `/api/tags/:id` | Delete a tag |

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | List groups as nested tree with recursive bookmark counts |
| GET | `/api/groups/flat` | List groups as flat list |
| POST | `/api/groups` | Create a group (name, optional parent_id) |
| PUT | `/api/groups/:id` | Update a group |
| DELETE | `/api/groups/:id` | Delete a group (children re-parent, bookmarks unassigned) |

---

## Tech Stack

- **Frontend**: React 18, React Router v6, Lucide React Icons, React Hot Toast
- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken
- **Database**: SQLite with WAL mode (stored locally as `server/bookmarks.db`)
- **Dev tooling**: concurrently (parallel server + client startup)
