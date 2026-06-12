# GFG → GitHub Sync 🚀

**GFG → GitHub Sync** is a professional Chrome Extension (Manifest V3) built with React, Tailwind CSS, and Zustand. It eliminates the repetitive copy-paste workflow by automatically detecting successfully solved GeeksforGeeks problems and prompting you to push the code directly to a GitHub repository of your choice in one click.

---

## 🌟 Features

- **⚡ Instant Success Detection**: Monitors submissions in real-time. Detects "Correct Answer" / "Problem Solved Successfully" verdicts instantly using a MutationObserver and background polling.
- **🔍 Multi-Editor DOM Scraping**: Resilient scraping fallbacks that extract code from Monaco Editor memory space as well as Ace Editor (`.ace_line`) and CodeMirror.
- **📁 Smart Folder Suggestions**: Automatically extracts GFG problem tags (e.g., `Arrays`, `Trees`, `Dynamic Programming`) and associates them with your directory structures. Suggests folders automatically based on your push history.
- **🛡️ Style Isolation (Shadow DOM)**: The GFG-page visual modal is injected inside a Shadow DOM, keeping extension styles 100% isolated so they never break GFG's page layout.
- **⚙️ Advanced Configurations**: A dedicated Settings Options Page and toolbar popup to select default repositories, default branches, toggle auto-push mode, and edit your folder prediction pool.
- **🔒 Direct & Secure PAT Auth**: Communication is completely client-side. The extension stores your GitHub Personal Access Token locally inside Chrome storage (`chrome.storage.local`), making no external proxy server requests.

---

## 🛠️ Tech Stack

- **Frontend UI**: React + Tailwind CSS (Stripe/Linear-style minimalist design)
- **State Management**: Zustand
- **Extension Standard**: Manifest V3
- **Storage**: Chrome Storage API (with LocalStorage fallbacks for local UI testing)
- **API Communication**: GitHub REST API v3
- **Bundler**: Vite + Rollup (Optimized production builds with tree-shaking)

---

## 📦 Directory Structure

```
gfg-github-sync/
├── public/
│   ├── manifest.json       # Extension Manifest V3 configuration
│   └── icons/              # Extension logo assets (16px, 32px, 48px, 128px)
├── src/
│   ├── popup/              # Toolbar popup UI (React + Tailwind)
│   ├── options/            # Full-page Settings page (React + Tailwind)
│   ├── content/            # DOM scanners, event listeners, and Injected UI overlays
│   ├── background/         # service worker
│   ├── services/           # GitHub REST API client
│   ├── storage/            # Chrome storage utilities and Zustand store
│   └── utils/              # Filename formatting and code comment header helpers
├── vite.config.ts          # Build configuration for React interfaces
└── vite.config.scripts.ts  # Build configuration for service workers and content scripts
```

---

## 🚀 Installation Guide

To run the extension locally in developer mode:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/gfg-github-sync.git
   cd gfg-github-sync
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Build the Production Bundle**:
   ```bash
   npm run build
   ```
4. **Load into Google Chrome**:
   - Navigate to `chrome://extensions/` in Chrome.
   - Toggle on **"Developer mode"** in the top-right corner.
   - Click the **"Load unpacked"** button in the top-left.
   - Select the `dist/` folder generated inside the project directory.

---

## ⚙️ Configuration & Syncing Guide

1. **Configure GitHub Auth**:
   - Click the extension icon in your Chrome toolbar.
   - Click **"Generate Token"** (redirects you to GitHub token setup with the required `repo` scope).
   - Generate, copy, and paste your token into the popup input box and click **"Connect Account"**.
   - Select your default repository and branch.
2. **Solve GFG Problems**:
   - Navigate to any GeeksforGeeks coding problem (e.g. [Reverse an Array](https://www.geeksforgeeks.org/problems/reverse-an-array/1)).
   - Solve the problem and click **Submit**.
3. **Push Solution**:
   - Once your solution is accepted, the visual sync card will slide into the bottom-right corner.
   - Check/modify the directory folder, filename, or commit message, and click **"Push Code"**!

---
