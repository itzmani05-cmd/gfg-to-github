import React, { useState, useEffect } from 'react';
import { useExtensionStore } from '../storage/store';
import { githubApi } from '../services/github';
import { suggestFilename, addFileCommentHeader } from '../utils/filename';
import { Folder, FileCode, GitBranch, CheckCircle2, AlertTriangle, Loader2, X, AlertCircle } from 'lucide-react';

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

interface InjectedModalProps {
  problemTitle: string;
  problemUrl: string;
  scrapedCode: string;
  scrapedLanguage: string;
  detectedTags: string[];
  onClose: () => void;
}

export const InjectedModal: React.FC<InjectedModalProps> = ({
  problemTitle,
  problemUrl,
  scrapedCode,
  scrapedLanguage,
  detectedTags,
  onClose,
}) => {
  const store = useExtensionStore();

  // Form State
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'confirm_overwrite'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [existingSha, setExistingSha] = useState<string | null>(null);

  // Suggested folders based on tags or recent history
  const [folderSuggestions, setFolderSuggestions] = useState<string[]>([]);

  useEffect(() => {
    store.initStore();
  }, []);

  // Set default values once store is initialized
  useEffect(() => {
    if (store.isInitialized) {
      // 1. Suggest folder name based on tags
      let suggestedFolder = '';
      if (detectedTags && detectedTags.length > 0) {
        // Find if any tag matches a previously saved tag -> folder mapping
        for (const tag of detectedTags) {
          if (store.tagToFolder[tag]) {
            suggestedFolder = store.tagToFolder[tag];
            break;
          }
        }
        // Fallback: If no mapping, check if any tag matches a folder in recent folders
        if (!suggestedFolder) {
          for (const tag of detectedTags) {
            const match = store.recentFolders.find(
              (f) => f.toLowerCase() === tag.toLowerCase()
            );
            if (match) {
              suggestedFolder = match;
              break;
            }
          }
        }
        // Fallback: Use the first tag as folder name
        if (!suggestedFolder && detectedTags[0]) {
          suggestedFolder = detectedTags[0];
        }
      }

      // If no suggestion, use last used folder or dynamic default
      if (!suggestedFolder && store.recentFolders.length > 0) {
        suggestedFolder = store.recentFolders[0];
      }

      setFolderName(suggestedFolder || 'DSA');

      // 2. Suggest file name
      const suggestedFile = suggestFilename(problemTitle, scrapedLanguage);
      setFileName(suggestedFile);

      // 3. Set default commit message
      setCommitMessage(`Solved: ${problemTitle} - GFG`);

      // 4. Repositories
      if (store.selectedRepo) {
        setSelectedRepo(store.selectedRepo);
      } else if (store.repos.length > 0) {
        setSelectedRepo(store.repos[0].full_name);
      }

      // 5. Branch
      if (store.selectedBranch) {
        setSelectedBranch(store.selectedBranch);
      }

      // Filter folder suggestions
      setFolderSuggestions(store.recentFolders.slice(0, 5));
    }
  }, [store.isInitialized, problemTitle, scrapedLanguage, detectedTags]);

  // Load branches when selectedRepo changes
  useEffect(() => {
    if (store.githubToken && selectedRepo) {
      store.fetchBranchesList(selectedRepo).catch(() => {});
    }
  }, [selectedRepo, store.githubToken]);

  const handlePush = async (overwrite = false) => {
    if (!store.githubToken) {
      setStatus('error');
      setStatusMessage('GitHub token not found. Please connect your account first.');
      return;
    }
    if (!selectedRepo) {
      setStatus('error');
      setStatusMessage('Please select a repository.');
      return;
    }

    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Uploading solution...');

    try {
      // Calculate full path
      const cleanedFolder = folderName.trim().replace(/\/+$/, ''); // remove trailing slash
      const fullPath = cleanedFolder ? `${cleanedFolder}/${fileName}` : fileName;

      // Check if file exists (unless we are explicitly overwriting)
      if (!overwrite) {
        const sha = await githubApi.getFileSha(store.githubToken, selectedRepo, selectedBranch, fullPath);
        if (sha) {
          // File already exists, show overwrite confirmation UI
          setExistingSha(sha);
          setStatus('confirm_overwrite');
          setIsLoading(false);
          return;
        }
      }

      // Add headers
      const finalCode = addFileCommentHeader(scrapedCode, problemTitle, problemUrl, scrapedLanguage);

      const result = await githubApi.pushFile(
        store.githubToken,
        selectedRepo,
        selectedBranch,
        fullPath,
        finalCode,
        commitMessage,
        overwrite ? existingSha : null
      );

      if (result.success) {
        setStatus('success');
        setStatusMessage('Successfully pushed to GitHub!');
        
        // Save folder context
        await store.addRecentFolder(folderName);
        if (detectedTags && detectedTags.length > 0) {
          for (const tag of detectedTags) {
            await store.saveTagFolderMapping(tag, folderName);
          }
        }

        // Close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setStatus('error');
        setStatusMessage(result.message || 'GitHub push failed.');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Failed to push to GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!store.githubToken) {
    return (
      <div className="p-5 font-sans bg-white border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-sm w-80 text-slate-900 select-none">
        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 font-extrabold text-[10px] tracking-widest text-emerald-600 uppercase">
            <Github size={14} className="text-slate-800" />
            <span>GFG → GitHub</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <AlertCircle className="text-rose-600 mb-2 animate-bounce" size={32} />
          <p className="text-xs font-semibold mb-4 text-slate-550 leading-relaxed px-2">
            Please link your GitHub account in the extension toolbar dropdown to sync your GFG solutions.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-950 hover:bg-slate-850 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-white border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-sm w-[350px] overflow-hidden text-slate-900 select-none animate-slide-in">
      {/* Header */}
      <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100/50">
            <CheckCircle2 size={15} />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Problem Accepted</h3>
            <p className="text-[11px] text-slate-450 font-semibold truncate max-w-[220px] mt-0.5">
              {problemTitle}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-950 transition-all p-1 hover:bg-slate-100/80 rounded-lg">
          <X size={15} />
        </button>
      </div>

      {/* Main Form */}
      {status === 'confirm_overwrite' ? (
        <div className="p-5 flex flex-col items-center text-center">
          <AlertTriangle className="text-amber-500 mb-3 animate-pulse" size={32} />
          <h4 className="text-sm font-extrabold mb-1.5 text-slate-950">File Already Exists</h4>
          <p className="text-xs text-slate-450 mb-5 leading-relaxed px-3 font-medium">
            A file named <code className="bg-slate-50 border border-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px]">{folderName}/{fileName}</code> already exists in this repository path.
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => handlePush(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:translate-y-[-0.5px]"
            >
              Overwrite
            </button>
            <button
              onClick={() => setStatus('idle')}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : status === 'success' ? (
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <h4 className="text-sm font-extrabold text-emerald-650">Pushed to GitHub</h4>
          <p className="text-xs text-slate-450 max-w-[240px] leading-relaxed font-semibold">
            Successfully committed <b>{fileName}</b>!
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-3.5">
          {/* Status Notifications */}
          {status === 'loading' && (
            <div className="bg-sky-50/50 border border-sky-100 text-sky-850 rounded-lg p-2.5 flex items-center gap-2 text-[11px] font-semibold">
              <Loader2 size={14} className="animate-spin text-sky-500" />
              <span>{statusMessage}</span>
            </div>
          )}
          {status === 'error' && (
            <div className="bg-rose-50/50 border border-rose-100 text-rose-850 rounded-lg p-2.5 flex items-start gap-2 text-[11px] font-semibold">
              <AlertCircle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="truncate">{statusMessage}</span>
            </div>
          )}

          {/* Repo Selection */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Repository
            </label>
            <div className="col-span-2 relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs border border-slate-200/80 rounded-lg p-2 bg-white text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 appearance-none shadow-sm cursor-pointer"
              >
                <option value="" disabled>Select Repository</option>
                {store.repos.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.name} {repo.private ? '🔒' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2 pointer-events-none text-slate-400 text-[10px]">▼</div>
            </div>
          </div>

          {/* Branch Selection */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Branch
            </label>
            <div className="col-span-2 relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={isLoading || !selectedRepo}
                className="w-full text-xs border border-slate-200/80 rounded-lg p-2 bg-white text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 appearance-none shadow-sm cursor-pointer disabled:opacity-50"
              >
                {store.branches.length === 0 ? (
                  <option value={selectedBranch}>{selectedBranch}</option>
                ) : (
                  store.branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-3 top-2 pointer-events-none text-slate-400 text-[10px]">▼</div>
            </div>
          </div>

          {/* Folder Name */}
          <div className="grid grid-cols-3 items-start gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Folder
            </label>
            <div className="col-span-2 space-y-1.5">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Arrays, Graphs, DP"
                disabled={isLoading}
                className="w-full text-xs border border-slate-200/80 rounded-lg p-2 text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 shadow-sm"
              />
              {/* Folder Suggestion Tags */}
              {folderSuggestions.length > 0 && !folderName && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {folderSuggestions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFolderName(f)}
                      className="text-[9px] bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-lg text-slate-600 font-bold transition-all shadow-sm"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* File Name */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. reverse_array.cpp"
              disabled={isLoading}
              className="col-span-2 text-xs border border-slate-200/80 rounded-lg p-2 text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Commit Message */}
          <div className="grid grid-cols-3 items-start gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Commit Msg
            </label>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={2}
              disabled={isLoading}
              className="col-span-2 text-xs border border-slate-200/80 rounded-lg p-2 text-slate-950 font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 resize-none shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handlePush(false)}
              disabled={isLoading || !selectedRepo}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:translate-y-[-0.5px] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:translate-y-0"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>Push Code</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
