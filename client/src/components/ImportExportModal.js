import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import * as api from '../api';
import { exportBookmarks } from '../api';
import toast from 'react-hot-toast';
import { X, Download, Upload, FileJson, FileText } from 'lucide-react';

export default function ImportExportModal({ onClose }) {
  const { fetchBookmarks, fetchTags, fetchGroups } = useApp();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportJson = async () => {
    try {
      const blob = await exportBookmarks.json();
      downloadBlob(blob, 'bookmarks-export.json');
      toast.success('Exported as JSON');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    }
  };

  const handleExportHtml = async () => {
    try {
      const blob = await exportBookmarks.html();
      downloadBlob(blob, 'bookmarks-export.html');
      toast.success('Exported as HTML');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        let data = JSON.parse(text);
        // Handle both direct array and { bookmarks: [...] } format
        const bookmarks = Array.isArray(data) ? data : data.bookmarks;
        if (!Array.isArray(bookmarks)) throw new Error('Invalid JSON format');

        const result = await api.bookmarks.importJson(bookmarks);
        toast.success(result.message);
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        // Parse Netscape bookmark HTML format
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc.querySelectorAll('a');
        const bookmarks = Array.from(links).map(a => ({
          title: a.textContent || a.href,
          url: a.href,
          description: '',
        })).filter(b => b.url.startsWith('http'));

        if (bookmarks.length === 0) throw new Error('No valid bookmarks found in HTML file');

        const result = await api.bookmarks.importJson(bookmarks);
        toast.success(result.message);
      } else {
        throw new Error('Unsupported file format. Use .json or .html');
      }

      fetchBookmarks();
      fetchTags();
      fetchGroups();
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import / Export</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>
            <Download size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Export Bookmarks
          </h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            <button className="btn btn-secondary" onClick={handleExportJson}>
              <FileJson size={16} />
              Export as JSON
            </button>
            <button className="btn btn-secondary" onClick={handleExportHtml}>
              <FileText size={16} />
              Export as HTML
            </button>
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>
            <Upload size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Import Bookmarks
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Import bookmarks from a JSON or HTML (Netscape) file. Supported formats include exports from Servas, 
            Firefox, Chrome, and most other bookmark managers.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.html,.htm"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Choose File to Import'}
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
