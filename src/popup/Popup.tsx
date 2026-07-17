import React, { useEffect, useState } from 'react';
import { useExtensionStore } from '../storage/store';
import { Settings, CheckCircle2, Loader2, LogOut, ArrowRight, ExternalLink, ShieldAlert, GitBranch, FolderOpen } from 'lucide-react';

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

export const Popup: React.FC = () => {
  const store = useExtensionStore();
  const [tokenInput, setTokenInput] = useState('');
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

  const openOptionsPage = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  };

  if (!store.isInitialized) {
    return (
      <div className="w-80 h-96 bg-slate-50/50 backdrop-blur-md flex items-center justify-center font-sans">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-[#fcfcfd] font-sans text-slate-900 border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-xl overflow-hidden select-none">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100/50">
            <CheckCircle2 size={15} />
          </div>
          <span className="font-extrabold text-[10px] tracking-widest text-emerald-600 uppercase">GFG → GitHub</span>
        </div>
        <button
          onClick={openOptionsPage}
          className="text-slate-400 hover:text-slate-900 transition-all p-1.5 hover:bg-slate-100/80 rounded-lg"
          title="Open Settings"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {!store.githubToken ? (
          /* Authentication Screen */
          <div className="space-y-4">
            <div className="text-center space-y-1 py-1">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto border border-slate-200/60 shadow-sm transition-transform hover:scale-105 duration-300">
                <Github size={22} className="text-slate-800" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-950 mt-2">Connect to GitHub</h2>
              <p className="text-[11px] text-slate-400 px-3 leading-relaxed">
                Automatically sync your solutions to your repository without leaving GeeksforGeeks.
              </p>
            </div>

            {/* Error Message */}
            {store.githubError && (
              <div className="bg-rose-50/50 border border-rose-100 text-rose-800 rounded-lg p-2.5 flex items-start gap-2 text-[10px] animate-shake">
                <ShieldAlert size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{store.githubError}</span>
              </div>
            )}

            {/* Connect Form */}
            <form onSubmit={handleConnect} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste ghp_token..."
                  className="w-full text-xs border border-slate-200/80 rounded-lg p-2.5 bg-white text-slate-950 shadow-inner focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 placeholder:text-slate-350"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white py-2.5 px-3 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:translate-y-[-0.5px] disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Connect Account</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="bg-white rounded-lg p-3 border border-slate-100 text-[11px] space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="font-bold text-slate-900 block border-b border-slate-50 pb-1">Quick Setup Checklist</span>
              <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[10px]">
                <li>Open the token link below.</li>
                <li>Check the <code className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-100 font-mono text-[9px]">repo</code> checkbox permission.</li>
                <li>Generate and paste the token here.</li>
              </ol>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=GFG%20to%20GitHub%20Sync"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold transition-all text-[10px] pt-1"
              >
                <span>Generate Token</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ) : (
          /* Connected State Screen */
          <div className="space-y-4">
            {/* User Profile Info */}
            <div className="flex items-center justify-between bg-white border border-slate-200/50 rounded-xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2.5">
                <img
                  src={store.avatarUrl || 'https://github.com/identicons/default.png'}
                  alt={store.username || 'GitHub User'}
                  className="w-9 h-9 rounded-full border border-slate-150 shadow-sm"
                />
                <div className="overflow-hidden">
                  <h3 className="text-xs font-bold text-slate-950 truncate max-w-[130px]">
                    {store.username}
                  </h3>
                  <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>Synced</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => store.disconnect()}
                className="text-slate-400 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50/50 rounded-lg"
                title="Disconnect Account"
              >
                <LogOut size={14} />
              </button>
            </div>

            {/* Selection Fields */}
            <div className="space-y-3">
              {/* Repo Dropdown */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Default Repository
                </label>
                <div className="relative">
                  <select
                    value={store.selectedRepo || ''}
                    onChange={(e) => {
                      const repo = e.target.value;
                      store.updateSettings({ selectedRepo: repo, selectedBranch: 'main' });
                      store.fetchBranchesList(repo);
                    }}
                    disabled={store.isLoadingRepos}
                    className="w-full text-xs border border-slate-200/80 rounded-lg p-2 bg-white text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    <option value="" disabled>{store.isLoadingRepos ? 'Loading repositories...' : 'Select Repository'}</option>
                    {store.repos.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.name} {repo.private ? '🔒' : ''}
                      </option>
                    ))}
                  </select>
                  {store.isLoadingRepos ? (
                    <Loader2 size={12} className="absolute right-3 top-2.5 animate-spin text-emerald-500" />
                  ) : (
                    <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
                  )}
                </div>
              </div>

              {/* Branch Dropdown */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Default Branch
                </label>
                <div className="relative">
                  <select
                    value={store.selectedBranch || 'main'}
                    onChange={(e) => store.updateSettings({ selectedBranch: e.target.value })}
                    disabled={!store.selectedRepo || store.isLoadingBranches}
                    className="w-full text-xs border border-slate-200/80 rounded-lg p-2 bg-white text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {store.branches.length === 0 ? (
                      <option value={store.selectedBranch || 'main'}>
                        {store.isLoadingBranches ? 'Loading branches...' : (store.selectedBranch || 'main')}
                      </option>
                    ) : (
                      store.branches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                        </option>
                      ))
                    )}
                  </select>
                  {store.isLoadingBranches ? (
                    <Loader2 size={12} className="absolute right-3 top-2.5 animate-spin text-emerald-500" />
                  ) : (
                    <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1 select-none">
                  <span className="font-semibold flex items-center gap-1.5">
                    <FolderOpen size={13} className="text-slate-400" /> Auto-open push popup
                  </span>
                  <input
                    type="checkbox"
                    checked={store.autoOpen}
                    onChange={(e) => store.updateSettings({ autoOpen: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1 select-none">
                  <span className="font-semibold flex items-center gap-1.5">
                    <GitBranch size={13} className="text-slate-400" /> Auto-push mode
                  </span>
                  <input
                    type="checkbox"
                    checked={store.autoPush}
                    onChange={(e) => store.updateSettings({ autoPush: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Settings link */}
            <button
              onClick={openOptionsPage}
              className="w-full text-center text-[10px] text-emerald-600 hover:text-emerald-700 font-bold transition-all py-2.5 border border-dashed border-emerald-500/30 rounded-lg hover:bg-emerald-50/50 block mt-2"
            >
              Configure Advanced Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
