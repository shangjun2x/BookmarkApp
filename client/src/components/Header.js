import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Plus, Menu, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Header({ title, onMenuToggle, onSidebarCollapse, sidebarCollapsed, onAddBookmark }) {
  const { searchQuery, setSearchQuery, theme, toggleTheme } = useApp();

  return (
    <header className="header">
      <button className="mobile-menu-btn" onClick={onMenuToggle}>
        <Menu size={20} />
      </button>

      <button className="sidebar-collapse-btn" onClick={onSidebarCollapse} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <h2 className="header-title">{title}</h2>

      <div className="search-bar">
        <Search />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="btn btn-primary" onClick={onAddBookmark}>
          <Plus size={16} />
          Add Bookmark
        </button>
      </div>
    </header>
  );
}
