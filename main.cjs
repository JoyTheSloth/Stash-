const {
  app, BrowserWindow, clipboard, ipcMain, Tray, Menu,
  globalShortcut, nativeImage, shell, screen
} = require('electron');
const path = require('path');
const fs = require('fs');
const urlModule = require('url');

let mainWindow = null;
let tray = null;
let lastText = '';
let lastImageData = '';
let lastImageSize = { width: 0, height: 0 };
let lastImageBuffer = null;
let pollingInterval = null;

// ─── Database Cache & Persistence ─────────────────────────────────────────────
const dbPath = path.join(app.getPath('userData'), 'stash_db.json');
const MAX_ITEMS = 500;

let memoryCache = null;
let saveDebounceTimer = null;

function readDb() {
  if (memoryCache !== null) {
    return memoryCache;
  }
  if (!fs.existsSync(dbPath)) {
    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
    } catch {}
    memoryCache = [];
    return memoryCache;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    memoryCache = JSON.parse(raw);
  } catch {
    memoryCache = [];
  }
  return memoryCache;
}

function writeDb(data) {
  memoryCache = data.slice(0, MAX_ITEMS);
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(() => {
    try {
      const tempPath = dbPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(memoryCache, null, 2));
      fs.renameSync(tempPath, dbPath);
    } catch (e) {
      console.error('DB write failed:', e.message);
    }
  }, 200);
}

function flushDbSync() {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  if (memoryCache !== null) {
    try {
      const tempPath = dbPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(memoryCache, null, 2));
      fs.renameSync(tempPath, dbPath);
    } catch (e) {
      console.error('Flush DB failed:', e.message);
    }
  }
}

// ─── Classifier ──────────────────────────────────────────────────────────────
function classifyContent(text) {
  const t = text.trim();
  const lower = t.toLowerCase();

  // Emojis (contains only emojis, spaces, and modifiers)
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\s\u200d\uFE0F]+$/u;
  if (emojiRegex.test(t)) return 'Emoji';

  // Secrets / API keys
  if (/^sk-proj-[a-zA-Z0-9_-]{20,}/.test(t)) return 'API Key';
  if (/^sk-[a-zA-Z0-9]{32,}/.test(t)) return 'API Key';
  if (/^(ghp_|gho_|github_pat_)[a-zA-Z0-9]{20,}/.test(t)) return 'API Key';
  if (/^AIza[0-9A-Za-z-_]{35}/.test(t)) return 'API Key'; // Google API key
  if (/^[a-f0-9]{32,64}$/.test(t)) return 'API Key'; // Generic hex token
  if (/password|passwd|secret|token|apikey|api_key/i.test(lower) && t.length < 200) return 'Secret';

  // URLs
  if (/^https?:\/\//i.test(t)) return 'URL';

  // SQL (non-greedy)
  if (/\b(select\s+[^\n]{1,100}\bfrom|insert\s+into|update\s+[^\n]{1,100}\bset|delete\s+from|create\s+table|drop\s+table|alter\s+table)\b/i.test(t)) return 'SQL';

  // JSON
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { JSON.parse(t); return 'JSON'; } catch {}
  }

  // Shell commands
  if (/^(npm|yarn|pnpm|npx|node|git|docker|kubectl|cargo|pip|pip3|python|python3|bash|sh|curl|wget|ssh|cd|ls|mkdir|rm|cp|mv|cat|echo|export|source|chmod|sudo|apt|brew)\s/.test(t)) return 'Command';

  // AI Prompt templates / prompts
  const promptPrefixes = ['act as', 'you are a', 'write a', 'generate ', 'explain ', 'summarize ', 'create a ', 'prompt:', 'system prompt', 'user prompt', 'design a', 'how to '];
  if (promptPrefixes.some(p => lower.startsWith(p)) || /prompt:|system prompt|user prompt/i.test(t)) return 'Prompts';

  // Code (multi-line or contains syntax patterns)
  if (t.includes('\n') && /[{};()=>]/.test(t)) return 'Code';
  if (/\b(const|let|var|function|class|import|export|return|async|await|def|fn|pub|use|struct|interface|type|package|func|go|void|public|private|protected|namespace|using|std|include|define)\b/.test(t)) return 'Code';

  // File paths
  if (/^([a-zA-Z]:\\|\/[a-zA-Z])/.test(t) || /^\.\/|^\.\.\//.test(t)) return 'Path';

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email';

  return 'Text';
}

function generateSmartTitle(text, category) {
  const t = text.trim();
  switch (category) {
    case 'API Key': {
      if (t.startsWith('sk-proj-')) return 'OpenAI Project API Key';
      if (t.startsWith('sk-')) return 'OpenAI Secret Key';
      if (t.startsWith('ghp_')) return 'GitHub Personal Access Token';
      if (t.startsWith('AIza')) return 'Google API Key';
      return 'API Key / Token';
    }
    case 'Secret': return 'Sensitive Secret / Password';
    case 'URL': {
      try {
        const u = new urlModule.URL(t);
        return `${u.hostname}${u.pathname !== '/' ? u.pathname : ''}`.slice(0, 60);
      } catch { return 'Website URL'; }
    }
    case 'SQL': {
      const match = t.match(/\b(select|insert|update|delete|create|drop|alter)\b/i);
      return match ? `${match[1].toUpperCase()} Query` : 'SQL Query';
    }
    case 'JSON': {
      try {
        const parsed = JSON.parse(t);
        const keys = Object.keys(parsed);
        if (keys.length) return `JSON · ${keys.slice(0, 3).join(', ')}`;
      } catch {}
      return 'JSON Data';
    }
    case 'Command': {
      const cmd = t.split(/\s+/)[0];
      const sub = t.split(/\s+/)[1] || '';
      return `${cmd} ${sub}`.trim().slice(0, 55);
    }
    case 'Code': {
      const first = t.split('\n')[0].trim().replace(/^(\/\/|#|\/\*|\*)/, '').trim();
      return first.slice(0, 60) || 'Code Snippet';
    }
    case 'Prompts': return 'AI Prompt Template';
    case 'Path': return `Path: ${path.basename(t)}`;
    case 'Email': return `Email: ${t}`;
    case 'Emoji': return `Emoji Glyphs: ${t}`;
    default: {
      const words = t.split(/\s+/).slice(0, 6).join(' ');
      return words.length < t.length ? `${words}…` : words;
    }
  }
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.handle('get_clipboard_items', () => {
  const items = readDb();
  // Refresh relative timestamps on fetch
  return items.map(item => ({
    ...item,
    createdAt: item.timestamp ? timeAgo(item.timestamp) : item.createdAt
  }));
});

ipcMain.handle('toggle_favorite', (_, { id, isFavorite }) => {
  const items = readDb();
  writeDb(items.map(item => item.id === id ? { ...item, isFavorite } : item));
  return { success: true };
});

ipcMain.handle('delete_item', (_, { id }) => {
  writeDb(readDb().filter(item => item.id !== id));
  return { success: true };
});

ipcMain.handle('copy_to_clipboard', (_, { content }) => {
  if (content.startsWith('data:image/')) {
    const img = nativeImage.createFromDataURL(content);
    clipboard.writeImage(img);
    lastImageData = content;
  } else {
    clipboard.writeText(content);
    lastText = content; // Prevent re-capturing what we just pasted
  }
  return { success: true };
});

ipcMain.handle('paste_item', async (_, { content }) => {
  if (content.startsWith('data:image/')) {
    const img = nativeImage.createFromDataURL(content);
    clipboard.writeImage(img);
    lastImageData = content;
  } else {
    clipboard.writeText(content);
    lastText = content;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  setTimeout(() => {
    try {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`, (err) => {
          if (err) console.error('PowerShell SendKeys paste failed:', err);
        });
      }
    } catch (e) {
      console.error('Direct paste command failed:', e);
    }
  }, 120);

  return { success: true };
});

ipcMain.handle('clear_all', () => {
  writeDb([]);
  return { success: true };
});

ipcMain.handle('add_item', (_, { content }) => {
  const text = content.trim();
  if (!text) return { success: false };
  
  const category = classifyContent(text);
  const title = generateSmartTitle(text, category);
  const isEncrypted = category === 'API Key' || category === 'Secret';
  const timestamp = Date.now();
  
  const newItem = {
    id: timestamp.toString(),
    content: text,
    category,
    title,
    sourceApp: 'Stash Pad',
    isFavorite: false,
    isEncrypted,
    timestamp,
    createdAt: 'Just now'
  };
  
  const existing = readDb().filter(item => item.content !== text);
  writeDb([newItem, ...existing]);
  return { success: true, item: newItem };
});

ipcMain.handle('open_db_folder', () => {
  shell.openPath(path.dirname(dbPath));
  return { success: true };
});

ipcMain.handle('open_external', (_evt, { url }) => {
  if (url) shell.openExternal(url);
  return { success: true };
});

// ─── Clipboard Monitor ───────────────────────────────────────────────────────
function startClipboardMonitor() {
  // Prime memory cache on startup
  readDb();

  // Initialize from current clipboard so we don't capture stale content on start
  lastText = clipboard.readText().trim();
  
  const formats = clipboard.availableFormats();
  if (formats.some(f => f.includes('image'))) {
    const initialImg = clipboard.readImage();
    if (!initialImg.isEmpty()) {
      lastImageSize = initialImg.getSize();
      lastImageBuffer = initialImg.toBitmap();
      lastImageData = initialImg.toDataURL();
    }
  }

  pollingInterval = setInterval(() => {
    // 1. Check for Image copy (only if clipboard contains image formats)
    const currentFormats = clipboard.availableFormats();
    const hasImageFormat = currentFormats.some(f => f.includes('image'));
    if (hasImageFormat) {
      const img = clipboard.readImage();
      if (!img.isEmpty()) {
        const size = img.getSize();
        const dimensionsChanged = size.width !== lastImageSize.width || size.height !== lastImageSize.height;
        
        let changed = dimensionsChanged;
        let imgBuf = null;
        
        if (!changed) {
          imgBuf = img.toBitmap();
          changed = !lastImageBuffer || Buffer.compare(imgBuf, lastImageBuffer) !== 0;
        }
        
        if (changed) {
          if (!imgBuf) imgBuf = img.toBitmap();
          lastImageSize = size;
          lastImageBuffer = imgBuf;
          
          const dataUrl = img.toDataURL();
          lastImageData = dataUrl;
          const timestamp = Date.now();

          const newItem = {
            id: timestamp.toString(),
            content: dataUrl,
            category: 'Image',
            title: `Image Preview (${size.width}x${size.height})`,
            sourceApp: 'System',
            isFavorite: false,
            isEncrypted: false,
            timestamp,
            createdAt: 'Just now'
          };

          const existing = readDb().filter(item => item.content !== dataUrl);
          writeDb([newItem, ...existing]);

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('clipboard-changed', newItem);
          }
          return;
        }
      }
    }

    // 2. Check for Text copy
    const text = clipboard.readText().trim();
    if (!text || text === lastText) return;
    lastText = text;

    // Skip if too short (single char or whitespace-only)
    if (text.length < 2) return;

    const category = classifyContent(text);
    const title = generateSmartTitle(text, category);
    const isEncrypted = category === 'API Key' || category === 'Secret';
    const timestamp = Date.now();

    const newItem = {
      id: timestamp.toString(),
      content: text,
      category,
      title,
      sourceApp: 'System',
      isFavorite: false,
      isEncrypted,
      timestamp,
      createdAt: 'Just now'
    };

    // Write to DB — deduplicate by content
    const existing = readDb().filter(item => item.content !== text);
    writeDb([newItem, ...existing]);

    // Push to renderer in real-time
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard-changed', newItem);
    }
  }, 600);
}

// ─── Window ──────────────────────────────────────────────────────────────────
// Helper to position window at the bottom-right of primary display
function positionWindowAtBottomRight(win) {
  if (!win) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  
  const winWidth = 390;
  const winHeight = 675;
  
  const x = Math.round(workArea.x + workArea.width - winWidth - 12);
  const y = Math.round(workArea.y + workArea.height - winHeight - 12);
  
  win.setBounds({
    width: winWidth,
    height: winHeight,
    x: x,
    y: y
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 675,
    minWidth: 360,
    minHeight: 500,
    maxWidth: 1000,
    maxHeight: 750,
    show: false,
    frame: true,
    title: 'Stash',
    icon: path.join(__dirname, 'icons', 'icon.png'),
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  // Remove default menu bar
  Menu.setApplicationMenu(null);

  const isDev = !app.isPackaged;

  if (isDev) {
    function loadApp() {
      mainWindow.loadURL('http://localhost:1420').catch(() => {
        setTimeout(loadApp, 800);
      });
    }
    loadApp();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Position at bottom-right right before showing
  positionWindowAtBottomRight(mainWindow);
  mainWindow.show();



  mainWindow.on('closed', () => { mainWindow = null; });

  // Hide to tray instead of closing when X is pressed
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function toggleWindow() {
  if (!mainWindow) { createWindow(); return; }
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
  } else {
    positionWindowAtBottomRight(mainWindow);
    mainWindow.show();
    mainWindow.focus();
  }
}

// ─── Tray ────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'icons', 'icon.png');
  let trayIcon;
  try {
    if (fs.existsSync(iconPath) && fs.statSync(iconPath).size > 100) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } else {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Stash', click: () => { mainWindow ? (positionWindowAtBottomRight(mainWindow), mainWindow.show(), mainWindow.focus()) : createWindow(); } },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Open Data Folder', click: () => shell.openPath(path.dirname(dbPath)) },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('Stash – AI Clipboard Memory  (Alt+Space)');
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  startClipboardMonitor();

  // Global hotkey: Alt+Space to toggle window
  globalShortcut.register('Alt+Space', toggleWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  flushDbSync();
  globalShortcut.unregisterAll();
  if (pollingInterval) clearInterval(pollingInterval);
});

app.on('window-all-closed', () => {
  // Don't quit — keep running in tray
});
