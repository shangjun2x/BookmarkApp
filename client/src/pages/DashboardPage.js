import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BookmarkList from '../components/BookmarkList';
import BookmarkModal from '../components/BookmarkModal';
import TagModal from '../components/TagModal';
import GroupModal from '../components/GroupModal';
import ImportExportModal from '../components/ImportExportModal';

export default function DashboardPage() {
  const { activeFilter } = useApp();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookmarkModal, setBookmarkModal] = useState({ open: false, bookmark: null });
  const [tagModal, setTagModal] = useState({ open: false, tag: null });
  const [groupModal, setGroupModal] = useState({ open: false, group: null });
  const [importExportModal, setImportExportModal] = useState(false);

  const getTitle = () => {
    if (activeFilter.type === 'all') return t('dashboard.allBookmarks');
    if (activeFilter.type === 'mine') return t('sidebar.myBookmarks');
    if (activeFilter.type === 'private') return t('sidebar.privateBookmarks');
    if (activeFilter.type === 'public') return t('sidebar.publicBookmarks');
    if (activeFilter.type === 'group') return activeFilter.name || t('dashboard.group');
    if (activeFilter.type === 'tag') return t('dashboard.tag', { name: activeFilter.name || '' });
    return t('dashboard.bookmarks');
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddGroup={() => setGroupModal({ open: true, group: null })}
        onEditGroup={(group) => setGroupModal({ open: true, group })}
        onAddTag={() => setTagModal({ open: true, tag: null })}
        onEditTag={(tag) => setTagModal({ open: true, tag })}
        onImportExport={() => setImportExportModal(true)}
      />

      <div className="main-content">
        <Header
          title={getTitle()}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          onAddBookmark={() => setBookmarkModal({ open: true, bookmark: null })}
        />

        <div className="page-content">
          <BookmarkList
            onEdit={(bookmark) => setBookmarkModal({ open: true, bookmark })}
            onAddBookmark={() => setBookmarkModal({ open: true, bookmark: null })}
          />
        </div>
      </div>

      {bookmarkModal.open && (
        <BookmarkModal
          bookmark={bookmarkModal.bookmark}
          onClose={() => setBookmarkModal({ open: false, bookmark: null })}
        />
      )}

      {tagModal.open && (
        <TagModal
          tag={tagModal.tag}
          onClose={() => setTagModal({ open: false, tag: null })}
        />
      )}

      {groupModal.open && (
        <GroupModal
          group={groupModal.group}
          onClose={() => setGroupModal({ open: false, group: null })}
        />
      )}

      {importExportModal && (
        <ImportExportModal onClose={() => setImportExportModal(false)} />
      )}
    </div>
  );
}
