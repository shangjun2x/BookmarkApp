import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { X, Globe, Lock } from 'lucide-react';

export default function BookmarkModal({ bookmark, onClose }) {
  const { fetchBookmarks, fetchTags, fetchGroups, isGuest, groupFlat, tagList, user } = useApp();
  const isEditing = !!bookmark;
  const isOwner = !bookmark || bookmark.user_id === user?.id;
  const isGuestBookmark = bookmark?.user_name === 'Guest';
  // Restricted mode: editing a non-guest bookmark you don't own (can only assign group & tag)
  const isRestricted = isEditing && !isOwner && !isGuestBookmark;
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [description, setDescription] = useState(bookmark?.description || '');
  const [groupId, setGroupId] = useState(
    (bookmark?.user_group_id !== undefined && bookmark?.user_group_id !== null)
      ? bookmark.user_group_id
      : (bookmark?.group_id || '')
  );
  const [selectedTags, setSelectedTags] = useState(bookmark?.tags?.map(t => t.id) || []);
  const [isPublic, setIsPublic] = useState((isGuest || isGuestBookmark) ? true : (bookmark?.is_public ? true : false));
  const [bgColor, setBgColor] = useState(bookmark?.bg_color || '');
  const [loading, setLoading] = useState(false);

  const presetColors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280',''];

  // Auto-fill title from URL
  useEffect(() => {
    if (!isEditing && url && !title) {
      try {
        const u = new URL(url);
        setTitle(u.hostname.replace('www.', ''));
      } catch {}
    }
  }, [url, title, isEditing]);

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.error('Title and URL are required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        group_id: groupId || null,
        tag_ids: selectedTags,
        is_public: isPublic,
        bg_color: bgColor || null,
      };

      if (isEditing) {
        const result = await api.bookmarks.update(bookmark.id, data);
        toast.success(isRestricted ? 'Group & tag assigned' : 'Bookmark updated');
      } else {
        await api.bookmarks.create(data);
        toast.success('Bookmark added');
      }

      fetchBookmarks();
      fetchTags();
      fetchGroups();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isRestricted ? 'Assign Group & Tag' : (isEditing ? 'Edit Bookmark' : 'Add Bookmark')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">URL *</label>
              <input
                type="url"
                className="form-input"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                autoFocus={!isEditing}
                disabled={isRestricted}
                style={isRestricted ? { opacity: 0.5 } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Bookmark title"
                required
                disabled={isRestricted}
                style={isRestricted ? { opacity: 0.5 } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                disabled={isRestricted}
                style={isRestricted ? { opacity: 0.5 } : {}}
              />
            </div>

            {(!isGuest || isRestricted) && (
              <div className="form-group">
                <label className="form-label">Group</label>
                <select
                  className="form-select"
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                >
                  <option value="">— No group —</option>
                  {groupFlat.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(!isGuest || isRestricted) && (
              <div className="form-group">
                <label className="form-label">Tags</label>
                {tagList.length > 0 ? (
                  <div className="tag-selector">
                    {tagList.map(tag => (
                      <span
                        key={tag.id}
                        className={`tag ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color + '30' : 'var(--bg-tertiary)',
                          color: selectedTags.includes(tag.id) ? tag.color : 'var(--text-tertiary)',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <span className="tag-dot" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                    No tags created yet. Add tags from the sidebar.
                  </p>
                )}
              </div>
            )}

            {!isRestricted && (
              <div className="form-group">
                <label className="form-label">Card Color</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {presetColors.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBgColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: bgColor === c ? '3px solid var(--primary)' : '2px solid var(--border)',
                        backgroundColor: c || 'var(--bg-card)',
                        cursor: 'pointer', padding: 0, position: 'relative',
                      }}
                      title={c || 'Default'}
                    >
                      {!c && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>×</span>}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={bgColor || '#ffffff'}
                    onChange={e => setBgColor(e.target.value)}
                    style={{ width: 28, height: 28, padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }}
                    title="Custom color"
                  />
                </div>
              </div>
            )}

            {!isRestricted && (
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <button
                  type="button"
                  className={`visibility-toggle ${isPublic ? 'public' : 'private'}`}
                  onClick={() => { if (!isGuest && !isGuestBookmark) setIsPublic(!isPublic); }}
                  disabled={isGuest || isGuestBookmark}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isPublic ? 'var(--primary)' : 'var(--border)'}`,
                    background: isPublic ? 'var(--primary-light)' : 'var(--bg-secondary)',
                    color: isPublic ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: (isGuest || isGuestBookmark) ? 'not-allowed' : 'pointer',
                    opacity: (isGuest || isGuestBookmark) ? 0.5 : 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                  {isPublic ? 'Public — visible to all users' : 'Private — only visible to you'}
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add Bookmark')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
