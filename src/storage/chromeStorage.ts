export interface ExtensionSettings {
  githubToken: string | null;
  username: string | null;
  avatarUrl: string | null;
  selectedRepo: string | null;
  selectedBranch: string | null;
  autoOpen: boolean;
  autoPush: boolean;
  folderNaming: 'topic' | 'flat';
  recentFolders: string[];
  tagToFolder: Record<string, string>;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
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
};

// Check if chrome.storage is available
const isExtensionEnv = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export const chromeStorage = {
  get: async <K extends keyof ExtensionSettings>(keys: K[]): Promise<Pick<ExtensionSettings, K>> => {
    if (isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
          const res = {} as Pick<ExtensionSettings, K>;
          keys.forEach((key) => {
            res[key] = (result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key]) as ExtensionSettings[K];
          });
          resolve(res);
        });
      });
    } else {
      // Fallback to localStorage
      const res = {} as Pick<ExtensionSettings, K>;
      keys.forEach((key) => {
        const val = localStorage.getItem(`gfg_sync_${key}`);
        if (val !== null) {
          try {
            res[key] = JSON.parse(val);
          } catch {
            res[key] = val as any;
          }
        } else {
          res[key] = DEFAULT_SETTINGS[key] as any;
        }
      });
      return res;
    }
  },

  getAll: async (): Promise<ExtensionSettings> => {
    const keys = Object.keys(DEFAULT_SETTINGS) as (keyof ExtensionSettings)[];
    const data = await chromeStorage.get(keys);
    return data as ExtensionSettings;
  },

  set: async (items: Partial<ExtensionSettings>): Promise<void> => {
    if (isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
          resolve();
        });
      });
    } else {
      // Fallback to localStorage
      Object.entries(items).forEach(([key, val]) => {
        localStorage.setItem(`gfg_sync_${key}`, JSON.stringify(val));
      });
    }
  },

  clear: async (): Promise<void> => {
    if (isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    } else {
      Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        localStorage.removeItem(`gfg_sync_${key}`);
      });
    }
  }
};
