import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n';
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
  const { t } = useI18n();
  const isEditing = !!tag;

  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || '#6366f1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('tagModal.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.tags.update(tag.id, { name: name.trim(), color });
        toast.success(t('tagModal.updated'));
      } else {
        await api.tags.create({ name: name.trim(), color });
        toast.success(t('tagModal.created'));
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
    if (!window.confirm(t('tagModal.confirmDelete', { name: tag.name }))) return;
    try {
      await api.tags.delete(tag.id);
      toast.success(t('tagModal.deleted'));
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
          <h2>{isEditing ? t('tagModal.editTag') : t('tagModal.newTag')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">{t('tagModal.name')}</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('tagModal.namePlaceholder')}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('tagModal.color')}</label>
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
                {name || t('tagModal.preview')}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            {isEditing && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                <Trash2 size={14} />
                {t('tagModal.delete')}
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('tagModal.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('tagModal.saving') : (isEditing ? t('tagModal.update') : t('tagModal.create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
