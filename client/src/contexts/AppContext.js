import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [defaultCardBg, setDefaultCardBg] = useState(() => localStorage.getItem('defaultCardBg') || '');
  const [bookmarkList, setBookmarkList] = useState([]);
  const [tagList, setTagList] = useState([]);
  const [groupTree, setGroupTree] = useState([]);
  const [groupFlat, setGroupFlat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalBookmarks, setTotalBookmarks] = useState(0);

  // Active filters
  const [activeFilter, setActiveFilter] = useState({ type: 'all' }); // {type: 'all'|'group'|'tag', id: number}
  const [searchQuery, setSearchQuery] = useState('');

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Default card background
  useEffect(() => {
    if (defaultCardBg) {
      localStorage.setItem('defaultCardBg', defaultCardBg);
    } else {
      localStorage.removeItem('defaultCardBg');
    }
  }, [defaultCardBg]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Auth
  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.auth.register(name, email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const guestLogin = async () => {
    const data = await api.auth.guest();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setActiveFilter({ type: 'public' });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBookmarkList([]);
    setTagList([]);
    setGroupTree([]);
    setGroupFlat([]);
  };

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const filterParams = { ...params };
      if (searchQuery) filterParams.search = searchQuery;

      if (activeFilter.type === 'public') {
        // Fetch only public bookmarks from all users
        const data = await api.bookmarks.listPublic(filterParams);
        setBookmarkList(data.bookmarks);
        setTotalBookmarks(data.total);
      } else {
        if (activeFilter.type === 'all') {
          // All visible: user's own + public from other users
          filterParams.include_public = 1;
        }
        // 'mine' uses default query (user's own bookmarks only) — no extra params needed
        if (activeFilter.type === 'private') {
          filterParams.private_only = 1;
        }
        if (activeFilter.type === 'group' && activeFilter.id) {
          filterParams.group_id = activeFilter.id;
          filterParams.include_public = 1;
        }
        if (activeFilter.type === 'tag' && activeFilter.id) {
          filterParams.tag_id = activeFilter.id;
          filterParams.include_public = 1;
        }

        const data = await api.bookmarks.list(filterParams);
        setBookmarkList(data.bookmarks);
        setTotalBookmarks(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const data = await api.tags.list();
      setTagList(data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }, []);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const [tree, flat] = await Promise.all([api.groups.list(), api.groups.listFlat()]);
      setGroupTree(tree);
      setGroupFlat(flat);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      fetchBookmarks();
      fetchTags();
      fetchGroups();
    }
  }, [user, fetchBookmarks, fetchTags, fetchGroups]);

  // Reload bookmarks when filter/search changes
  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, activeFilter, searchQuery, fetchBookmarks]);

  const value = {
    user, login, register, guestLogin, logout,
    isGuest: !!user?.isGuest,
    theme, toggleTheme,
    defaultCardBg, setDefaultCardBg,
    bookmarkList, totalBookmarks, fetchBookmarks, loading,
    tagList, fetchTags,
    groupTree, groupFlat, fetchGroups,
    activeFilter, setActiveFilter,
    searchQuery, setSearchQuery,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
