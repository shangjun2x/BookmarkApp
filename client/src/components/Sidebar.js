import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n, LANGUAGES } from '../i18n';
import {
  Bookmark, FolderOpen, Tag, ChevronRight, ChevronDown, Plus,
  LogOut, Download, Moon, Sun, Home, Globe, Lock, User, Palette, Maximize2, Languages
} from 'lucide-react';

function GroupTreeItem({ group, activeFilter, setActiveFilter, onEdit, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = group.children && group.children.length > 0;
  const isActive = activeFilter.type === 'group' && activeFilter.id === group.id;

  return (
    <div>
      <button
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => setActiveFilter({ type: 'group', id: group.id, name: group.name })}
        onDoubleClick={() => onEdit(group)}
      >
        {hasChildren ? (
          <span onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ cursor: 'pointer', display: 'flex' }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 14 }} />
        )}
        <FolderOpen size={16} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</span>
        <span className="count">{group.bookmark_count}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {group.children.map(child => (
            <GroupTreeItem
              key={child.id}
              group={child}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onEdit={onEdit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose, onAddGroup, onEditGroup, onAddTag, onEditTag, onImportExport }) {
  const { user, logout, activeFilter, setActiveFilter, groupTree, tagList, totalBookmarks, isGuest, theme, toggleTheme, defaultCardBg, setDefaultCardBg, cardWidth, setCardWidth, cardHeight, setCardHeight } = useApp();
  const { t, language, setLanguage } = useI18n();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span>🔖</span>
        <h1>{t('sidebar.bookmarks')}</h1>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        {!isGuest && (
          <button
            className={`sidebar-item ${activeFilter.type === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter({ type: 'all' })}
          >
            <Home size={16} />
            <span>{t('sidebar.allBookmarks')}</span>
            {activeFilter.type === 'all' && <span className="count">{totalBookmarks}</span>}
          </button>
        )}
        {!isGuest && (
          <button
            className={`sidebar-item ${activeFilter.type === 'mine' ? 'active' : ''}`}
            onClick={() => setActiveFilter({ type: 'mine' })}
          >
            <User size={16} />
            <span>{t('sidebar.myBookmarks')}</span>
            {activeFilter.type === 'mine' && <span className="count">{totalBookmarks}</span>}
          </button>
        )}
        {!isGuest && (
          <button
            className={`sidebar-item ${activeFilter.type === 'private' ? 'active' : ''}`}
            onClick={() => setActiveFilter({ type: 'private' })}
          >
            <Lock size={16} />
            <span>{t('sidebar.privateBookmarks')}</span>
            {activeFilter.type === 'private' && <span className="count">{totalBookmarks}</span>}
          </button>
        )}
        <button
          className={`sidebar-item ${activeFilter.type === 'public' ? 'active' : ''}`}
          onClick={() => setActiveFilter({ type: 'public' })}
        >
          <Globe size={16} />
          <span>{t('sidebar.publicBookmarks')}</span>
          {activeFilter.type === 'public' && <span className="count">{totalBookmarks}</span>}
        </button>
      </div>

      {/* Groups — hidden for guests */}
      {!isGuest && (
      <div className="sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }}>
          <span className="sidebar-section-title">{t('sidebar.groups')}</span>
          <button className="btn-ghost" onClick={onAddGroup} style={{ padding: 2, background: 'none', border: 'none', color: 'var(--text-sidebar-heading)', cursor: 'pointer' }}>
            <Plus size={14} />
          </button>
        </div>
        {groupTree.map(group => (
          <GroupTreeItem
            key={group.id}
            group={group}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            onEdit={onEditGroup}
          />
        ))}
      </div>
      )}

      {/* Tags — hidden for guests */}
      {!isGuest && (
      <div className="sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }}>
          <span className="sidebar-section-title">{t('sidebar.tags')}</span>
          <button className="btn-ghost" onClick={onAddTag} style={{ padding: 2, background: 'none', border: 'none', color: 'var(--text-sidebar-heading)', cursor: 'pointer' }}>
            <Plus size={14} />
          </button>
        </div>
        {tagList.map(tag => (
          <button
            key={tag.id}
            className={`sidebar-item ${activeFilter.type === 'tag' && activeFilter.id === tag.id ? 'active' : ''}`}
            onClick={() => setActiveFilter({ type: 'tag', id: tag.id, name: tag.name })}
            onDoubleClick={() => onEditTag(tag)}
          >
            <span className="tag-dot" style={{ backgroundColor: tag.color }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.name}</span>
            <span className="count">{tag.bookmark_count}</span>
          </button>
        ))}
        {tagList.length === 0 && (
          <div style={{ padding: '4px 12px', fontSize: '0.8rem', color: 'var(--text-sidebar-heading)' }}>
            {t('sidebar.noTags')}
          </div>
        )}
      </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-item" style={{ cursor: 'default' }}>
          <Palette size={16} />
          <span style={{ flex: 1 }}>{t('sidebar.cardColor')}</span>
          <input
            type="color"
            value={defaultCardBg || '#ffffff'}
            onChange={(e) => setDefaultCardBg(e.target.value)}
            style={{ width: 28, height: 22, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
            title="Default card background color"
          />
          {defaultCardBg && (
            <button
              onClick={() => setDefaultCardBg('')}
              style={{ padding: '0 4px', background: 'none', border: 'none', color: 'var(--text-sidebar-heading)', cursor: 'pointer', fontSize: '0.75rem' }}
              title={t('sidebar.resetDefault')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="sidebar-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Maximize2 size={16} />
            <span>{t('sidebar.cardSize')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
            <label style={{ minWidth: 36 }}>{t('sidebar.cardSizeWidth')}</label>
            <input
              type="range"
              min={200}
              max={600}
              step={10}
              value={cardWidth}
              onChange={(e) => setCardWidth(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 32, textAlign: 'right' }}>{cardWidth}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
            <label style={{ minWidth: 36 }}>{t('sidebar.cardSizeHeight')}</label>
            <input
              type="range"
              min={0}
              max={600}
              step={10}
              value={cardHeight}
              onChange={(e) => setCardHeight(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 32, textAlign: 'right' }}>{cardHeight || t('sidebar.auto')}</span>
          </div>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--sidebar-border)', margin: '4px 0' }} />
        <button className="sidebar-item" onClick={onImportExport}>
          <Download size={16} />
          <span>{t('sidebar.importExport')}</span>
        </button>
        <button className="sidebar-item" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}</span>
        </button>
        <div className="sidebar-item" style={{ cursor: 'default' }}>
          <Languages size={16} />
          <span style={{ flex: 1 }}>{t('sidebar.language')}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid var(--sidebar-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
            <button className="btn-ghost" onClick={logout} style={{ padding: 4, background: 'none', border: 'none', color: 'var(--text-sidebar-heading)', cursor: 'pointer' }}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
