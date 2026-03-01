import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n, LANGUAGES } from '../i18n';
import { Search, Plus, Menu, Moon, Sun, PanelLeftClose, PanelLeftOpen, Languages } from 'lucide-react';

export default function Header({ title, onMenuToggle, onSidebarCollapse, sidebarCollapsed, onAddBookmark }) {
  const { searchQuery, setSearchQuery, theme, toggleTheme } = useApp();
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="header">
      <button className="mobile-menu-btn" onClick={onMenuToggle}>
        <Menu size={20} />
      </button>

      <button className="sidebar-collapse-btn" onClick={onSidebarCollapse} title={sidebarCollapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}>
        {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <h2 className="header-title">{title}</h2>

      <div className="search-bar">
        <Search />
        <input
          type="text"
          placeholder={t('header.searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title={t('header.toggleTheme')}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <div className="language-select" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Languages size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={onAddBookmark}>
          <Plus size={16} />
          {t('header.addBookmark')}
        </button>
      </div>
    </header>
  );
}
