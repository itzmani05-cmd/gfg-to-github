// Runs in MAIN world (page context)
// Has access to window.monaco

console.log('[GFG -> GitHub Sync] Main-world content script successfully injected.');

(function () {
  function getMonacoData() {
    try {
      if (
        typeof (window as any).monaco !== 'undefined' &&
        (window as any).monaco.editor &&
        typeof (window as any).monaco.editor.getModels === 'function'
      ) {
        const models = (window as any).monaco.editor.getModels();
        if (models && models.length > 0) {
          // Find first model with content
          for (const model of models) {
            const val = model.getValue();
            if (val && val.trim().length > 0) {
              const langId = model.getLanguageId
                ? model.getLanguageId()
                : (model.getModeId ? model.getModeId() : '');
              return { code: val, language: langId };
            }
          }
          // Fallback to first model
          const model = models[0];
          const langId = model.getLanguageId
            ? model.getLanguageId()
            : (model.getModeId ? model.getModeId() : '');
          return { code: model.getValue(), language: langId };
        }
      }
    } catch (e) {
      console.error('[GFG -> GitHub Sync] Error extracting code from Monaco:', e);
    }
    return null;
  }

  // Listen for request from isolated script
  window.addEventListener('GFG_SYNC_REQ_EXTRACT', () => {
    const data = getMonacoData();
    // Dispatch response
    window.dispatchEvent(
      new CustomEvent('GFG_SYNC_RES_EXTRACT', {
        detail: data || { code: '', language: '' }
      })
    );
  });
})();
