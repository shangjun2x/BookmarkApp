import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { X, Trash2 } from 'lucide-react';

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
];

export default function TagModal({ tag, onClose }) {
  const { fetchTags, fetchBookmarks } = useApp();
  const isEditing = !!tag;

  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || '#6366f1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.tags.update(tag.id, { name: name.trim(), color });
        toast.success('Tag updated');
      } else {
        await api.tags.create({ name: name.trim(), color });
        toast.success('Tag created');
      }
      fetchTags();
      fetchBookmarks();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete tag "${tag.name}"? This won't delete bookmarks.`)) return;
    try {
      await api.tags.delete(tag.id);
      toast.success('Tag deleted');
      fetchTags();
      fetchBookmarks();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Tag' : 'New Tag'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tag name"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-options">
                {TAG_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-option ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <span className="tag" style={{ backgroundColor: color + '30', color: color, fontSize: '0.85rem', padding: '4px 12px' }}>
                <span className="tag-dot" style={{ backgroundColor: color }} />
                {name || 'Preview'}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            {isEditing && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                <Trash2 size={14} />
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create Tag')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
