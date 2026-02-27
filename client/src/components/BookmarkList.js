import React from 'react';
import { useApp } from '../contexts/AppContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { ExternalLink, Edit2, Trash2, Bookmark, Globe, Lock, FolderOpen } from 'lucide-react';

function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return null;
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Compute contrasting foreground color from a hex background
function getContrastColor(hex) {
  if (!hex) return null;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Using luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

function BookmarkCard({ bookmark, onEdit, onHoverUrl }) {
  const { fetchBookmarks, fetchTags, fetchGroups, user, activeFilter, groupFlat, defaultCardBg } = useApp();
  const isOwnBookmark = !bookmark.user_name || bookmark.user_id === user?.id;
  const isGuestBookmark = bookmark.user_name === 'Guest';
  const canEdit = isOwnBookmark || isGuestBookmark || bookmark.is_public === 1;
  const isPublicView = activeFilter.type === 'public';
  const bgColor = bookmark.bg_color || defaultCardBg || null;
  const fgColor = getContrastColor(bgColor);
  const effectiveGroupId = bookmark.user_group_id != null ? bookmark.user_group_id : bookmark.group_id;
  const groupName = effectiveGroupId ? groupFlat.find(g => g.id === effectiveGroupId)?.name : null;

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${bookmark.title}"?`)) return;
    try {
      await api.bookmarks.delete(bookmark.id);
      toast.success('Bookmark deleted');
      fetchBookmarks();
      fetchTags();
      fetchGroups();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const faviconUrl = getFaviconUrl(bookmark.url);

  const cardStyle = bgColor ? { backgroundColor: bgColor, color: fgColor, borderColor: bgColor } : {};

  return (
    <div
      className="bookmark-card"
      style={cardStyle}
      onMouseEnter={() => onHoverUrl && onHoverUrl(bookmark.url)}
      onMouseLeave={() => onHoverUrl && onHoverUrl('')}
    >
      <div className="bookmark-card-header">
        <div className="bookmark-favicon">
          {faviconUrl ? (
            <img src={faviconUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <Globe size={18} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
        <div className="bookmark-info">
          <div className="bookmark-title">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" style={fgColor ? { color: fgColor } : {}}>
              {bookmark.title}
            </a>
          </div>
        </div>
        {bookmark.is_public ? (
          <span title="Public" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Globe size={14} />
          </span>
        ) : (
          <span title="Private" style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Lock size={14} />
          </span>
        )}
      </div>

      {bookmark.description && (
        <div className="bookmark-description">{bookmark.description}</div>
      )}

      {groupName && (
        <div style={{ fontSize: '0.75rem', color: fgColor ? fgColor + 'bb' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <FolderOpen size={12} />
          {groupName}
        </div>
      )}

      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="bookmark-tags">
          {bookmark.tags.map(tag => (
            <span key={tag.id} className="tag" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
              <span className="tag-dot" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="bookmark-date" style={fgColor ? { color: fgColor + 'aa' } : {}}>{formatDate(bookmark.created_at)}</span>
          {bookmark.user_name && !isOwnBookmark && (
            <span style={{ fontSize: '0.75rem', color: fgColor ? fgColor + '99' : 'var(--text-tertiary)', fontStyle: 'italic' }}>
              by {bookmark.user_name}
            </span>
          )}
        </div>
        <div className="bookmark-card-actions">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon" title="Open link" style={fgColor ? { color: fgColor } : {}}>
            <ExternalLink size={14} />
          </a>
          {canEdit && (
            <>
              <button className="btn btn-ghost btn-icon" onClick={() => onEdit(bookmark)} title={isOwnBookmark || isGuestBookmark ? 'Edit' : 'Assign group & tag'} style={fgColor ? { color: fgColor } : {}}>
                <Edit2 size={14} />
              </button>
              {(isOwnBookmark || isGuestBookmark) && (
                <button className="btn btn-ghost btn-icon" onClick={handleDelete} title="Delete" style={{ color: fgColor || 'var(--danger)' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookmarkList({ onEdit, onAddBookmark, onHoverUrl }) {
  const { bookmarkList, loading, totalBookmarks } = useApp();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (bookmarkList.length === 0) {
    return (
      <div className="empty-state">
        <Bookmark size={64} />
        <h3>No bookmarks found</h3>
        <p>Add your first bookmark to get started organizing your links.</p>
        <button className="btn btn-primary" onClick={onAddBookmark}>
          Add Bookmark
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {totalBookmarks} bookmark{totalBookmarks !== 1 ? 's' : ''}
      </div>
      <div className="bookmark-grid">
        {bookmarkList.map(b => (
          <BookmarkCard key={b.id} bookmark={b} onEdit={onEdit} onHoverUrl={onHoverUrl} />
        ))}
      </div>
    </>
  );
}
