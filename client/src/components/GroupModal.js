import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { X, Trash2 } from 'lucide-react';

export default function GroupModal({ group, onClose }) {
  const { fetchGroups, fetchBookmarks, groupFlat } = useApp();
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
      toast.error('Group name is required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.groups.update(group.id, { name: name.trim(), parent_id: parentId || null });
        toast.success('Group updated');
      } else {
        await api.groups.create({ name: name.trim(), parent_id: parentId || null });
        toast.success('Group created');
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
    if (!window.confirm(`Delete group "${group.name}"? Bookmarks will be moved to unsorted.`)) return;
    try {
      await api.groups.delete(group.id);
      toast.success('Group deleted');
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
          <h2>{isEditing ? 'Edit Group' : 'New Group'}</h2>
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
                placeholder="Group name"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parent Group</label>
              <select
                className="form-select"
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">— None (top level) —</option>
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
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create Group')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
