export const languageExtensions: Record<string, { ext: string; name: string }> = {
  cpp: { ext: '.cpp', name: 'C++' },
  cpp14: { ext: '.cpp', name: 'C++' },
  cpp20: { ext: '.cpp', name: 'C++' },
  'c++': { ext: '.cpp', name: 'C++' },
  java: { ext: '.java', name: 'Java' },
  python: { ext: '.py', name: 'Python' },
  python3: { ext: '.py', name: 'Python' },
  py: { ext: '.py', name: 'Python' },
  javascript: { ext: '.js', name: 'JavaScript' },
  js: { ext: '.js', name: 'JavaScript' },
  c: { ext: '.c', name: 'C' },
  csharp: { ext: '.cs', name: 'C#' },
  cs: { ext: '.cs', name: 'C#' },
  rust: { ext: '.rs', name: 'Rust' },
  kotlin: { ext: '.kt', name: 'Kotlin' },
  go: { ext: '.go', name: 'Go' },
  swift: { ext: '.swift', name: 'Swift' },
};

export function getLanguageMeta(langId: string): { ext: string; name: string } {
  const normalized = langId.toLowerCase().trim();
  return languageExtensions[normalized] || { ext: '.txt', name: normalized || 'Unknown' };
}

export function suggestFilename(title: string, langId: string): string {
  // Convert "Reverse an Array" -> "reverse_array"
  let sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '') // remove special chars
    .trim()
    .replace(/[\s-_]+/g, '_'); // replace spaces/dashes/underscores with a single underscore

  const meta = getLanguageMeta(langId);
  return `${sanitized}${meta.ext}`;
}

export function addFileCommentHeader(content: string, title: string, url: string, langId: string): string {
  const meta = getLanguageMeta(langId);
  const ext = meta.ext;

  // Determine comment symbol
  let commentSymbol = '//';
  if (ext === '.py' || ext === '.sh' || ext === '.pl' || ext === '.rb') {
    commentSymbol = '#';
  }

  const header = [
    `${commentSymbol} User solved: ${title}`,
    `${commentSymbol} Problem URL: ${url}`,
    `${commentSymbol} Language: ${meta.name}`,
    `${commentSymbol} Synced using GFG -> GitHub Sync Chrome Extension`,
    ''
  ].join('\n');

  // Prevent double header addition
  if (content.includes('Synced using GFG -> GitHub Sync')) {
    return content;
  }

  return header + '\n' + content;
}
