import React from 'react';
import ReactDOM from 'react-dom/client';
import { InjectedModal } from './InjectedModal';
import { chromeStorage } from '../storage/chromeStorage';
import { githubApi } from '../services/github';
import { suggestFilename, addFileCommentHeader } from '../utils/filename';
import './content.css';

console.log('[GFG -> GitHub Sync] Isolated content script successfully injected.');

// State to track clicks and solve status
let isSubmitting = false;
let lastSolvedUrl = '';
let lastSolvedTime = 0;
let pollInterval: any = null;

function triggerSuccessCheck() {
  isSubmitting = true;
  startPollingForSuccess();
}

function startPollingForSuccess() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  console.log('[GFG -> GitHub Sync] Started polling for solved status...');
  let attempts = 0;
  
  pollInterval = setInterval(() => {
    attempts++;
    
    // Stop after 45 seconds (45 attempts)
    if (attempts > 45) {
      console.log('[GFG -> GitHub Sync] Submission poll timeout (45s). Stopping poll.');
      clearInterval(pollInterval);
      isSubmitting = false;
      return;
    }

    const bodyText = document.body.innerText.toLowerCase();
    const successTextMatches = [
      'problem solved successfully',
      'correct answer',
      'all test cases passed',
      'verdict: accepted',
      'verdict:correct answer'
    ];
    const hasSuccessText = successTextMatches.some(text => bodyText.includes(text));

    if (hasSuccessText) {
      console.log('[GFG -> GitHub Sync] Polling detected success verdict text!');
      clearInterval(pollInterval);
      
      const now = Date.now();
      const currentUrl = window.location.href;
      
      if (currentUrl === lastSolvedUrl && now - lastSolvedTime < 10000) {
        isSubmitting = false;
        return;
      }
      
      lastSolvedUrl = currentUrl;
      lastSolvedTime = now;
      isSubmitting = false;
      
      requestCodeExtraction();
    }
  }, 1000);
}

// Listen for clicks on GFG Submit buttons (mouse clicks)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const isSubmitBtn =
    target.id === 'runAndSubmitButton' ||
    target.textContent?.trim().toLowerCase().includes('submit') ||
    target.closest('#runAndSubmitButton') ||
    target.closest('.problems-submit-btn') ||
    target.closest('[class*="submit"]') ||
    target.closest('[id*="submit"]');

  if (isSubmitBtn) {
    console.log('[GFG -> GitHub Sync] Submit click detected.');
    triggerSuccessCheck();
  }
});

// Listen for keydown shortcuts (like Ctrl + Enter or Cmd + Enter inside the editor)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    console.log('[GFG -> GitHub Sync] Submit shortcut keys detected.');
    triggerSuccessCheck();
  }
});

// GFG Success patterns
const successTextMatches = [
  'problem solved successfully',
  'correct answer',
  'all test cases passed',
  'verdict: accepted',
  'verdict:correct answer'
];

// Setup MutationObserver to watch for GFG success verdict (additional safety net)
const observer = new MutationObserver((mutations) => {
  let successDetected = false;

  // Layer 1: Check newly added nodes in mutations (works on dynamic insertions)
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          const text = node.innerText?.toLowerCase() || '';
          if (successTextMatches.some(match => text.includes(match))) {
            successDetected = true;
            break;
          }
        }
      }
    }
  }

  // Layer 2: Fallback scan of page body when isSubmitting is active
  if (!successDetected && isSubmitting) {
    const bodyText = document.body.innerText.toLowerCase();
    const hasSuccessText = successTextMatches.some(text => bodyText.includes(text));
    if (hasSuccessText) {
      successDetected = true;
    }
  }

  if (successDetected) {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    const now = Date.now();
    const currentUrl = window.location.href;

    // Throttle triggers for the same URL within 10 seconds to avoid duplicates
    if (currentUrl === lastSolvedUrl && now - lastSolvedTime < 10000) {
      return;
    }

    isSubmitting = false;
    lastSolvedUrl = currentUrl;
    lastSolvedTime = now;

    console.log('[GFG -> GitHub Sync] Observer detected success verdict! Requesting code extraction...');
    // Trigger code extraction from the MAIN world
    requestCodeExtraction();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function requestCodeExtraction() {
  // 1. Dispatch custom event to MAIN world
  window.dispatchEvent(new CustomEvent('GFG_SYNC_REQ_EXTRACT'));
}

function getCodeFromDOM(): string {
  const lineSelectors = [
    '.view-line',          // Monaco
    '.ace_line',           // Ace Editor
    '.CodeMirror-line',    // CodeMirror 5
    '.cm-line',            // CodeMirror 6
    '[class*="editor-line"]',
    '[class*="code-line"]',
    '.line'
  ];

  for (const selector of lineSelectors) {
    const lines = document.querySelectorAll(selector);
    if (lines && lines.length > 0) {
      console.log(`[GFG -> GitHub Sync] Extracted code lines using selector: ${selector}, count: ${lines.length}`);
      return Array.from(lines)
        .map(line => line.textContent || '')
        .join('\n');
    }
  }
  
  // Fallback 2: Check any pre elements inside elements containing "editor" or "code"
  const editorContainers = document.querySelectorAll('[class*="editor"], [class*="code"], [id*="editor"], [id*="code"]');
  for (const container of Array.from(editorContainers)) {
    const pres = container.querySelectorAll('pre');
    if (pres && pres.length > 0) {
      console.log('[GFG -> GitHub Sync] Extracted code lines using pre elements inside editor container.');
      return Array.from(pres)
        .map(pre => pre.textContent || '')
        .join('\n');
    }
  }

  // Fallback 3: Textareas
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of Array.from(textareas)) {
    const val = textarea.value;
    if (val && (val.includes('#include') || val.includes('import ') || val.includes('class ') || val.includes('def ') || val.includes('public ')) && val.length > 30) {
      console.log('[GFG -> GitHub Sync] Extracted code using textarea fallback.');
      return val;
    }
  }

  return '';
}

function getLanguageFromDOM(): string {
  const selectors = [
    '.divider.text', // Dropdown active text
    '[class*="language"]',
    '.current-language',
    '#language',
    'select',
    '[class*="select"] [class*="text"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim().toLowerCase();
    if (text && text.length < 25) {
      if (text.includes('c++') || text.includes('cpp')) return 'cpp';
      if (text.includes('java')) return 'java';
      if (text.includes('python')) return 'python3';
      if (text.includes('javascript') || text.includes('js')) return 'javascript';
      if (text.includes('c#') || text.includes('csharp')) return 'csharp';
      if (text.includes('rust')) return 'rust';
      if (text.includes('go')) return 'go';
      if (text.includes('kotlin')) return 'kotlin';
      if (text.includes('c') && text.trim().length === 1) return 'c';
    }
  }

  // Fallback 2: Check page text for language keywords
  const bodyText = document.body.innerText;
  if (bodyText.includes('C++')) return 'cpp';
  if (bodyText.includes('Java')) return 'java';
  if (bodyText.includes('Python')) return 'python3';
  if (bodyText.includes('C#')) return 'csharp';

  return 'cpp'; // Default fallback
}

// Listen for response from MAIN world
window.addEventListener('GFG_SYNC_RES_EXTRACT', ((e: CustomEvent) => {
  const data = e.detail;
  console.log('[GFG -> GitHub Sync] Received response from page context code extraction:', data);
  
  let code = data?.code;
  let language = data?.language;

  // Fallback to DOM scraping if page context returned empty
  if (!code) {
    console.log('[GFG -> GitHub Sync] Page context memory extraction returned empty. Trying DOM fallback...');
    code = getCodeFromDOM();
    language = getLanguageFromDOM();
  }

  if (!code) {
    console.warn('[GFG -> GitHub Sync] No code retrieved from editor (Monaco or DOM).');
    return;
  }

  console.log('[GFG -> GitHub Sync] Successfully extracted code of length:', code.length, 'Language:', language);
  processSuccessfulSolve(code, language);
}) as EventListener);

async function processSuccessfulSolve(code: string, language: string) {
  const title = getProblemTitle();
  const url = window.location.href.split('?')[0]; // Strip query params
  const tags = getTopicTags();

  const settings = await chromeStorage.getAll();
  console.log('[GFG -> GitHub Sync] Processing solved problem details:', { title, url, tags, settings });

  if (settings.autoPush && settings.githubToken && settings.selectedRepo) {
    console.log('[GFG -> GitHub Sync] Triggering silent auto-push...');
    await handleAutoPush(settings, title, url, code, language, tags);
  } else if (settings.autoOpen) {
    console.log('[GFG -> GitHub Sync] Injecting visual modal overlay into GFG page...');
    injectModal(title, url, code, language, tags);
  } else {
    console.log('[GFG -> GitHub Sync] Both autoPush and autoOpen are disabled in settings. Skipping injection.');
  }
}

function getProblemTitle(): string {
  const selectors = [
    '.problems-layout__main-content h3',
    '.problems-layout__main-content h1',
    '.problem-tab__name',
    'h3.problem-tab__name',
    'h4.problem-tab__name',
    '[class*="problem-title"]',
    'h3'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) return text;
  }

  // Fallback to URL parsing
  const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
  if (match && match[1]) {
    return match[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return 'GeeksforGeeks Problem';
}

function getTopicTags(): string[] {
  const tags = new Set<string>();

  // Extract from tags on the page
  const tagElements = document.querySelectorAll('a[href*="/tag/"], a[href*="/problems/tag/"], .topic-tag');
  tagElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length < 30 && !text.includes('Companies')) {
      tags.add(text);
    }
  });

  return Array.from(tags);
}

function injectModal(title: string, url: string, code: string, lang: string, tags: string[]) {
  // Check if already injected
  if (document.getElementById('gfg-github-sync-root')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'gfg-github-sync-root';
  container.style.position = 'fixed';
  container.style.bottom = '24px';
  container.style.right = '24px';
  container.style.zIndex = '2147483647';

  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Stylesheet injection
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('gfg-github.css');
  shadowRoot.appendChild(link);

  const mountPoint = document.createElement('div');
  mountPoint.className = 'gfg-sync-modal-mount';
  shadowRoot.appendChild(mountPoint);

  document.body.appendChild(container);

  const root = ReactDOM.createRoot(mountPoint);
  const handleClose = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    React.createElement(InjectedModal, {
      problemTitle: title,
      problemUrl: url,
      scrapedCode: code,
      scrapedLanguage: lang,
      detectedTags: tags,
      onClose: handleClose
    })
  );
}

async function handleAutoPush(
  settings: any,
  title: string,
  url: string,
  code: string,
  lang: string,
  tags: string[]
) {
  // Suggest folder and filename
  let suggestedFolder = settings.recentFolders[0] || 'DSA';
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      if (settings.tagToFolder[tag]) {
        suggestedFolder = settings.tagToFolder[tag];
        break;
      }
    }
  }

  const fileName = suggestFilename(title, lang);
  const fullPath = suggestedFolder ? `${suggestedFolder}/${fileName}` : fileName;
  const commitMessage = `Solved: ${title} - GFG [Auto]`;
  const finalCode = addFileCommentHeader(code, title, url, lang);

  showToast('Auto-pushing solution to GitHub...', 'loading');

  try {
    const result = await githubApi.pushFile(
      settings.githubToken,
      settings.selectedRepo,
      settings.selectedBranch || 'main',
      fullPath,
      finalCode,
      commitMessage
    );

    if (result.success) {
      showToast('Successfully synced to GitHub!', 'success');
      // Save recent folders context
      const currentFolders = settings.recentFolders || [];
      const filtered = currentFolders.filter((f: any) => f !== suggestedFolder);
      const updated = [suggestedFolder, ...filtered].slice(0, 10);
      await chromeStorage.set({ recentFolders: updated });
    } else {
      showToast(`GitHub Push Failed: ${result.message}`, 'error');
    }
  } catch (err: any) {
    showToast(`GitHub Sync Error: ${err.message}`, 'error');
  }
}

function showToast(message: string, type: 'loading' | 'success' | 'error') {
  const existing = document.getElementById('gfg-sync-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'gfg-sync-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.zIndex = '2147483647';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.fontFamily = 'Inter, sans-serif';
  toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
  toast.style.transition = 'all 0.3s ease';

  if (type === 'loading') {
    toast.style.background = '#e0f2fe';
    toast.style.color = '#0369a1';
    toast.style.border = '1px solid #bae6fd';
  } else if (type === 'success') {
    toast.style.background = '#dcfce7';
    toast.style.color = '#15803d';
    toast.style.border = '1px solid #bbf7d0';
  } else {
    toast.style.background = '#fee2e2';
    toast.style.color = '#b91c1c';
    toast.style.border = '1px solid #fecaca';
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  if (type !== 'loading') {
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
