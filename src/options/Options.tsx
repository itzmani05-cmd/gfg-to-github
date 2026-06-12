import React, { useEffect, useState } from 'react';
import { useExtensionStore } from '../storage/store';
import { Settings, CheckCircle2, Loader2, LogOut, ShieldCheck, Folder, Tag, Plus, Trash2, GitBranch, ArrowRight, ExternalLink } from 'lucide-react';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Options: React.FC = () => {
  const store = useExtensionStore();
  const [tokenInput, setTokenInput] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    store.initStore();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsConnecting(true);
    try {
      await store.setGithubToken(tokenInput.trim());
      setTokenInput('');
    } catch {
      // Error handled by store.githubError
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAddFolder = async () => {
    const trimmed = newFolder.trim();
    if (!trimmed) return;
    await store.addRecentFolder(trimmed);
    setNewFolder('');
  };

  const handleDeleteFolder = async (folderName: string) => {
    const updated = store.recentFolders.filter((f) => f !== folderName);
    await store.updateSettings({ recentFolders: updated });
  };

  const handleClearTagMappings = async () => {
    await store.updateSettings({ tagToFolder: {} });
  };

  if (!store.isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={36} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Settings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans py-12 px-4 flex justify-center selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Branding Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.06)]">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">GFG → GitHub Sync</h1>
              <p className="text-xs text-slate-450 mt-1 font-medium">
                Manage your configurations, repositories, directories, and auto-sync triggers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-3 py-1 bg-white border border-slate-200/80 rounded-full text-slate-600 shadow-sm flex items-center gap-1">
              <Github size={12} className="text-slate-800" /> Extension v1.0.0
            </span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Auth Section */}
          <div className="space-y-6 md:col-span-1">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Github size={15} className="text-slate-800" /> Account Link
              </h2>

              {!store.githubToken ? (
                <form onSubmit={handleConnect} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Link your GitHub account using a Personal Access Token to enable repo syncing.
                  </p>
                  <div>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Paste token here..."
                      className="w-full text-xs border border-slate-200/80 rounded-xl p-3 bg-white text-slate-950 shadow-inner focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 placeholder:text-slate-350"
                      required
                    />
                  </div>
                  {store.githubError && (
                    <p className="text-[10px] text-rose-800 font-bold bg-rose-50/50 border border-rose-100 p-2.5 rounded-lg">
                      ⚠️ {store.githubError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full bg-slate-950 hover:bg-slate-850 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isConnecting ? <Loader2 size={14} className="animate-spin" /> : <span>Connect Account</span>}
                  </button>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=GFG%20to%20GitHub%20Sync"
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                  >
                    Generate Token on GitHub
                  </a>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-200/50 p-3.5 rounded-xl shadow-inner">
                    <img
                      src={store.avatarUrl || 'https://github.com/identicons/default.png'}
                      alt={store.username || 'GitHub User'}
                      className="w-11 h-11 rounded-full border border-slate-200 shadow-sm"
                    />
                    <div className="overflow-hidden">
                      <h3 className="text-xs font-bold text-slate-950 truncate">{store.username}</h3>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span>Linked</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => store.disconnect()}
                    className="w-full bg-white hover:bg-rose-50/30 hover:text-rose-600 hover:border-rose-200 border border-slate-200/80 text-slate-700 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={14} />
                    <span>Disconnect Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Configurations */}
          <div className="space-y-6 md:col-span-2">
            {store.githubToken ? (
              <>
                {/* Repository Settings */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-2">
                    <Settings size={15} className="text-emerald-600" /> Repository Configurations
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Repository Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Default Repository
                      </label>
                      <div className="relative">
                        <select
                          value={store.selectedRepo || ''}
                          onChange={(e) => store.updateSettings({ selectedRepo: e.target.value })}
                          className="w-full text-xs border border-slate-200/80 rounded-xl p-3 bg-white text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 appearance-none shadow-sm cursor-pointer"
                        >
                          <option value="" disabled>Select repository</option>
                          {store.repos.map((repo) => (
                            <option key={repo.id} value={repo.full_name}>
                              {repo.name} {repo.private ? '🔒' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
                      </div>
                    </div>

                    {/* Branch Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Default Branch
                      </label>
                      <div className="relative">
                        <select
                          value={store.selectedBranch || 'main'}
                          onChange={(e) => store.updateSettings({ selectedBranch: e.target.value })}
                          disabled={!store.selectedRepo}
                          className="w-full text-xs border border-slate-200/80 rounded-xl p-3 bg-white text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 appearance-none shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {store.branches.length === 0 ? (
                            <option value={store.selectedBranch || 'main'}>{store.selectedBranch || 'main'}</option>
                          ) : (
                            store.branches.map((branch) => (
                              <option key={branch.name} value={branch.name}>
                                {branch.name}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Settings */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-600" /> Sync Trigger Rules
                  </h2>

                  <div className="space-y-4">
                    {/* Modal Auto Open */}
                    <label className="flex items-start justify-between p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-xs font-extrabold text-slate-950">Auto-open popup modal</h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-medium">
                          Slide in the folder/filename configuration overlay on the GeeksforGeeks page instantly upon solving a problem.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={store.autoOpen}
                        onChange={(e) => store.updateSettings({ autoOpen: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer mt-1"
                      />
                    </label>

                    {/* Auto Push */}
                    <label className="flex items-start justify-between p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-xs font-extrabold text-slate-950">Auto-push mode (Zero clicks)</h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-medium">
                          Commit and push solutions in the background without any overlays using default repository rules and smart directory mapping.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={store.autoPush}
                        onChange={(e) => store.updateSettings({ autoPush: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer mt-1"
                      />
                    </label>

                    {/* Directory Structure */}
                    <div className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-950">Default Folder Layout</h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-medium">
                          Select the directory layout rule for saving files inside your repository.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name="folderNaming"
                            value="topic"
                            checked={store.folderNaming === 'topic'}
                            onChange={() => store.updateSettings({ folderNaming: 'topic' })}
                            className="accent-emerald-500"
                          />
                          <span>Category subfolders (e.g. <code>Arrays/reverse.cpp</code>)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name="folderNaming"
                            value="flat"
                            checked={store.folderNaming === 'flat'}
                            onChange={() => store.updateSettings({ folderNaming: 'flat' })}
                            className="accent-emerald-500"
                          />
                          <span>Flat repository root (No subdirectories)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Directory suggestions pool */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-2">
                    <Folder size={15} className="text-emerald-600" /> Folder Recommendations Pool
                  </h2>

                  <div className="space-y-4">
                    {/* Add folder custom */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add custom folder (e.g., Dynamic Programming, Trees)..."
                        value={newFolder}
                        onChange={(e) => setNewFolder(e.target.value)}
                        className="flex-1 text-xs border border-slate-200/80 rounded-xl p-2.5 bg-white text-slate-950 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-205"
                      />
                      <button
                        onClick={handleAddFolder}
                        className="bg-slate-950 hover:bg-slate-800 text-white px-5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 hover:translate-y-[-0.5px]"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    {/* Folder Tags list */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Available Suggestions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {store.recentFolders.map((folder) => (
                          <div
                            key={folder}
                            className="text-xs bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 flex items-center gap-2 text-slate-850 font-bold hover:bg-slate-100/60 transition-colors"
                          >
                            <span>{folder}</span>
                            <button
                              onClick={() => handleDeleteFolder(folder)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete folder from pool"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tag mappings card */}
                    <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-start gap-2.5">
                        <Tag size={16} className="text-slate-400 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-950">Topic-to-Folder Associations</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">
                            Automatically maps scraped topic tags on GeeksforGeeks to your custom folders based on push history.
                          </p>
                        </div>
                      </div>
                      {Object.keys(store.tagToFolder).length > 0 ? (
                        <button
                          onClick={handleClearTagMappings}
                          className="bg-white hover:bg-rose-55 hover:text-rose-600 hover:border-rose-200 text-slate-700 border border-slate-200/80 rounded-lg px-3 py-2 text-[10px] font-bold transition-all shadow-sm"
                        >
                          Reset Associations ({Object.keys(store.tagToFolder).length})
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold bg-white border border-slate-200/50 rounded-lg px-2.5 py-1.5">None recorded yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                  <Github size={32} className="text-slate-350" />
                </div>
                <h3 className="text-sm font-black text-slate-950">Configuration Locked</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-medium">
                  Connect your GitHub account inside the left panel first to enable settings configuration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
