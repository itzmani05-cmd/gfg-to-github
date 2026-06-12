import { create } from 'zustand';
import { chromeStorage, type ExtensionSettings } from './chromeStorage';
import { githubApi, type GitHubRepo, type GitHubBranch } from '../services/github';

interface StoreState extends ExtensionSettings {
  isInitialized: boolean;
  repos: GitHubRepo[];
  branches: GitHubBranch[];
  isLoadingRepos: boolean;
  isLoadingBranches: boolean;
  githubError: string | null;

  // Actions
  initStore: () => Promise<void>;
  setGithubToken: (token: string | null) => Promise<void>;
  updateSettings: (settings: Partial<ExtensionSettings>) => Promise<void>;
  fetchReposList: () => Promise<void>;
  fetchBranchesList: (repoFullName: string) => Promise<void>;
  addRecentFolder: (folder: string) => Promise<void>;
  saveTagFolderMapping: (tag: string, folder: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useExtensionStore = create<StoreState>((set, get) => ({
  githubToken: null,
  username: null,
  avatarUrl: null,
  selectedRepo: null,
  selectedBranch: 'main',
  autoOpen: true,
  autoPush: false,
  folderNaming: 'topic',
  recentFolders: [],
  tagToFolder: {},

  isInitialized: false,
  repos: [],
  branches: [],
  isLoadingRepos: false,
  isLoadingBranches: false,
  githubError: null,

  initStore: async () => {
    if (get().isInitialized) return;
    const settings = await chromeStorage.getAll();
    set({
      ...settings,
      isInitialized: true,
    });

    // If token exists, proactively fetch repos
    if (settings.githubToken) {
      get().fetchReposList().catch(() => {});
      if (settings.selectedRepo) {
        get().fetchBranchesList(settings.selectedRepo).catch(() => {});
      }
    }
  },

  setGithubToken: async (token) => {
    if (!token) {
      await get().disconnect();
      return;
    }

    set({ isLoadingRepos: true, githubError: null });
    try {
      const user = await githubApi.fetchUser(token);
      await chromeStorage.set({
        githubToken: token,
        username: user.login,
        avatarUrl: user.avatar_url,
      });

      set({
        githubToken: token,
        username: user.login,
        avatarUrl: user.avatar_url,
      });

      // Load repos automatically
      await get().fetchReposList();
    } catch (err: any) {
      set({ githubError: err.message || 'GitHub Authentication Failed' });
      throw err;
    } finally {
      set({ isLoadingRepos: false });
    }
  },

  updateSettings: async (settings) => {
    await chromeStorage.set(settings);
    set(settings as any);
  },

  fetchReposList: async () => {
    const token = get().githubToken;
    if (!token) return;

    set({ isLoadingRepos: true, githubError: null });
    try {
      const repos = await githubApi.fetchRepos(token);
      set({ repos, githubError: null });
    } catch (err: any) {
      set({ githubError: err.message || 'Failed to fetch repositories' });
    } finally {
      set({ isLoadingRepos: false });
    }
  },

  fetchBranchesList: async (repoFullName) => {
    const token = get().githubToken;
    if (!token) return;

    set({ isLoadingBranches: true, githubError: null });
    try {
      const branches = await githubApi.fetchBranches(token, repoFullName);
      set({ branches, githubError: null });
    } catch (err: any) {
      set({ githubError: err.message || 'Failed to fetch branches' });
    } finally {
      set({ isLoadingBranches: false });
    }
  },

  addRecentFolder: async (folder) => {
    const trimmed = folder.trim();
    if (!trimmed) return;
    const current = get().recentFolders;
    const filtered = current.filter((f) => f !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, 10); // keep max 10
    await get().updateSettings({ recentFolders: updated });
  },

  saveTagFolderMapping: async (tag, folder) => {
    const trimmedTag = tag.trim();
    const trimmedFolder = folder.trim();
    if (!trimmedTag || !trimmedFolder) return;
    const current = { ...get().tagToFolder };
    current[trimmedTag] = trimmedFolder;
    await get().updateSettings({ tagToFolder: current });
  },

  disconnect: async () => {
    await chromeStorage.clear();
    set({
      githubToken: null,
      username: null,
      avatarUrl: null,
      selectedRepo: null,
      selectedBranch: 'main',
      autoOpen: true,
      autoPush: false,
      folderNaming: 'topic',
      recentFolders: ['Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs', 'LinkedList'],
      tagToFolder: {},
      repos: [],
      branches: [],
      githubError: null,
    });
  },
}));
