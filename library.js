// ORBIT Live Reply Library
// Saves and suggests replies based on user's approved responses

const LIBRARY_KEY = 'orbit_library';

async function getLibrary() {
  const result = await chrome.storage.local.get(LIBRARY_KEY);
  return result[LIBRARY_KEY] || [];
}

async function saveToLibrary(replyData) {
  const library = await getLibrary();
  
  const existingIndex = library.findIndex(entry => {
    return similarity(entry.replyText, replyData.replyText) >= 0.9;
  });
  
  if (existingIndex >= 0) {
    library[existingIndex].usedCount += 1;
    library[existingIndex].lastUsed = Date.now();
  } else {
    library.push({
      id: Date.now(),
      commentType: replyData.commentType,
      commentKeywords: replyData.commentKeywords,
      replyText: replyData.replyText,
      usedCount: 1,
      lastUsed: Date.now()
    });
  }
  
  await chrome.storage.local.set({ [LIBRARY_KEY]: library });
  console.log('ORBIT: Saved reply to library, total entries:', library.length);
  
  return library.length;
}

async function findLibraryMatch(commentType, keywords) {
  const library = await getLibrary();
  
  if (!library.length) return null;
  
  const matches = library.filter(entry => {
    if (entry.commentType !== commentType) return false;
    
    const matchingKeywords = entry.commentKeywords.filter(kw => 
      keywords.some(k => k.toLowerCase() === kw.toLowerCase())
    );
    
    return matchingKeywords.length >= 2;
  });
  
  if (matches.length === 0) return null;
  
  matches.sort((a, b) => b.usedCount - a.usedCount);
  
  return matches[0];
}

function similarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  let match = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s2.includes(s1[i])) match++;
  }
  
  return match / Math.max(s1.length, s2.length);
}

function extractKeywords(text, count = 3) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'i', 'my', 'to', 'do', 'in', 'of', 'for', 'and', 'or', 'but', 'on', 'at', 'by', 'with', 'have', 'has', 'was', 'are', 'be', 'this', 'that', 'from', 'so', 'just', 'can', 'not', 'no', 'yes', 'about', 'your', 'you', 'we', 'our', 'thanks', 'thank']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  const wordCounts = {};
  words.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);
  
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

async function getLibraryCount() {
  const library = await getLibrary();
  return library.length;
}
