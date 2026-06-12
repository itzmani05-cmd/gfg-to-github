// Background service worker

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open the options page on fresh install to configure GitHub sync
    chrome.runtime.openOptionsPage();
  }
});
