import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n';
import * as api from '../api';
import toast from 'react-hot-toast';
import { X, Trash2 } from 'lucide-react';

export default function GroupModal({ group, onClose }) {
  const { fetchGroups, fetchBookmarks, groupFlat } = useApp();
  const { t } = useI18n();
  const isEditing = !!group;

  const [name, setName] = useState(group?.name || '');
  const [parentId, setParentId] = useState(group?.parent_id || '');
  const [loading, setLoading] = useState(false);

  // Filter out self and descendants to prevent circular refs
  const availableParents = groupFlat.filter(g => {
    if (!isEditing) return true;
    return g.id !== group.id;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('groupModal.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.groups.update(group.id, { name: name.trim(), parent_id: parentId || null });
        toast.success(t('groupModal.updated'));
      } else {
        await api.groups.create({ name: name.trim(), parent_id: parentId || null });
        toast.success(t('groupModal.created'));
      }
      fetchGroups();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('groupModal.confirmDelete', { name: group.name }))) return;
    try {
      await api.groups.delete(group.id);
      toast.success(t('groupModal.deleted'));
      fetchGroups();
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
          <h2>{isEditing ? t('groupModal.editGroup') : t('groupModal.newGroup')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">{t('groupModal.name')}</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('groupModal.namePlaceholder')}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('groupModal.parentGroup')}</label>
              <select
                className="form-select"
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">{t('groupModal.noParent')}</option>
                {availableParents.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            {isEditing && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                <Trash2 size={14} />
                {t('groupModal.delete')}
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('groupModal.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('groupModal.saving') : (isEditing ? t('groupModal.update') : t('groupModal.create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
