import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, KeyRound, Copy, Check, Database, FileText,
  Clock, Trash2, Eye, EyeOff, Terminal, Bookmark, Globe,
  Laptop, X, FolderOpen, Pin, Mail, Hash,
  Code2, Home, MessageSquare, Star, Folder,
  BarChart3, Settings, Send, ChevronRight,
  Sparkles, CheckCircle2, ShieldAlert, Layers,
  LayoutGrid, LayoutList, Library, Activity, Command, Cpu, Lock,
  Plus, ChevronDown, ChevronUp, Mic, HelpCircle, RotateCw,
  Smile, Image as ImageIcon, Grid, Menu, Quote, Github, Info,
  Linkedin, Upload, Download, CornerDownLeft, Minus, Square
} from 'lucide-react';
import SpotlightCard from './components/SpotlightCard';
import { DEV_KNOWLEDGE_BASE } from './knowledgeBase';

interface ClipboardItem {
  id: string;
  content: string;
  category: string;
  title: string;
  sourceApp: string;
  isFavorite: boolean;
  isEncrypted: boolean;
  createdAt: string;
  timestamp?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'stash';
  text: string;
  timestamp: number;
  matchedItems?: ClipboardItem[];
}

type InvokeType = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
type ListenType = (event: string, handler: (e: { payload: unknown }) => void) => Promise<() => void>;

let invoke: InvokeType | null = null;
let listen: ListenType | null = null;

async function loadRuntime() {
  if (typeof window !== 'undefined' && (window as any).electron) {
    invoke = (window as any).electron.invoke;
    listen = (window as any).electron.listen;
    return 'electron';
  }
  return null;
}

const CATEGORIES = ['All', 'Favorites', 'Stash Pad', 'Secrets', 'Code', 'Prompts', 'Command', 'SQL', 'URL', 'JSON', 'Path', 'Email', 'Emoji', 'Image', 'Text'];

const getCategoryIcon = (cat: string, size = 'w-3.5 h-3.5') => {
  switch (cat) {
    case 'Stash Pad': return <Pin className={`${size} text-[#A88CFF] rotate-[30deg]`} />;
    case 'API Key': return <KeyRound className={`${size} text-[#A88CFF]`} />;
    case 'Secret': return <KeyRound className={`${size} text-red-400`} />;
    case 'URL': return <Globe className={`${size} text-emerald-400`} />;
    case 'Code': return <Code2 className={`${size} text-blue-400`} />;
    case 'Prompts': return <Sparkles className={`${size} text-indigo-400`} />;
    case 'Command': return <Terminal className={`${size} text-purple-400`} />;
    case 'SQL': return <Database className={`${size} text-cyan-400`} />;
    case 'JSON': return <Hash className={`${size} text-orange-400`} />;
    case 'Path': return <FolderOpen className={`${size} text-yellow-400`} />;
    case 'Email': return <Mail className={`${size} text-pink-400`} />;
    case 'Emoji': return <Smile className={`${size} text-amber-400`} />;
    case 'Image': return <ImageIcon className={`${size} text-teal-400`} />;
    default: return <FileText className={`${size} text-zinc-400`} />;
  }
};

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'Stash Pad': return 'bg-[#7C5CFF]';
    case 'API Key': return 'bg-[#7C5CFF]';
    case 'Secret': return 'bg-red-500';
    case 'URL': return 'bg-emerald-500';
    case 'Code': return 'bg-blue-500';
    case 'Prompts': return 'bg-indigo-500';
    case 'Command': return 'bg-purple-500';
    case 'SQL': return 'bg-cyan-500';
    case 'JSON': return 'bg-orange-500';
    case 'Path': return 'bg-yellow-500';
    case 'Email': return 'bg-pink-500';
    case 'Emoji': return 'bg-amber-500';
    case 'Image': return 'bg-teal-500';
    default: return 'bg-zinc-600';
  }
};

const getCategoryBorderColor = (cat: string) => {
  switch (cat) {
    case 'Stash Pad': return 'border-l-[#7C5CFF]';
    case 'API Key': return 'border-l-[#7C5CFF]';
    case 'Secret': return 'border-l-red-500';
    case 'URL': return 'border-l-emerald-500';
    case 'Code': return 'border-l-blue-500';
    case 'Prompts': return 'border-l-indigo-500';
    case 'Command': return 'border-l-purple-500';
    case 'SQL': return 'border-l-cyan-500';
    case 'JSON': return 'border-l-orange-500';
    case 'Path': return 'border-l-yellow-500';
    case 'Email': return 'border-l-pink-500';
    case 'Emoji': return 'border-l-amber-500';
    case 'Image': return 'border-l-teal-500';
    default: return 'border-l-zinc-650';
  }
};

const getCategoryGlow = (cat: string) => {
  switch (cat) {
    case 'Stash Pad': return 'shadow-[#7C5CFF]/15 hover:border-[#7C5CFF]/50';
    case 'API Key': return 'shadow-[#7C5CFF]/5 hover:border-[#7C5CFF]/30';
    case 'Secret': return 'shadow-red-500/5 hover:border-red-500/30';
    case 'URL': return 'shadow-emerald-500/5 hover:border-emerald-500/30';
    case 'Code': return 'shadow-blue-500/5 hover:border-blue-500/30';
    case 'Prompts': return 'shadow-indigo-500/5 hover:border-indigo-500/30';
    case 'Command': return 'shadow-purple-500/5 hover:border-purple-500/30';
    case 'SQL': return 'shadow-cyan-500/5 hover:border-cyan-500/30';
    case 'JSON': return 'shadow-orange-500/5 hover:border-orange-500/30';
    case 'Path': return 'shadow-yellow-500/5 hover:border-yellow-500/30';
    case 'Email': return 'shadow-pink-500/5 hover:border-pink-500/30';
    case 'Emoji': return 'shadow-amber-500/5 hover:border-amber-500/30';
    case 'Image': return 'shadow-teal-500/5 hover:border-teal-500/30';
    default: return 'shadow-zinc-500/5 hover:border-zinc-700';
  }
};

const getCategorySpotlightColor = (cat: string) => {
  switch (cat) {
    case 'Stash Pad': return 'rgba(124, 92, 255, 0.12)';
    case 'API Key': return 'rgba(124, 92, 255, 0.06)';
    case 'Secret': return 'rgba(239, 68, 68, 0.06)';
    case 'URL': return 'rgba(16, 185, 129, 0.06)';
    case 'Code': return 'rgba(59, 130, 246, 0.06)';
    case 'Prompts': return 'rgba(99, 102, 241, 0.06)';
    case 'Command': return 'rgba(168, 85, 247, 0.06)';
    case 'SQL': return 'rgba(6, 182, 212, 0.06)';
    case 'JSON': return 'rgba(249, 115, 22, 0.06)';
    case 'Path': return 'rgba(234, 179, 8, 0.06)';
    case 'Email': return 'rgba(236, 72, 153, 0.06)';
    case 'Emoji': return 'rgba(245, 158, 11, 0.06)';
    case 'Image': return 'rgba(20, 184, 166, 0.06)';
    default: return 'rgba(124, 92, 255, 0.06)';
  }
};

const classifyContent = (text: string) => {
  const t = text.trim();
  if (t.startsWith('data:image/') || t.includes('<img ') || t.startsWith('<img')) return 'Image';
  const lower = t.toLowerCase();

  // Emojis
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\s\u200d\uFE0F]+$/u;
  if (emojiRegex.test(t)) return 'Emoji';

  // API Keys / Tokens / Secrets
  if (/^(gsk_[a-zA-Z0-9_-]{20,}|gsk-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9_-]{30,}|ghp_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]{20}|aws_secret_access_key|xox[baprs]-[a-zA-Z0-9-]+|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/.test(t)) return 'API Key';
  if (/groq|grok|openai|gemini|api[_-]?key|secret|private_key|token|access_key|password/i.test(t) && t.length < 300) return 'API Key';

  // URLs
  if (/^https?:\/\/[^\s]+/.test(t) || /^www\.[^\s]+\.[^\s]+/.test(t)) return 'URL';

  // SQL queries
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|TRUNCATE)\b/i.test(t)) return 'SQL';

  // JSON
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { JSON.parse(t); return 'JSON'; } catch {}
  }

  // Shell commands
  if (/^(npm|yarn|pnpm|npx|node|git|docker|kubectl|cargo|pip|pip3|python|python3|bash|sh|curl|wget|ssh|cd|ls|mkdir|rm|cp|mv|cat|echo|export|source|chmod|sudo|apt|brew)\s/.test(t)) return 'Command';

  // Code
  if (t.includes('\n') && /[{};()=>]/.test(t)) return 'Code';
  if (/\b(const|let|var|function|class|import|export|return|async|await|def|fn|pub|use|struct|interface|type|package|func|go|void|public|private|protected)\b/.test(t)) return 'Code';

  // File paths
  if (/^([a-zA-Z]:\\|\/[a-zA-Z])/.test(t) || /^\.\/|^\.\.\//.test(t)) return 'Path';

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email';

  return 'Text';
};

const isImageItem = (item: ClipboardItem) => 
  item.category === 'Image' || item.content.startsWith('data:image') || item.content.includes('<img ');

const getItemSizeText = (item: ClipboardItem) => {
  if (isImageItem(item)) {
    if (item.content.includes('<img ')) {
      const imgMatches = item.content.match(/src="([^"]+)"/g) || [];
      const count = imgMatches.length || 1;
      let totalBytes = 0;
      imgMatches.forEach(m => {
        const src = m.replace(/^src="/, '').replace(/"$/, '');
        const base64Data = src.split(',')[1] || src;
        totalBytes += Math.floor((base64Data.length * 3) / 4);
      });
      if (totalBytes < 1024) return `${count} Images (${totalBytes} B)`;
      if (totalBytes < 1024 * 1024) return `${count} Images (${(totalBytes / 1024).toFixed(1)} KB)`;
      return `${count} Images (${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`;
    }
    if (item.content.startsWith('data:image')) {
      const base64Data = item.content.split(',')[1] || item.content;
      const bytes = Math.floor((base64Data.length * 3) / 4);
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return 'Image';
  }
  return `${item.content.length.toLocaleString()} chars`;
};



function Mosaic({ color = '#ba31cc', size = 'small', text = '', textColor = '' }: any) {
  const sizePx = size === 'small' ? 24 : size === 'medium' ? 36 : 48;
  const gap = size === 'small' ? 2 : size === 'medium' ? 3 : 4;
  
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 inline-flex">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mosaic-blink {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .mosaic-box {
          animation: mosaic-blink 1.2s infinite ease-in-out;
          border-radius: 4px;
        }
      `}} />
      <div 
        style={{ 
          width: sizePx, 
          height: sizePx, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: `${gap}px` 
        }}
      >
        <div className="mosaic-box" style={{ backgroundColor: color, animationDelay: '0s' }} />
        <div className="mosaic-box" style={{ backgroundColor: color, animationDelay: '0.3s' }} />
        <div className="mosaic-box" style={{ backgroundColor: color, animationDelay: '0.9s' }} />
        <div className="mosaic-box" style={{ backgroundColor: color, animationDelay: '0.6s' }} />
      </div>
      {text && (
        <span className="text-[11px] font-medium" style={{ color: textColor || color }}>
          {text}
        </span>
      )}
    </div>
  );
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'ask' | 'collections' | 'insights' | 'about' | 'settings' | 'notes' | 'guide'>('home');

  // Core Data
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [runtime, setRuntime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showWorkspaceToast, setShowWorkspaceToast] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string; show: boolean }>({ title: '', desc: '', show: false });
  const showToast = (title: string, desc: string) => {
    setToast({ title, desc, show: true });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
  };
  const searchRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Memory Retention policy (3 days, 7 days, 0 = forever)
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    return Number(localStorage.getItem('stash_retention_days') || '0');
  });

  // Gemini Search Bar & Mode States
  const [aiModel, setAiModel] = useState<'Flash' | 'Pro'>('Flash');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compact' | 'grid' | 'grid3'>('list');

  // Stash Copy (Bulk Copy) feature
  const [stashCopyIds, setStashCopyIds] = useState<string[]>([]);
  const [isStashItActive, setIsStashItActive] = useState<boolean>(false);
  const [stashSeparator, setStashSeparator] = useState<'double_newline' | 'newline' | 'space' | 'comma'>('double_newline');

  // AI Provider & API Keys state (OpenAI, Gemini, Groq, Mistral)
  const [useApiKey, setUseApiKey] = useState<boolean>(() => localStorage.getItem('stash_use_api_keys') === 'true');
  const [activeProvider, setActiveProvider] = useState<string>(() => localStorage.getItem('stash_active_provider') || 'openai');
  const [openaiKey, setOpenaiKey] = useState<string>(() => localStorage.getItem('stash_openai_key') || '');
  const [geminiKey, setGeminiKey] = useState<string>(() => localStorage.getItem('stash_gemini_key') || '');
  const [groqKey, setGroqKey] = useState<string>(() => localStorage.getItem('stash_groq_key') || localStorage.getItem('stash_grok_key') || '');
  const [mistralKey, setMistralKey] = useState<string>(() => localStorage.getItem('stash_mistral_key') || '');

  const callAiApi = async (provider: string, apiKey: string, userQuery: string, itemsContext: string): Promise<string> => {
    const systemPrompt = `You are Stash AI, a developer clipboard assistant. Answer the user concisely and accurately.
Stash Clipboard Memories Context:
${itemsContext}`;

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userQuery }
            ]
          })
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
        if (data.error?.message) return `[OpenAI Error]: ${data.error.message}`;
      } else if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }]
            }]
          })
        });
        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text;
        if (data.error?.message) return `[Gemini Error]: ${data.error.message}`;
      } else if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userQuery }
            ]
          })
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
        if (data.error?.message) return `[Groq Error]: ${data.error.message}`;
      } else if (provider === 'mistral') {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userQuery }
            ]
          })
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
        if (data.error?.message) return `[Mistral Error]: ${data.error.message}`;
      }
    } catch (err: any) {
      return `[API Error]: ${err.message || 'Network error communicating with AI provider.'}`;
    }
    return "Could not retrieve response from selected AI provider API.";
  };

  const toggleStashCopy = (id: string) => {
    setStashCopyIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleStashCopy = async () => {
    if (stashCopyIds.length === 0) return;
    
    const selectedItems = items.filter(item => stashCopyIds.includes(item.id));
    const count = selectedItems.length;
    
    let separatorStr = '\n\n';
    if (stashSeparator === 'newline') separatorStr = '\n';
    else if (stashSeparator === 'space') separatorStr = ' ';
    else if (stashSeparator === 'comma') separatorStr = ', ';

    const allImages = selectedItems.every(isImageItem);
    const hasImages = selectedItems.some(isImageItem);

    let combinedContent = '';
    if (allImages) {
      if (count === 1) {
        combinedContent = selectedItems[0].content;
      } else {
        combinedContent = selectedItems.map(item => {
          let src = item.content;
          if (item.content.includes('<img ')) {
            const match = item.content.match(/src="([^"]+)"/);
            if (match) src = match[1];
          }
          return `<img src="${src}" style="max-width:100%; border-radius:8px;" />`;
        }).join('<br/>');
      }
    } else if (hasImages) {
      combinedContent = selectedItems.map(item => {
        if (isImageItem(item)) {
          let src = item.content;
          if (item.content.includes('<img ')) {
            const match = item.content.match(/src="([^"]+)"/);
            if (match) src = match[1];
          }
          return `<img src="${src}" style="max-width:100%; border-radius:8px;" />`;
        }
        return `<div>${item.content}</div>`;
      }).join('<br/>');
    } else {
      combinedContent = selectedItems.map(item => item.content).join(separatorStr);
    }

    const combinedCategory = (allImages || hasImages) ? 'Image' : classifyContent(combinedContent);
    const combinedTitle = allImages 
      ? `Multi-Stash (${count} images combined)` 
      : `Multi-Stash (${count} items combined)`;

    // 1. Copy combined text/image to system clipboard
    if (invoke) {
      try { await invoke('copy_to_clipboard', { content: combinedContent }); }
      catch { navigator.clipboard.writeText(combinedContent).catch(() => {}); }
    } else {
      navigator.clipboard.writeText(combinedContent).catch(() => {});
    }

    // 2. Create combined memory item for UI & DB persistence
    const timestamp = Date.now();
    const combinedItem: ClipboardItem = {
      id: timestamp.toString(),
      content: combinedContent,
      category: combinedCategory,
      title: combinedTitle,
      sourceApp: 'Stash Copy Queue',
      isFavorite: false,
      isEncrypted: false,
      timestamp,
      createdAt: 'Just now'
    };

    // 3. Update UI list state immediately
    setItems(prev => [combinedItem, ...prev]);

    // 4. Save to IPC DB backend
    if (invoke) {
      invoke('add_item', { 
        content: combinedContent, 
        category: combinedCategory, 
        title: combinedTitle 
      }).catch(() => {});
    }

    // 5. Show clear success feedback state before clearing queue
    setCopiedId('stash_copy_success');
    showToast("Stash Copied!", `Combined ${count} items & copied to clipboard!`);

    setTimeout(() => {
      setCopiedId(null);
      setStashCopyIds([]);
      setIsStashItActive(false);
    }, 1200);
  };

  // Local Q&A / Search State
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'stash',
      text: "Hello! I am Stash, your local developer Q&A and clipboard search engine. You can search offline or enable live LLM API keys (OpenAI, Gemini, Grok, Mistral) in Settings!",
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Collections State
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [staleItemsToClear, setStaleItemsToClear] = useState<ClipboardItem[]>([]);

  // Sticky Notes States
  const [stickyNote, setStickyNote] = useState(() => localStorage.getItem('stash_sticky_note') || '');
  const [copiedNote, setCopiedNote] = useState(false);

  useEffect(() => {
    localStorage.setItem('stash_sticky_note', stickyNote);
  }, [stickyNote]);

  // Auto-clear helper for memory retention policy
  const autoClearOldItems = useCallback(async (allHistory: ClipboardItem[]) => {
    const policy = Number(localStorage.getItem('stash_retention_days') || '0');
    if (policy === 0) return;
    
    const cutoffTime = Date.now() - policy * 24 * 60 * 60 * 1000;
    const itemsToDelete = allHistory.filter(item => {
      // Starred pinned items are always preserved!
      if (item.isFavorite) return false;
      // If item was created before cutoff time, delete it
      const itemTime = item.timestamp || (item.createdAt ? new Date(item.createdAt).getTime() : 0);
      return itemTime > 0 && itemTime < cutoffTime;
    });

    if (itemsToDelete.length > 0) {
      setStaleItemsToClear(itemsToDelete);
    }
  }, []);

  // Load items from database
  const loadItems = useCallback(async () => {
    if (!invoke) return;
    try {
      const data = await invoke<ClipboardItem[]>('get_clipboard_items');
      setItems(data);
      setError(null);
      await autoClearOldItems(data);
    } catch (e) {
      setError(`Failed to load history: ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [autoClearOldItems]);

  // Initialize runtime and database listener
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const init = async () => {
      const rt = await loadRuntime();
      setRuntime(rt);

      if (rt) {
        await loadItems();
        if (listen) {
          unlisten = await listen('clipboard-changed', (event) => {
            const newItem = event.payload as ClipboardItem;
            setItems(prev => {
              if (prev.some(i => i.id === newItem.id)) return prev;
              return [newItem, ...prev];
            });
          });
        }
      } else {
        setIsLoading(false);
        setError('Not running in a desktop context. Use: npm run electron');
      }
    };

    init();
    return () => { if (unlisten) unlisten(); };
  }, [loadItems]);

  // Focus and keyboard listeners
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V' || e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (invoke) {
          invoke('window_close').catch(() => {});
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleCopy = async (item: ClipboardItem) => {
    if (invoke) {
      try { await invoke('copy_to_clipboard', { content: item.content }); }
      catch { navigator.clipboard.writeText(item.content).catch(() => {}); }
    } else {
      navigator.clipboard.writeText(item.content).catch(() => {});
    }

    // Duplicate item as a NEW entry at the top of the memories list
    const duplicateItem: ClipboardItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
      createdAt: 'Just now'
    };

    setItems(prev => [duplicateItem, ...prev]);

    if (invoke) {
      invoke('add_item', { content: item.content }).catch(() => {});
    }

    setCopiedId(duplicateItem.id);
    showToast("Stash Copied!", item.title ? `"${item.title.slice(0, 25)}" copied!` : "Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePasteItem = async (item: ClipboardItem) => {
    if (invoke) {
      try {
        await invoke('paste_item', { content: item.content });
      } catch (e) {
        console.error('IPC paste_item failed:', e);
        await handleCopy(item);
      }
    } else {
      await handleCopy(item);
    }
  };

  const toggleFavorite = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newVal = !item.isFavorite;
    setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: newVal } : i));
    if (invoke) {
      try { await invoke('toggle_favorite', { id, isFavorite: newVal }); }
      catch { setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !newVal } : i)); }
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (invoke) {
      try { await invoke('delete_item', { id }); }
      catch { await loadItems(); }
    }
  };

  // ── Drag & Drop Handlers (Robust for Text, Files, Links, & Images) ─────────────
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  const handleAddNewDroppedItem = async (content: string, customCategory?: string, customTitle?: string, source: string = 'Drag & Drop') => {
    const text = content.trim();
    if (!text) return;

    const category = customCategory || classifyContent(text);
    const title = customTitle || generateSmartTitle(text, category);
    const timestamp = Date.now();
    const newItem: ClipboardItem = {
      id: timestamp.toString(),
      content: text,
      category,
      title,
      sourceApp: source,
      isFavorite: false,
      isEncrypted: category === 'API Key' || category === 'Secret',
      createdAt: 'Just now',
      timestamp
    };

    setItems(prev => [newItem, ...prev.filter(i => i.content !== text)]);

    if (invoke) {
      try {
        await invoke('add_item', { content: text, category, title });
      } catch (err) {
        console.error('Failed to save dropped item to DB:', err);
      }
    }

    showToast("Stashed!", `"${title.slice(0, 25)}" added to Stash`);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDraggingOver(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    // 1. Check for files (images, text files, code files, json, etc.)
    if (dt.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const file = dt.files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const imgData = evt.target?.result as string;
            if (imgData) {
              await handleAddNewDroppedItem(imgData, 'Image', `Dropped Image (${file.name})`, 'Drag & Drop');
            }
          };
          reader.readAsDataURL(file);
        } else {
          try {
            const textContent = await file.text();
            if (textContent.trim()) {
              const cat = classifyContent(textContent);
              const title = file.name || generateSmartTitle(textContent, cat);
              await handleAddNewDroppedItem(textContent, cat, title, 'Drag & Drop File');
            }
          } catch (err) {
            console.error('Error reading dropped file:', err);
          }
        }
      }
      return;
    }

    // 2. Check for Plain Text / Highlighted Text / URL / HTML Drag & Drop
    const textPlain = dt.getData('text/plain');
    const textUri = dt.getData('text/uri-list') || dt.getData('URL');
    const textHtml = dt.getData('text/html');
    const textGeneric = dt.getData('text');

    const rawText = textPlain || textUri || textGeneric || textHtml;
    if (rawText && rawText.trim()) {
      let cleanText = rawText.trim();
      if (!textPlain && textHtml) {
        try {
          const doc = new DOMParser().parseFromString(textHtml, 'text/html');
          cleanText = doc.body.textContent || rawText;
        } catch {}
      }
      if (cleanText.trim()) {
        const cat = classifyContent(cleanText);
        const title = generateSmartTitle(cleanText, cat);
        await handleAddNewDroppedItem(cleanText, cat, title, 'Drag & Drop');
      }
    } else if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind === 'string') {
          item.getAsString(async (str) => {
            if (str && str.trim()) {
              const cat = classifyContent(str.trim());
              const title = generateSmartTitle(str.trim(), cat);
              await handleAddNewDroppedItem(str.trim(), cat, title, 'Drag & Drop');
            }
          });
        }
      }
    }
  };

  const clearAll = async () => {
    setShowClearConfirm(false);
    if (invoke) {
      try { await invoke('clear_all', {}); }
      catch {}
    }
    setItems([]);
    setChatMessages([
      {
        id: 'welcome-reset',
        sender: 'stash',
        text: "I have cleared my database memories. Start copying things, and I will remember them here!",
        timestamp: Date.now()
      }
    ]);
  };

  const openDataFolder = async () => {
    if (invoke) invoke('open_db_folder', {}).catch(() => {});
  };

  const handleExportTXT = () => {
    const textContent = items.map(item => {
      return `========================================\nTITLE: ${item.title}\nCATEGORY: ${item.category}\nDATE: ${item.createdAt}\n----------------------------------------\n${item.content}\n========================================\n\n`;
    }).join('\n');
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stash_memory_vault_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stash_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerImportJSON = () => {
    importFileRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          showToast("Import Failed", "Selected file is not a valid Stash memory vault list.");
          return;
        }

        const validItems = parsed.filter(item => item && typeof item === 'object' && 'content' in item);
        if (validItems.length === 0) {
          showToast("Import Failed", "No valid clipboard items found in the file.");
          return;
        }

        const existingContents = new Set(items.map(i => i.content));
        const newItemsToImport = [];

        for (const item of validItems) {
          if (!existingContents.has(item.content)) {
            const content = item.content;
            const category = item.category || 'Text';
            const title = item.title || (content.trim().slice(0, 40) + (content.length > 40 ? '...' : ''));
            const isFavorite = !!item.isFavorite;
            const isEncrypted = !!item.isEncrypted;
            const timestamp = item.timestamp || Date.now();
            const createdAt = item.createdAt || 'Imported';

            newItemsToImport.push({
              id: item.id || timestamp.toString() + Math.random().toString(36).substr(2, 5),
              content,
              category,
              title,
              isFavorite,
              isEncrypted,
              createdAt,
              timestamp
            });
            existingContents.add(content);
          }
        }

        if (newItemsToImport.length === 0) {
          showToast("Import Completed", "All items in the backup file already exist in your Stash.");
          return;
        }

        const mergedItems = [...newItemsToImport, ...items];
        setItems(mergedItems);

        if (invoke) {
          for (const item of newItemsToImport) {
            await invoke('add_item', { content: item.content });
            if (item.isFavorite) {
              await invoke('toggle_favorite', { id: item.id, isFavorite: true });
            }
          }
        }

        showToast("Import Successful", `Successfully imported ${newItemsToImport.length} new items!`);
      } catch (err) {
        showToast("Import Error", "Failed to parse the backup JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>Stash Memory Vault Export</title>
          <style>
            body { font-family: 'Outfit', sans-serif, system-ui; padding: 40px; background: white; color: #111; }
            h1 { font-size: 24px; color: #7C5CFF; border-bottom: 2px solid #7C5CFF; padding-bottom: 10px; margin-bottom: 30px; }
            .item { margin-bottom: 30px; page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .title { font-size: 16px; font-weight: bold; color: #1f1f1f; margin-bottom: 5px; }
            .meta { font-size: 11px; color: #666; margin-bottom: 10px; }
            .content { font-family: monospace; background: #f8f8f8; border: 1px solid #e0e0e0; padding: 12px; border-radius: 8px; font-size: 11px; white-space: pre-wrap; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>Stash Memory Vault</h1>
          ${items.map(item => `
            <div class="item">
              <div class="title">${item.title}</div>
              <div class="meta">Category: ${item.category} | Date: ${item.createdAt}</div>
              <pre class="content">${item.content}</pre>
            </div>
          `).join('')}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Local Q&A handler (Search + Developer API Dataset or Live LLM API)
  const handleChatSubmit = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatQuery('');
    setIsTyping(true);

    // Get active key for selected provider
    let activeKey = '';
    if (activeProvider === 'openai') activeKey = openaiKey;
    else if (activeProvider === 'gemini') activeKey = geminiKey;
    else if (activeProvider === 'groq') activeKey = groqKey;
    else if (activeProvider === 'mistral') activeKey = mistralKey;

    if (useApiKey && activeKey.trim()) {
      const itemsContext = items.slice(0, 10).map(i => `[${i.category}] ${i.title}: ${i.content.slice(0, 200)}`).join('\n');
      const aiReply = await callAiApi(activeProvider, activeKey.trim(), queryText, itemsContext);
      
      const stashMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'stash',
        text: aiReply,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, stashMsg]);
      setIsTyping(false);
      return;
    }

    setTimeout(() => {
      const qLower = queryText.toLowerCase();
      const cleanQuery = qLower.trim().replace(/[?.!,]/g, '');

      // Common sense conversational replies
      const conversationalReplies: Record<string, string> = {
        'hi': "Hello! I am Stash, your local clipboard and developer Q&A assistant. What can I help you find or look up today?",
        'hello': "Hello! I am Stash, your local clipboard and developer Q&A assistant. What can I help you find or look up today?",
        'hey': "Hey there! How can I help you with your clipboard history or developer sheets today?",
        'hola': "¡Hola! How can I assist you with your saved memories or code reference guides?",
        'yo': "Yo! How can I help you search your clipboard or developer specs today?",
        'greetings': "Greetings! Ready to search your clipboard or look up developer API specs.",
        'who are you': "I am Stash, a local developer search engine. I manage your clipboard memories, keep track of your snippets, and provide offline references for code, DSA, and APIs.",
        'what is this': "This is Stash—your local clipboard manager and developer Q&A search engine. You can copy text, commands, or images and find them here, or ask me for code and API definitions.",
        'help': "You can use this chat to search your clipboard history or look up developer resources. Try searching for:\n- Coding languages: 'C++', 'Python', 'Rust', 'JavaScript'\n- DSA patterns: 'LRU Cache', 'Binary Search', 'Trie'\n- Developer APIs: 'Grok API', 'Gemini API', 'Claude API', 'Docker commands'\n- Or simply search text from your clipboard!",
        'thanks': "You're welcome! Let me know if you need to search or look up anything else.",
        'thank you': "You're welcome! Let me know if you need to search or look up anything else.",
        'cool': "Awesome! Let me know if you want to look up other code snippets or commands.",
        'awesome': "Glad you think so! Stash makes it super easy to search through your workflow.",
        'perfect': "Perfect indeed! Let me know if you need anything else.",
        'bye': "Goodbye! Have a productive coding session!"
      };

      let replyText = '';
      let combinedMatches: ClipboardItem[] = [];
      let isConversational = false;

      // 1. Temporal Queries Check: "last four copied", "latest 3", "recent 5 items"
      const temporalKeywords = ['last', 'recent', 'latest', 'copied', 'copy', 'stashed'];
      const isTemporal = temporalKeywords.some(w => cleanQuery.includes(w));

      if (isTemporal) {
        let count = 1; // Default to 1
        const numMatch = cleanQuery.match(/\b(\d+)\b/);
        if (numMatch) {
          count = parseInt(numMatch[1], 10);
        } else {
          const numberWords: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          for (const [word, val] of Object.entries(numberWords)) {
            if (cleanQuery.includes(word)) {
              count = val;
              break;
            }
          }
        }
        
        // Grab recent items sorted by timestamp desc
        const sortedRecent = [...items].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
        combinedMatches = sortedRecent.slice(0, count);
        
        if (combinedMatches.length > 0) {
          replyText = `Here are your last ${combinedMatches.length} copied items:`;
        } else {
          replyText = "You haven't stashed anything yet.";
        }
        isConversational = true;
      }

      // 2. Link Queries Check: "links", "urls", or queries containing "link"/"url" without code terms
      const isLinkQuery = (cleanQuery.includes('link') || cleanQuery.includes('url')) && 
                          !['parse', 'regex', 'code', 'extract', 'javascript', 'js', 'function', 'api', 'spec'].some(w => cleanQuery.includes(w));
      const isUrlDirect = cleanQuery.startsWith('http://') || cleanQuery.startsWith('https://') || cleanQuery.startsWith('www.');

      if (!isConversational && (isLinkQuery || isUrlDirect)) {
        if (isLinkQuery) {
          const linkItems = items.filter(item => 
            item.category === 'URL' || 
            item.content.toLowerCase().startsWith('http://') || 
            item.content.toLowerCase().startsWith('https://') ||
            item.content.toLowerCase().includes('www.')
          );
          combinedMatches = linkItems.slice(0, 4);
          if (combinedMatches.length > 0) {
            replyText = "Here are the latest links from your stash:";
          } else {
            replyText = "You haven't stashed any links yet.";
          }
        } else {
          const urlMatches = items.filter(item => item.content.toLowerCase().includes(qLower));
          combinedMatches = urlMatches.slice(0, 4);
          if (combinedMatches.length > 0) {
            replyText = "Here are matching link items from your stash:";
          } else {
            replyText = "You haven't stashed this URL yet.";
          }
        }
        isConversational = true;
      }

      // 3. Conversational Queries fallback
      if (!isConversational) {
        if (conversationalReplies[cleanQuery]) {
          replyText = conversationalReplies[cleanQuery];
          isConversational = true;
        } else if (['hi', 'hello', 'hey', 'yo', 'hola'].some(g => cleanQuery.startsWith(g) && cleanQuery.length <= 12)) {
          replyText = "Hello! I am Stash, your local clipboard search engine. How can I help you lookup memories or developer specs?";
          isConversational = true;
        } else if (cleanQuery === 'who are you' || cleanQuery === 'what is this' || cleanQuery.includes('what do you do') || cleanQuery === 'about') {
          replyText = "I am Stash, a local developer search engine. I manage your clipboard memories, keep track of your snippets, and provide offline references for code, DSA, and APIs.";
          isConversational = true;
        } else if (cleanQuery.includes('help') || cleanQuery === 'commands' || cleanQuery === 'how to use') {
          replyText = "You can use this chat to search your clipboard history or look up developer resources. Try queries like:\n- 'C++ vector'\n- 'LRU cache pattern'\n- 'Grok API specification'\n- 'Docker run commands'\n- Or any phrase you recently copied!";
          isConversational = true;
        } else if (['thanks', 'thank you', 'cheers', 'awesome', 'cool'].some(app => cleanQuery.includes(app) && cleanQuery.length < 15)) {
          replyText = "You're welcome! Let me know if you need to search or look up anything else.";
          isConversational = true;
        }
      }

      if (!isConversational) {
        // 1. Match local clipboard items with intelligent token & synonym expansion
        const searchWords = cleanQuery.split(/\s+/).filter(w => w.length > 0);
        const userMatches = items.filter(item => {
          const contentLower = item.content.toLowerCase();
          const titleLower = item.title.toLowerCase();
          const catLower = item.category.toLowerCase();

          // Direct substring match
          if (contentLower.includes(qLower) || titleLower.includes(qLower) || catLower.includes(qLower)) {
            return true;
          }

          // Groq / Grok / gsk_ API Key pattern matching
          const isGroqQuery = searchWords.some(w => ['groq', 'grok', 'gsk'].includes(w));
          if (isGroqQuery && (contentLower.includes('gsk_') || contentLower.includes('gsk-') || contentLower.includes('groq') || titleLower.includes('groq'))) {
            return true;
          }

          // General API Key / Secrets matching
          const isApiKeyQuery = searchWords.some(w => ['key', 'keys', 'token', 'secret', 'secrets', 'apikey', 'apikeys'].includes(w));
          if (isApiKeyQuery && (item.category === 'API Key' || item.category === 'Secret' || item.isEncrypted || contentLower.includes('gsk_') || contentLower.includes('sk-') || contentLower.includes('aiza') || contentLower.includes('api_key') || contentLower.includes('apikey'))) {
            return true;
          }

          // Multi-word token match (all query words present in item text/title/category)
          if (searchWords.length > 1 && searchWords.every(w => contentLower.includes(w) || titleLower.includes(w) || catLower.includes(w))) {
            return true;
          }

          return false;
        });

        // 2. Match built-in developer knowledge base (DSA, Code, Languages, APIs)
        const devKnowledgeMatches = DEV_KNOWLEDGE_BASE.filter(k => 
          k.keywords.some(kw => qLower.includes(kw) || kw.split(' ').every(token => qLower.includes(token))) || 
          k.title.toLowerCase().includes(qLower) ||
          (k.language && qLower.includes(k.language.toLowerCase()))
        );

        combinedMatches = [...userMatches];

        devKnowledgeMatches.forEach((k, idx) => {
          combinedMatches.push({
            id: `dev_kb_${idx}_${Date.now()}`,
            title: `${k.title}${k.language ? ` (${k.language})` : ''}`,
            category: k.category,
            content: k.content,
            createdAt: k.language ? `Ref: ${k.language}` : 'Ref: Developer Knowledge',
            timestamp: Date.now(),
            isFavorite: false,
            isEncrypted: false,
          });
        });

        if (combinedMatches.length > 0) {
          if (devKnowledgeMatches.length > 0 && userMatches.length > 0) {
            replyText = "Here are the results from your stash & developer references:";
          } else if (devKnowledgeMatches.length > 0) {
            replyText = "Here is the developer reference:";
          } else {
            replyText = "Here are the results from your stash:";
          }
        } else {
          replyText = "You haven't stashed anything related like that.";
        }
      }

      const stashMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'stash',
        text: replyText,
        timestamp: Date.now(),
        matchedItems: combinedMatches.length > 0 ? combinedMatches.slice(0, 4) : undefined
      };

      setChatMessages(prev => [...prev, stashMsg]);
      setIsTyping(false);
    }, 400);
  };

  // Run a quick query template (e.g. from Home tab click)
  const runTemplateQuery = (queryText: string) => {
    setActiveTab('ask');
    setTimeout(() => {
      handleChatSubmit(queryText);
    }, 100);
  };

  // Trigger search focus
  const triggerSearchFocus = () => {
    setActiveTab('home');
    setSelectedCategory('All');
    setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
  };

  // Trigger Workspace Toast
  const triggerWorkspaceShow = () => {
    setShowWorkspaceToast(true);
    setTimeout(() => setShowWorkspaceToast(false), 3000);
  };

  // Group items dynamically into Collections
  const collections = useMemo(() => {
    const groups: Record<string, ClipboardItem[]> = {};
    groups['Stash Pad Notes'] = [];

    items.forEach(item => {
      if (item.category === 'Stash Pad' || item.sourceApp === 'Stash Pad') {
        groups['Stash Pad Notes'].push(item);
      }

      if (item.isFavorite) {
        if (!groups['Starred Pinned']) groups['Starred Pinned'] = [];
        groups['Starred Pinned'].push(item);
      }
      
      if (item.isEncrypted || item.category === 'Secret' || item.category === 'API Key') {
        if (!groups['Secrets & Keys']) groups['Secrets & Keys'] = [];
        groups['Secrets & Keys'].push(item);
      } else if (item.category === 'Command') {
        if (!groups['Commands & Terminal']) groups['Commands & Terminal'] = [];
        groups['Commands & Terminal'].push(item);
      } else if (item.category === 'SQL') {
        if (!groups['SQL Queries']) groups['SQL Queries'] = [];
        groups['SQL Queries'].push(item);
      } else if (item.category === 'Prompts') {
        if (!groups['AI Prompts']) groups['AI Prompts'] = [];
        groups['AI Prompts'].push(item);
      } else if (item.category === 'Code') {
        if (!groups['Code Snippets']) groups['Code Snippets'] = [];
        groups['Code Snippets'].push(item);
      } else if (item.category === 'URL') {
        if (!groups['Links & Web']) groups['Links & Web'] = [];
        groups['Links & Web'].push(item);
      } else if (item.category === 'Emoji') {
        if (!groups['Emojis & Glyphs']) groups['Emojis & Glyphs'] = [];
        groups['Emojis & Glyphs'].push(item);
      } else if (item.category === 'Image') {
        if (!groups['Images & Screenshots']) groups['Images & Screenshots'] = [];
        groups['Images & Screenshots'].push(item);
      } else if (item.category !== 'Stash Pad' && item.sourceApp !== 'Stash Pad') {
        if (!groups['Text & General']) groups['Text & General'] = [];
        groups['Text & General'].push(item);
      }
    });
    return groups;
  }, [items]);

  // Calculate statistics for Insights Tab
  const stats = useMemo(() => {
    const total = items.length;
    const copiesToday = items.filter(i => i.timestamp && (Date.now() - i.timestamp < 24 * 60 * 60 * 1000)).length;
    const hoursSaved = Math.round((total * 5 / 60) * 10) / 10;
    const duplicateCopies = Math.round(total * 0.15);
    
    const categoriesCount = CATEGORIES.reduce((acc, cat) => {
      if (cat === 'All' || cat === 'Favorites') return acc;
      acc[cat] = items.filter(i => {
        if (cat === 'Secrets') return i.category === 'API Key' || i.category === 'Secret';
        return i.category.toLowerCase() === cat.toLowerCase();
      }).length;
      return acc;
    }, {} as Record<string, number>);

    return { total, copiesToday, hoursSaved, duplicateCopies, categoriesCount };
  }, [items]);

  // Filter items for the Home view
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return (b.timestamp ?? 0) - (a.timestamp ?? 0);
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return sortedItems.filter(item => {
      const catMatch =
        selectedCategory === 'All' ||
        (selectedCategory === 'Favorites' && item.isFavorite) ||
        (selectedCategory === 'Stash Pad' && (item.category === 'Stash Pad' || item.sourceApp === 'Stash Pad')) ||
        (selectedCategory === 'Secrets' && (item.category === 'API Key' || item.category === 'Secret')) ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!catMatch) return false;
      if (!query) return true;
      
      const queryWords = query.split(/\s+/).filter(Boolean);
      if (queryWords.length === 0) return true;
      return queryWords.every(word =>
        item.content.toLowerCase().includes(word) ||
        item.title.toLowerCase().includes(word) ||
        item.category.toLowerCase().includes(word)
      );
    });
  }, [sortedItems, selectedCategory, searchQuery]);




  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-[#07070a] bg-[radial-gradient(ellipse_100%_100%_at_50%_-15%,rgba(124,92,255,0.15),rgba(0,0,0,0))] font-sans text-zinc-100 antialiased overflow-hidden select-none border border-white/10 rounded-2xl shadow-2xl relative"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── Drop Zone Visual Overlay ── */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-[100] bg-[#0c0d1b]/95 border-2 border-dashed border-[#7C5CFF] rounded-2xl flex flex-col items-center justify-center gap-3 backdrop-blur-xl animate-in fade-in duration-150 pointer-events-none shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C5CFF]/30 to-[#A88CFF]/20 border border-[#7C5CFF]/50 flex items-center justify-center text-[#A88CFF] shadow-2xl shadow-[#7C5CFF]/40">
            <Upload className="w-8 h-8 animate-bounce text-[#A88CFF]" />
          </div>
          <div className="text-center px-4">
            <h2 className="text-base font-extrabold text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Release to Stash Content
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Supports highlighted text, code snippets, text files (.txt, .js, .json, .py, .md), links & images
            </p>
          </div>
        </div>
      )}

      {/* ── Custom Windows Title Bar (Microsoft PC Manager Style) ── */}
      <header
        className="h-9 px-3.5 bg-gradient-to-r from-[#0c0d16] via-[#090a12] to-[#07070a] border-b border-white/[0.05] flex items-center justify-between shrink-0 select-none z-50 relative rounded-t-2xl backdrop-blur-xl"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Left: App Logo & Title */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#A88CFF] flex items-center justify-center shadow-md shadow-[#7C5CFF]/20 overflow-hidden">
            <img src="./Stash.png" className="w-3.5 h-3.5 object-contain" alt="Stash Logo" />
          </div>
          <span className="text-[12px] font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Stash
          </span>
        </div>

        {/* Right: Window Controls (Minimize, Maximize, Close) */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={() => invoke && invoke('window_minimize')}
            className="w-7 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => invoke && invoke('window_maximize')}
            className="w-7 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer"
            title="Maximize / Restore"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => invoke && invoke('window_close')}
            className="w-7 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600/90 rounded-md transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* App Main Body Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ── Sidebar (iOS Glassmorphism & Apple VisionOS design) ── */}
        <aside className="w-[58px] sm:w-[68px] shrink-0 border-r border-white/10 bg-[#0f1020]/40 flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden shadow-2xl shadow-black/45 transition-all duration-300">
        {/* Soft volumetric gradient glows */}
        <div className="absolute -left-12 top-24 w-40 h-40 rounded-full bg-[#7C5CFF]/5 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 bottom-36 w-40 h-40 rounded-full bg-[#A88CFF]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center w-full">
          {/* Top Spacing */}
          <div className="pt-3 pb-1 flex justify-center shrink-0" />

          {/* Navigation links (Vertical stack of compact icon+label buttons) */}
          <nav className="w-full px-1 flex flex-col gap-2">
            {[
              { name: 'home', label: 'Home', shortLabel: 'Home', icon: <LayoutGrid className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />, action: () => { setActiveTab('home'); setSelectedCategory('All'); } },
              { name: 'ask', label: 'Ask AI', shortLabel: 'Ask Stash', icon: <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />, action: () => setActiveTab('ask') },
              { name: 'collections', label: 'Collections', shortLabel: 'Library', icon: <Library className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />, action: () => { setActiveTab('collections'); setSelectedCollection(null); } },
              { name: 'notes', label: 'Stash Pad', shortLabel: 'Stash Pad', icon: <Pin className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" style={{ transform: 'rotate(30deg)' }} />, action: () => setActiveTab('notes') }
            ].map(tab => {
              const isActive = activeTab === tab.name && (tab.name !== 'home' || selectedCategory === 'All');
              return (
                <button
                  key={tab.name}
                  onClick={tab.action}
                  className={`group relative flex flex-col items-center justify-center w-11 h-11 sm:w-[52px] sm:h-[52px] mx-auto rounded-xl sm:rounded-2xl transition-all duration-205 cursor-pointer border ${
                    isActive
                      ? 'bg-white/[0.08] text-[#A88CFF] border-[#7C5CFF]/40 shadow-[0_0_12px_rgba(124,92,255,0.18)]'
                      : 'bg-white/[0.02] border-white/[0.05] text-zinc-450 hover:text-zinc-100 hover:bg-white/[0.04]'
                  }`}
                  title={tab.label}
                >
                  <div className="transition-transform duration-200 group-hover:scale-105">
                    {tab.icon}
                  </div>
                  <span className={`text-[7.5px] sm:text-[8.5px] font-bold tracking-tight leading-none mt-1 text-center px-0.5 transition-colors ${
                    isActive ? 'text-[#A88CFF]' : 'text-zinc-550 group-hover:text-zinc-300'
                  }`} style={{ fontFamily: 'Outfit, sans-serif', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {tab.shortLabel}
                  </span>
                  {/* Left indicator line for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-2.5 bottom-2.5 sm:top-3.5 sm:bottom-3.5 w-[2px] sm:w-[2.5px] bg-[#7C5CFF] rounded-r-full transition-all duration-300" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* "Stash It" Multi-Select Mode Button */}
          <div className="w-full px-1 mt-2">
            <button
              onClick={() => {
                const nextState = !isStashItActive;
                setIsStashItActive(nextState);
                if (nextState) {
                  setActiveTab('home');
                }
              }}
              className={`group relative flex flex-col items-center justify-center w-11 h-11 sm:w-[52px] sm:h-[52px] mx-auto rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer border ${
                isStashItActive
                  ? 'bg-gradient-to-br from-[#7C5CFF] to-[#A88CFF] text-white border-[#A88CFF]/60 shadow-[0_0_16px_rgba(124,92,255,0.45)] font-bold scale-105'
                  : 'bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 border-[#7C5CFF]/30 text-[#A88CFF] hover:border-[#7C5CFF]/50 shadow-inner'
              }`}
              title={isStashItActive ? "Stash It Active — Click cards to combine into 1 clip!" : "Stash It — Multi-Select & Combine Copy"}
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                <Layers className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300 ${isStashItActive ? 'text-white' : 'text-[#A88CFF]'}`} />
              </div>
              <span className={`text-[7.5px] sm:text-[8.5px] font-extrabold tracking-tight leading-none mt-1 text-center px-0.5 transition-colors ${
                isStashItActive ? 'text-white' : 'text-[#A88CFF]'
              }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                Stash It
              </span>
              {isStashItActive && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1020] animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom dock panel with compact buttons */}
        <div className="px-1 py-3 flex flex-col gap-2 border-t border-zinc-900/40 mt-auto items-center w-full">
          <button
            onClick={openDataFolder}
            className="w-11 h-11 sm:w-[52px] sm:h-[52px] flex flex-col items-center justify-center rounded-xl sm:rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] text-zinc-450 hover:text-zinc-100 transition-colors shadow-inner"
            title="Open data folder"
          >
            <FolderOpen className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />
            <span className="text-[8px] sm:text-[9px] font-bold tracking-tight mt-0.5 sm:mt-1 text-zinc-550 group-hover:text-zinc-300 transition-all duration-300" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Data
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`group relative w-11 h-11 sm:w-[52px] sm:h-[52px] flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${
              activeTab === 'settings'
                ? 'bg-white/[0.08] border-[#7C5CFF]/40 text-[#A88CFF]'
                : 'bg-white/[0.02] border-white/[0.05] text-zinc-450 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
            title="Stash settings"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />
            <span className={`text-[8px] sm:text-[9px] font-bold tracking-tight mt-0.5 sm:mt-1 transition-colors ${
              activeTab === 'settings' ? 'text-[#A88CFF]' : 'text-zinc-550 group-hover:text-zinc-300'
            }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              Settings
            </span>
            {activeTab === 'settings' && (
              <div className="absolute left-0 top-2.5 bottom-2.5 sm:top-3.5 sm:bottom-3.5 w-[2px] sm:w-[2.5px] bg-[#7C5CFF] rounded-r-full transition-all duration-300" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`group relative w-11 h-11 sm:w-[52px] sm:h-[52px] flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${
              activeTab === 'guide'
                ? 'bg-white/[0.08] border-[#7C5CFF]/40 text-[#A88CFF] shadow-[0_0_12px_rgba(124,92,255,0.18)]'
                : 'bg-white/[0.02] border-white/[0.05] text-zinc-450 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
            title="What's Stash? Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />
            <span className={`text-[7.5px] sm:text-[8.5px] font-bold tracking-tight leading-none mt-0.5 sm:mt-1 text-center px-0.5 transition-colors ${
              activeTab === 'guide' ? 'text-[#A88CFF]' : 'text-zinc-550 group-hover:text-zinc-300'
            }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              What's Stash
            </span>
            {activeTab === 'guide' && (
              <div className="absolute left-0 top-2.5 bottom-2.5 sm:top-3.5 sm:bottom-3.5 w-[2px] sm:w-[2.5px] bg-[#7C5CFF] rounded-r-full transition-all duration-300" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`group relative w-11 h-11 sm:w-[52px] sm:h-[52px] flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${
              activeTab === 'about'
                ? 'bg-white/[0.08] border-[#7C5CFF]/40 text-[#A88CFF]'
                : 'bg-white/[0.02] border-white/[0.05] text-zinc-450 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
            title="About Stash"
          >
            <Info className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all duration-300" />
            <span className={`text-[8px] sm:text-[9px] font-bold tracking-tight mt-0.5 sm:mt-1 transition-colors ${
              activeTab === 'about' ? 'text-[#A88CFF]' : 'text-zinc-550 group-hover:text-zinc-300'
            }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              About
            </span>
            {activeTab === 'about' && (
              <div className="absolute left-0 top-2.5 bottom-2.5 sm:top-3.5 sm:bottom-3.5 w-[2px] sm:w-[2.5px] bg-[#7C5CFF] rounded-r-full transition-all duration-300" />
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">

        {/* Floating Workspace Connection Toast */}
        {showWorkspaceToast && (
          <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-[#7C5CFF]/20 px-4 py-2.5 rounded-xl text-xs text-zinc-200 shadow-2xl backdrop-blur-md">
              <Layers className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-white block">Connected Workspace</span>
                <span className="text-[10px] text-zinc-500 font-mono">d:\1-Perfecto\ClipBrain</span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Floating Success Toast */}
        {toast.show && (
          <div className="absolute top-3 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
            <div className="flex items-center gap-2 bg-[#0d0e17]/95 border border-[#7C5CFF]/40 px-3 py-1.5 rounded-lg text-xs text-zinc-200 shadow-xl backdrop-blur-md">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-[11px]">{toast.title}</span>
                {toast.desc && <span className="text-[10px] text-zinc-400 border-l border-zinc-700/60 pl-1.5">{toast.desc}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Global Stash Copy Queue Floating Banner */}
        {stashCopyIds.length > 0 && (
          <div className="mx-4 mt-3 mb-1 bg-gradient-to-r from-[#151622]/95 to-[#0f1020]/95 border border-[#7C5CFF]/40 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_8px_32px_rgba(124,92,255,0.2)] backdrop-blur-xl shrink-0 relative overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 via-[#7C5CFF] to-pink-500" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 flex items-center justify-center text-[#A88CFF] shadow-inner">
                <Layers className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Stash Copy Queue
                  <span className="text-[10px] font-mono bg-[#7C5CFF]/25 text-[#A88CFF] px-2 py-0.5 rounded-full font-bold border border-[#7C5CFF]/30">
                    {stashCopyIds.length} {stashCopyIds.length === 1 ? 'item' : 'items'}
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Ready to combine and copy to clipboard from any section.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">

              <button
                onClick={handleStashCopy}
                className="flex-1 sm:flex-initial py-1.5 px-3.5 bg-[#7C5CFF] hover:bg-[#6849E6] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                {copiedId === 'stash_copy_success' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Combined</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setStashCopyIds([])}
                className="p-1.5 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Clear stash queue"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ──────── TAB: HOME (Unified Clipboard Feed + Search) ──────── */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col pt-4 px-4 pb-4 overflow-hidden">
            {/* Search and Action Row */}
            <div className="flex items-center gap-2.5 mb-4 shrink-0 w-full z-20">
              {/* Unified Search / Ask Stash box (Gemini-style Capsule) */}
              <div className="relative group flex-1">
                <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-[#7C5CFF] to-violet-650 opacity-10 blur-md group-hover:opacity-20 transition duration-300" />
                <div className="relative flex items-center bg-[#151622]/90 border border-white/[0.07] focus-within:border-[#7C5CFF]/60 rounded-[32px] shadow-2xl p-1 backdrop-blur-xl transition-all duration-300 gap-1.5">
                  
                  {/* Left Search icon indicator */}
                  <div className="p-1.5 text-zinc-450 shrink-0 ml-1">
                    <Search className="w-3.5 h-3.5" />
                  </div>

                  {/* Main input text field */}
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder={useApiKey ? `Search memories or Ask ${activeProvider.toUpperCase()} AI...` : "Search memories or Ask Stash..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchQuery.trim()) {
                          const q = searchQuery;
                          setSearchQuery('');
                          setActiveTab('ask');
                          handleChatSubmit(q);
                        } else {
                          searchRef.current?.blur();
                        }
                      }
                    }}
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 py-1.5 text-zinc-100 text-[13px] placeholder-zinc-550 min-w-0 pr-2"
                  />

                  {searchQuery && (
                    <div className="flex items-center gap-1 shrink-0 mr-1">
                      <button
                        onClick={() => {
                          const q = searchQuery;
                          setSearchQuery('');
                          setActiveTab('ask');
                          handleChatSubmit(q);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/35 border border-[#7C5CFF]/40 text-[#A88CFF] text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        title="Send query to Ask Stash"
                      >
                        <Sparkles className="w-3 h-3 text-[#A88CFF]" />
                        <span>Ask Stash</span>
                      </button>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-zinc-550 hover:text-zinc-300"
                        title="Clear input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear All Button */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/20 px-3 h-[38px] rounded-[32px] transition-all duration-200 cursor-pointer shadow-md shrink-0"
                title="Clear all memories"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400/80" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Category Filter Pills (Horizontal Scrollable) */}
            <div 
              className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-2 sm:pb-2.5 mb-3 shrink-0 transition-all duration-300"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[
                { name: 'All', label: 'All', icon: <img src="./Stash.png" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain opacity-70 transition-all duration-300" alt="All" /> },
                { name: 'Favorites', label: 'Starred', icon: <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 transition-all duration-300" /> },
                { name: 'Secrets', label: 'Secrets', icon: <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 transition-all duration-300" /> },
                { name: 'Code', label: 'Code', icon: <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 transition-all duration-300" /> },
                { name: 'Prompts', label: 'Prompts', icon: <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 transition-all duration-300" /> },
                { name: 'Command', label: 'Terminal', icon: <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 transition-all duration-300" /> },
                { name: 'SQL', label: 'SQL', icon: <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 transition-all duration-300" /> },
                { name: 'URL', label: 'Links', icon: <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 transition-all duration-300" /> },
                { name: 'JSON', label: 'JSON', icon: <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 transition-all duration-300" /> },
                { name: 'Path', label: 'Files', icon: <FolderOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 transition-all duration-300" /> },
                { name: 'Email', label: 'Emails', icon: <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400 transition-all duration-300" /> },
                { name: 'Text', label: 'Notes', icon: <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 transition-all duration-300" /> },
              ].map(filter => {
                const count = filter.name === 'Secrets' 
                  ? items.filter(i => i.category === 'API Key' || i.category === 'Secret').length 
                  : filter.name === 'Favorites'
                  ? items.filter(i => i.isFavorite).length
                  : filter.name === 'All'
                  ? items.length
                  : stats.categoriesCount[filter.name] || 0;
                
                const isSelected = selectedCategory === filter.name;
                
                return (
                  <button
                    key={filter.name}
                    onClick={() => setSelectedCategory(filter.name)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10.5px] sm:text-xs font-semibold whitespace-nowrap border shrink-0 transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#7C5CFF]/15 text-white border-[#7C5CFF]/45 shadow-[0_2px_8px_rgba(124,92,255,0.15)] font-bold'
                        : 'bg-white/[0.02] border-white/[0.05] text-zinc-450 hover:text-zinc-200 hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                  >
                    {filter.icon}
                    <span>{filter.label}</span>
                    {count > 0 && (
                      <span className={`text-[8px] sm:text-[9px] font-mono tabular-nums px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full transition-all duration-300 ${
                        isSelected 
                          ? 'bg-[#7C5CFF]/25 text-[#A88CFF]' 
                          : 'bg-zinc-900/60 text-zinc-500'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Memories List */}
            <div className="flex-1 flex flex-col overflow-hidden">

              <div className="flex items-center justify-between px-1 pb-2 border-b border-zinc-900/60 shrink-0">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                  {selectedCategory === 'All' 
                    ? 'All Memories' 
                    : selectedCategory === 'Favorites' 
                    ? 'Starred Pinned Memories' 
                    : selectedCategory === 'Secrets' 
                    ? 'Encrypted Secret Vault' 
                    : `${selectedCategory} Memories`} · {filteredItems.length}
                </span>
                <div className="flex items-center gap-3 text-[10px] text-zinc-650 font-semibold">
                  {/* View Mode controls */}
                  <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-0.5 shadow-inner">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-[#7C5CFF]/15 text-[#A88CFF]' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Detailed List"
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`p-1 rounded-md transition-colors ${
                        viewMode === 'compact' 
                          ? 'bg-[#7C5CFF]/15 text-[#A88CFF]' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Single Line List"
                    >
                      <Menu className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-[#7C5CFF]/15 text-[#A88CFF]' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Detailed Grid"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid3')}
                      className={`p-1 rounded-md transition-colors ${
                        viewMode === 'grid3' 
                          ? 'bg-[#7C5CFF]/15 text-[#A88CFF]' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="3x3 Grid"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pt-5 pb-36 px-1 pr-3.5 scroll-smooth">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-24">
                    <Mosaic color="#ba31cc" size="small" text="" textColor="" />
                    <p className="text-xs text-zinc-550 mt-4">Retrieving stashed memories…</p>
                  </div>
                )}

                {!isLoading && error && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 text-xs text-red-305">
                    {error}
                  </div>
                )}

                {!isLoading && !error && filteredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-955/25 border border-zinc-900/50 rounded-2xl p-8 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center mb-3.5">
                      {selectedCategory === 'All' 
                        ? <img src="./Stash.png" className="w-6 h-6 opacity-30 object-contain grayscale" alt="Stash Logo" />
                        : getCategoryIcon(selectedCategory, 'w-6 h-6')
                      }
                    </div>
                    <p className="text-xs font-semibold text-zinc-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {items.length === 0 ? 'Start stashing right now' : 'No matching results'}
                    </p>
                    <div className="text-[11px] text-zinc-500 mt-2.5 leading-relaxed">
                      {items.length === 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Press</span>
                          <kbd className="bg-zinc-900/80 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 shadow-sm">Ctrl</kbd>
                          <span>+</span>
                          <kbd className="bg-zinc-900/80 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 shadow-sm">C</kbd>
                          <span>to get it here.</span>
                        </div>
                      ) : (
                        'Try searching for something else, or clear the search filters.'
                      )}
                    </div>
                  </div>
                )}

                {!isLoading && !error && filteredItems.length > 0 && (
                  <div className={
                    viewMode === 'grid3'
                      ? 'grid grid-cols-3 gap-2.5 items-start'
                      : viewMode === 'grid4'
                      ? 'grid grid-cols-4 gap-1.5 items-start'
                      : viewMode === 'grid'
                      ? 'grid grid-cols-2 gap-3 items-start'
                      : viewMode === 'compact'
                      ? 'space-y-1.5'
                      : 'space-y-3.5'
                  }>
                    {filteredItems.map(item => {
                      const revealed = revealedSecrets[item.id] || !item.isEncrypted;
                      const isExpanded = expandedItems[item.id];
                      
                      if (viewMode === 'grid' || viewMode === 'grid3' || viewMode === 'grid4') {
                        // Grid Mode: 2x2, 3x3, or 4x4 with full height content filling
                        const isGrid2 = viewMode === 'grid';
                        const isGrid4 = viewMode === 'grid4';
                        return (
                          <SpotlightCard
                            key={item.id}
                            spotlightColor={getCategorySpotlightColor(item.category)}
                            onClick={() => isStashItActive ? toggleStashCopy(item.id) : handleCopy(item)}
                            className={`group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-xl overflow-hidden transition-all duration-205 ${
                              isGrid2 ? 'p-3.5 min-h-[170px]' : isGrid4 ? 'p-2 aspect-square' : 'p-2.5 aspect-square'
                            } flex flex-col justify-between cursor-pointer shadow-sm ${
                              stashCopyIds.includes(item.id) 
                                ? 'border border-[#7C5CFF]/70 shadow-[0_0_10px_rgba(124,92,255,0.12)] bg-[#7C5CFF]/[0.02]' 
                                : 'border border-white/[0.06] hover:border-white/[0.12]'
                            } border-l-[3.5px] ${getCategoryBorderColor(item.category)} ${getCategoryGlow(item.category)}`}
                            title={isStashItActive ? "Click to toggle Stash selection" : "Click to copy"}
                          >
                            {/* Top Header Bar */}
                            <div className="flex items-center justify-between shrink-0 mb-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                                <div className={`${isGrid4 ? 'w-4.5 h-4.5' : isGrid2 ? 'w-6.5 h-6.5' : 'w-5.5 h-5.5'} shrink-0 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center`}>
                                  {getCategoryIcon(item.category, isGrid4 ? 'w-2.5 h-2.5' : isGrid2 ? 'w-3.5 h-3.5' : 'w-3 h-3')}
                                </div>
                                <span className={`${isGrid4 ? 'text-[8px]' : isGrid2 ? 'text-[11px]' : 'text-[9.5px]'} font-bold text-zinc-200 truncate`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                                  {item.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                  className={`p-1 transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                                  title={item.isFavorite ? "Unpin" : "Pin to top"}
                                >
                                  <Bookmark className={`w-3 h-3 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleStashCopy(item.id); }}
                                  className={`p-1 transition-colors ${stashCopyIds.includes(item.id) ? 'text-[#A88CFF]' : 'text-zinc-500 hover:text-zinc-300'}`}
                                  title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Add to Stash Copy"}
                                >
                                  <Layers className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Content Body - Fills Full Card Space */}
                            <div className="flex-1 min-h-0 w-full flex flex-col justify-center my-1 overflow-hidden">
                              {isImageItem(item) ? (
                                <div className="w-full h-full min-h-[60px] border border-zinc-800/80 bg-black/60 rounded-lg overflow-hidden flex items-center justify-center p-0.5">
                                  {item.content.includes('<img ') ? (
                                    <div className="flex items-center gap-1 overflow-x-auto w-full h-full p-0.5">
                                      {(item.content.match(/src="([^"]+)"/g) || []).map((m, idx) => {
                                        const src = m.replace(/^src="/, '').replace(/"$/, '');
                                        return <img key={idx} src={src} className="h-full object-cover rounded" alt={`Image ${idx + 1}`} />;
                                      })}
                                    </div>
                                  ) : (
                                    <img src={item.content} className="h-full w-full object-cover rounded-md" alt="Image preview" />
                                  )}
                                </div>
                              ) : (
                                <p className={`${isGrid4 ? 'text-[7.5px] line-clamp-2' : isGrid2 ? 'text-[10.5px] line-clamp-5' : 'text-[9.5px] line-clamp-4'} text-zinc-350 font-mono break-all leading-relaxed`}>
                                  {item.isEncrypted && !revealed ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : item.content}
                                </p>
                              )}
                            </div>

                            {/* Footer & Hover Click to Copy Badge */}
                            <div className="flex items-center justify-between text-[8.5px] font-mono text-zinc-500 shrink-0 pt-0.5">
                              <span>{getItemSizeText(item)}</span>
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#A88CFF] text-[8px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none">
                                Click to Copy
                              </div>
                            </div>
                          </SpotlightCard>
                        );
                      }
                      if (viewMode === 'compact') {
                        // Single-Line Compact List Mode (Clean, Right-Aligned Actions, Hover Click to Copy Badge)
                        return (
                          <SpotlightCard
                            key={item.id}
                            spotlightColor={getCategorySpotlightColor(item.category)}
                            onClick={() => isStashItActive ? toggleStashCopy(item.id) : handleCopy(item)}
                            title={isStashItActive ? "Click to toggle Stash selection" : "Click to copy"}
                            className={`group relative bg-white/[0.01] hover:bg-white/[0.03] rounded-xl overflow-hidden transition-all duration-150 p-2.5 px-3 cursor-pointer shadow-sm flex items-center justify-between gap-3 ${
                              stashCopyIds.includes(item.id)
                                ? 'border border-[#7C5CFF]/70 shadow-[0_0_10px_rgba(124,92,255,0.12)] bg-[#7C5CFF]/0.02'
                                : 'border border-white/[0.04] hover:border-white/[0.08]'
                            } border-l-[3px] ${getCategoryBorderColor(item.category)} ${getCategoryGlow(item.category)}`}
                          >
                            {/* Left Side: Category Icon + Details + Content */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center">
                                {getCategoryIcon(item.category, 'w-3 h-3')}
                              </div>
                              <span className="text-[9.5px] font-mono uppercase tracking-wide text-zinc-400 font-bold shrink-0">
                                {item.category}
                              </span>
                              <span className="text-zinc-650 text-[10px] shrink-0">·</span>
                              <span className="text-[9.5px] text-zinc-500 font-mono shrink-0">
                                {getItemSizeText(item)}
                              </span>
                              <span className="text-zinc-650 text-[10px] shrink-0">·</span>
                              <p className="text-[11.5px] text-zinc-300 font-mono truncate min-w-0 flex-1">
                                {item.isEncrypted && !revealed ? '••••••••' : item.content}
                              </p>
                            </div>

                            {/* Right Side: Click to Copy Hover Badge + Action Icons (Right-Aligned) */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto justify-end">
                              <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#A88CFF] text-[8.5px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none shrink-0 mr-1">
                                Click to Copy
                              </span>
                              {item.isEncrypted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] }));
                                  }}
                                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                                  title={revealed ? 'Hide secret' : 'Reveal secret'}
                                >
                                  {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className={`p-1 rounded hover:bg-zinc-800 transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}`}
                                title={item.isFavorite ? 'Unpin' : 'Pin to top'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStashCopy(item.id);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  stashCopyIds.includes(item.id) ? 'text-[#A88CFF] bg-[#7C5CFF]/15' : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                                title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Add to Stash Copy"}
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(item);
                                }}
                                className={`p-1 rounded transition-all ${
                                  copiedId === item.id ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
                                }`}
                                title="Copy to clipboard"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(item.id);
                                }}
                                className="p-1 rounded hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </SpotlightCard>
                        );
                      }

                      // Option 1 & 3: Previous Detailed Views (list = detailed list, grid = detailed grid)
                      return (
                        <SpotlightCard
                          key={item.id}
                          draggable={true}
                          onDragStart={(e) => {
                            if (item.content) {
                              e.dataTransfer.setData('text/plain', item.content);
                              e.dataTransfer.setData('text', item.content);
                            }
                          }}
                          spotlightColor={getCategorySpotlightColor(item.category)}
                          onClick={() => isStashItActive ? toggleStashCopy(item.id) : handlePasteItem(item)}
                          title={isStashItActive ? "Click to toggle Stash selection" : "Click to paste into active window (Win+V style)"}
                          className={`group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 p-4 shadow-md shadow-black/20 cursor-pointer ${
                            stashCopyIds.includes(item.id) 
                              ? 'border border-[#7C5CFF]/70 shadow-[0_0_12px_rgba(124,92,255,0.25)] bg-[#7C5CFF]/[0.04]' 
                              : 'border border-white/[0.06] hover:border-white/[0.12]'
                          } border-l-[3.5px] ${getCategoryBorderColor(item.category)} ${getCategoryGlow(item.category)}`}
                        >
                          {/* Header Details & Action Bar */}
                          <div className="flex items-center justify-between gap-3 mb-3">
                            {/* Left: Category Icon & Metadata */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 shrink-0 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-inner">
                                {getCategoryIcon(item.content.startsWith('data:image') || item.content.includes('<img ') ? 'Image' : item.category, 'w-4 h-4')}
                              </div>
                              <div className="flex flex-col min-w-0 justify-center">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-300 font-bold shrink-0 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                                    {item.content.startsWith('data:image') || item.content.includes('<img ') ? 'IMAGE' : item.category}
                                  </span>
                                  {item.title && item.title.toLowerCase() !== item.category.toLowerCase() && (
                                    <span className="text-[11px] font-semibold text-zinc-200 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-400 font-medium mt-1 whitespace-nowrap">
                                  <span>{getItemSizeText(item)}</span>
                                  <span className="text-zinc-600 text-[8px]">•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                    {item.createdAt}
                                  </span>
                                  {item.isFavorite && <Pin className="inline w-2.5 h-2.5 text-amber-400 fill-amber-400/20 ml-0.5" />}
                                </div>
                              </div>
                            </div>

                            {/* Right: Hover Actions + Copy Button + Hover Click to Paste Badge */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#A88CFF] text-[8.5px] font-bold px-2 py-0.5 rounded-md pointer-events-none mr-1">
                                Click to Paste
                              </span>

                              {/* Hover-only quick actions */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-[#07070a]/90 backdrop-blur-sm p-0.5 rounded-lg border border-white/[0.04]">
                                {item.isEncrypted && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] })); }}
                                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                                    title={revealed ? 'Hide secret' : 'Reveal secret'}
                                  >
                                    {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                  className={`p-1 rounded hover:bg-zinc-800 transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}`}
                                  title={item.isFavorite ? 'Unpin' : 'Pin to top'}
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleStashCopy(item.id); }}
                                  className={`p-1 rounded transition-colors ${
                                    stashCopyIds.includes(item.id)
                                      ? 'text-[#A88CFF] bg-[#7C5CFF]/15'
                                      : 'text-zinc-400 hover:text-zinc-200'
                                  }`}
                                  title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Stash It (Add to queue)"}
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                  className="p-1 rounded hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Copy Button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(item); }}
                                className={`p-1.5 rounded-lg border transition-all shadow-sm ${
                                  copiedId === item.id
                                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                    : 'bg-zinc-900 border-white/[0.08] hover:border-white/[0.18] text-zinc-200 hover:text-white'
                                }`}
                                title="Copy to clipboard without pasting"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Content block */}
                          {item.isEncrypted && !revealed ? (
                            <div className="flex flex-col items-center justify-center py-5 bg-red-955/5 border border-red-900/15 rounded-xl text-center text-red-400/80 shadow-inner">
                              <KeyRound className="w-5 h-5 text-red-505 animate-pulse mb-1.5" />
                              <span className="text-[11px] font-semibold tracking-wide">Sensitive Secret Vault Shielded</span>
                              <span className="text-[9px] text-red-500/50 mt-0.5">Click the eye icon to decrypt locally</span>
                            </div>
                          ) : isImageItem(item) ? (
                            <div className="relative border bg-black/40 border-white/[0.05] rounded-xl overflow-hidden max-h-48 flex items-center justify-center p-1.5 shadow-inner select-text">
                              {item.content.includes('<img ') ? (
                                <div className="flex items-center gap-2 overflow-x-auto p-1 max-h-44 w-full">
                                  {(item.content.match(/src="([^"]+)"/g) || []).map((m, idx) => {
                                    const src = m.replace(/^src="/, '').replace(/"$/, '');
                                    return <img key={idx} src={src} className="max-h-40 object-contain rounded-lg border border-white/10" alt={`Stashed image ${idx + 1}`} loading="lazy" />;
                                  })}
                                </div>
                              ) : (
                                <img src={item.content} className="max-h-44 object-contain rounded-lg" alt="Stashed image thumbnail" loading="lazy" />
                              )}
                            </div>
                          ) : (
                            <pre className={`text-[11.5px] font-mono px-3.5 py-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all overflow-y-auto border bg-black/40 border-white/[0.05] text-zinc-300 leading-relaxed shadow-inner ${
                              viewMode === 'grid' ? 'max-h-24' : 'max-h-36'
                            }`}>
                              {item.content}
                            </pre>
                          )}
                        </SpotlightCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──────── TAB: ASK STASH ──────── */}
        {activeTab === 'ask' && (
          <div className="flex-1 flex flex-col overflow-hidden relative" style={{
            backgroundImage: "linear-gradient(to bottom, rgba(7, 8, 15, 0.92), rgba(11, 12, 22, 0.96)), url('./bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            {/* Ask Stash Header */}
            <header className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-zinc-950/60 backdrop-blur-xl shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#A88CFF] flex items-center justify-center shadow-lg shadow-[#7C5CFF]/25 border border-white/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Ask Stash</h2>
              </div>

              <button
                onClick={() => {
                  setChatMessages([
                    {
                      id: 'welcome',
                      sender: 'stash',
                      text: useApiKey
                        ? `Hello! I am Stash connected to live AI (${activeProvider.toUpperCase()}). Ask me questions about code, API integrations, technical queries, or your recent clipboard history!`
                        : "Hello! I am Stash, your offline clipboard search engine. Ask me anything about your copied snippets, API keys, terminal commands, or developer reference guides!",
                      timestamp: Date.now()
                    }
                  ]);
                }}
                className="p-2 rounded-xl border border-white/[0.06] hover:border-red-500/30 bg-white/[0.02] hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-all cursor-pointer shadow-sm"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </header>

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 w-full ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}
                >
                  {msg.sender === 'stash' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#121326] to-[#1d1f3b] border border-[#7C5CFF]/30 flex items-center justify-center shrink-0 shadow-md shadow-[#7C5CFF]/10">
                      <img src="./Stash.png" className="w-4 h-4 object-contain" alt="Stash Logo" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] sm:max-w-[82%] border shadow-lg transition-all ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#7C5CFF]/20 to-[#6849E6]/25 border-[#7C5CFF]/40 text-white rounded-br-xs shadow-[#7C5CFF]/10'
                      : 'bg-white/[0.03] backdrop-blur-md border-white/[0.08] text-zinc-200 rounded-bl-xs shadow-black/40'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/[0.04]">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${msg.sender === 'user' ? 'text-[#C4B5FD]' : 'text-[#A88CFF]'}`}>
                        {msg.sender === 'user' ? 'You' : 'Ask Stash'}
                      </span>
                      <span className="text-[9.5px] text-zinc-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap font-sans text-zinc-200 leading-relaxed">{msg.text}</p>

                    {/* Matched Items Rendering */}
                    {msg.matchedItems && msg.matchedItems.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-2.5">
                        <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-1">Relevant Clipboard Matches:</span>
                        {msg.matchedItems.map(item => {
                          const revealed = revealedSecrets[item.id] || !item.isEncrypted;
                          const isExpanded = expandedItems[item.id] || false;
                          const isLong = item.content.length > 120 || item.content.includes('\n');
                          return (
                            <SpotlightCard key={item.id} spotlightColor={getCategorySpotlightColor(item.category)} className="relative bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 pl-4 flex flex-col gap-2 shadow-inner">
                              <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${getCategoryColor(item.category)}`} />
                              
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {getCategoryIcon(item.category, 'w-3.5 h-3.5 text-zinc-300')}
                                  <span className="text-xs font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    {item.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {item.isEncrypted && (
                                    <button
                                      onClick={() => setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] }))}
                                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                    >
                                      {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  
                                  {/* Expand/Collapse Toggle Button */}
                                  {(!item.isEncrypted || revealed) && isLong && (
                                    <button
                                      onClick={() => setExpandedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                                      title={isExpanded ? 'Collapse content' : 'Expand full content'}
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => toggleStashCopy(item.id)}
                                    className={`p-1 rounded border transition-all ${
                                      stashCopyIds.includes(item.id)
                                        ? 'bg-[#7C5CFF]/20 border-[#7C5CFF]/40 text-[#A88CFF]'
                                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                    }`}
                                    title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Stash It (Add to queue)"}
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCopy(item)}
                                    className={`p-1 rounded border text-zinc-400 hover:text-zinc-200 transition-all ${
                                      copiedId === item.id ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'border-transparent hover:bg-zinc-800'
                                    }`}
                                    title="Copy to clipboard"
                                  >
                                    {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                              {item.category === 'Image' ? (
                                <div className="relative border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden max-h-48 flex items-center justify-center p-1.5 shadow-inner">
                                  <img src={item.content} className="max-h-44 object-contain rounded-lg" alt="Stashed image thumbnail" loading="lazy" />
                                </div>
                              ) : (
                                <pre className={`text-[11px] font-mono p-2.5 rounded-lg break-all overflow-x-auto whitespace-pre-wrap leading-relaxed transition-all duration-250 ${
                                  isExpanded ? 'max-h-[350px] overflow-y-auto' : 'max-h-16 overflow-hidden'
                                } ${
                                  item.isEncrypted && !revealed ? 'bg-red-955/5 text-red-500/40 border border-red-900/10' : 'bg-black/60 border border-white/[0.05] text-zinc-300'
                                }`}>
                                  {item.isEncrypted && !revealed ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (Encrypted)' : item.content}
                                </pre>
                              )}
                            </SpotlightCard>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#A88CFF] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md shadow-[#7C5CFF]/30 border border-white/20">
                      U
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 w-full mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#121326] to-[#1d1f3b] border border-[#7C5CFF]/30 flex items-center justify-center shrink-0">
                    <img src="./Stash.png" className="w-4 h-4 object-contain animate-pulse" alt="Stash Logo" />
                  </div>
                  <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-xs text-zinc-400 flex items-center gap-2 shadow-md">
                    <span className="w-2 h-2 bg-[#7C5CFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#9375FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#A88CFF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] font-medium text-zinc-400 ml-1">Analyzing context...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Glowing Modern Input Bar */}
            <div className="p-3.5 sm:p-4 border-t border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl shrink-0">
              <div className="w-full flex items-center bg-zinc-900/90 border border-zinc-800 focus-within:border-[#7C5CFF] rounded-2xl p-1.5 shadow-2xl transition-all duration-300 gap-2 focus-within:shadow-[0_0_20px_rgba(124,92,255,0.2)]">
                <input
                  type="text"
                  placeholder={useApiKey ? `Ask ${activeProvider.toUpperCase()} AI or query clipboard...` : "Ask Stash... (e.g. 'API keys', 'Docker commands', 'MongoDB url')"}
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSubmit(chatQuery)}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 py-2 px-3 text-white text-xs sm:text-sm placeholder-zinc-500 min-w-0"
                />

                <button
                  onClick={() => handleChatSubmit(chatQuery)}
                  disabled={!chatQuery.trim()}
                  className="bg-[#7C5CFF] hover:bg-[#6849E6] disabled:opacity-40 disabled:hover:bg-[#7C5CFF] text-white p-2.5 rounded-xl transition-all shadow-md shadow-[#7C5CFF]/30 shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────── TAB: COLLECTIONS ──────── */}
        {activeTab === 'collections' && (
          <div className="flex-1 flex flex-col pt-8 px-4 pb-4 overflow-y-auto">
            {/* Nav path */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-550 mb-6 shrink-0">
              <Folder className="w-4 h-4 text-sky-405" />
              <button onClick={() => setSelectedCollection(null)} className="hover:text-zinc-200">Collections</button>
              {selectedCollection && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-650" />
                  <span className="text-zinc-200 font-semibold">{selectedCollection}</span>
                </>
              )}
            </div>

            {/* Folder Grid */}
            {!selectedCollection ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>AI Smart Collections</h2>
                  <p className="text-xs text-zinc-500 mt-1">Stash automatically structures your clipboard history into contextual folders in real time. Zero setup required.</p>
                </div>
                
                {/* 📌 ALWAYS PINNED AT TOP: Stash Pad Collection Folder */}
                <div className="mb-6">
                  <SpotlightCard
                    spotlightColor="rgba(124, 92, 255, 0.2)"
                    onClick={() => setSelectedCollection('Stash Pad Notes')}
                    className="group cursor-pointer bg-gradient-to-r from-[#15162b] via-[#101122] to-[#0d0e1b] border-2 border-[#7C5CFF]/50 hover:border-[#7C5CFF] p-5 sm:p-6 rounded-2xl transition-all duration-300 shadow-[0_0_28px_rgba(124,92,255,0.2)] hover:shadow-[0_0_38px_rgba(124,92,255,0.38)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-44 h-44 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#7C5CFF]/25 border border-[#7C5CFF]/50 flex items-center justify-center text-[#A88CFF] group-hover:scale-105 transition-all shadow-inner shrink-0">
                          <Pin className="w-5 h-5 rotate-[30deg] text-[#A88CFF]" />
                        </div>
                        <h3 className="text-lg font-extrabold text-white group-hover:text-[#A88CFF] transition-colors whitespace-nowrap" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          Stash Pad
                        </h3>
                      </div>

                      <div className="shrink-0">
                        <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-[#7C5CFF]/25 border border-[#7C5CFF]/45 text-[#A88CFF] shadow-sm block">
                          {(collections['Stash Pad Notes'] || []).length} items
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>

                {/* REST OF THE COLLECTION FOLDERS BELOW IT */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Other Smart Collections</h3>
                  
                  {Object.keys(collections).filter(k => k !== 'Stash Pad Notes').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-zinc-950/20 border border-zinc-900 rounded-2xl p-6">
                      <Folder className="w-7 h-7 text-zinc-700 mb-2" />
                      <p className="text-xs text-zinc-500">No other collections grouped yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(collections).filter(([name]) => name !== 'Stash Pad Notes').map(([name, groupItems]) => (
                        <SpotlightCard
                          key={name}
                          spotlightColor={getCategorySpotlightColor(groupItems[0]?.category || 'Text')}
                          onClick={() => setSelectedCollection(name)}
                          className="group cursor-pointer bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] p-4 rounded-2xl transition-all shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-950/20 border border-sky-900/20 flex items-center justify-center text-sky-404 group-hover:bg-sky-900/30 transition-all shadow-inner">
                              <Folder className="w-5 h-5 fill-sky-400/5" />
                            </div>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-550 shadow-sm">
                              {groupItems.length} items
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>{name}</h3>
                          <p className="text-[11px] text-zinc-550 truncate mt-1">
                            Contains {groupItems.map(i => i.title).slice(0, 3).join(', ')}...
                          </p>
                        </SpotlightCard>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Folder Items Detail */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-2 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{selectedCollection}</h2>
                    <p className="text-xs text-zinc-555 mt-0.5">Memories grouped inside this collection.</p>
                  </div>
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Back to folders
                  </button>
                </div>

                <div className="space-y-2">
                  {collections[selectedCollection as string]?.map(item => {
                    const revealed = revealedSecrets[item.id] || !item.isEncrypted;
                    return (
                      <SpotlightCard
                        key={item.id}
                        spotlightColor={getCategorySpotlightColor(item.category)}
                        className="group relative bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden p-4 pl-4.5 transition-all shadow-md"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${getCategoryColor(item.category)}`} />
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {getCategoryIcon(item.category)}
                            <span className="text-[13px] font-bold text-zinc-200 truncate group-hover:text-white transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                            {item.isEncrypted && (
                              <button
                                onClick={() => setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] }))}
                                className="p-1.5 rounded hover:bg-zinc-850 text-zinc-550 hover:text-zinc-200 transition-colors"
                                title={revealed ? 'Hide secret' : 'Reveal secret'}
                              >
                                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className={`p-1.5 rounded hover:bg-zinc-850 transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-zinc-555 hover:text-amber-450'}`}
                              title={item.isFavorite ? 'Unpin' : 'Pin to top'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                            </button>
                            <button
                              onClick={() => toggleStashCopy(item.id)}
                              className={`p-1.5 rounded border transition-all ${
                                stashCopyIds.includes(item.id)
                                  ? 'bg-[#7C5CFF]/20 border-[#7C5CFF]/40 text-[#A88CFF]'
                                  : 'border-transparent hover:bg-zinc-850 text-zinc-550 hover:text-zinc-200'
                              }`}
                              title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Stash It (Add to queue)"}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopy(item)}
                              className={`p-1.5 rounded border transition-all ${
                                copiedId === item.id ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'border-transparent hover:bg-zinc-850 text-zinc-550'
                              }`}
                              title="Copy to clipboard"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1.5 rounded hover:bg-red-955/20 text-zinc-555 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {item.category === 'Image' ? (
                          <div className="relative border bg-zinc-950 border-zinc-900/60 rounded-xl overflow-hidden max-h-32 flex items-center justify-center p-1.5 shadow-inner">
                            <img src={item.content} className="max-h-28 object-contain rounded-lg" alt="Stashed image thumbnail" />
                          </div>
                        ) : (
                          <pre className="text-[11px] font-mono px-3.5 py-2.5 rounded-lg border bg-zinc-950 border-zinc-900/60 text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all max-h-28 shadow-inner leading-relaxed">
                            {/* test comment */}
                            {item.isEncrypted && !revealed ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : item.content}
                          </pre>
                        )}
                      </SpotlightCard>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────── TAB: STICKY NOTES / STASH PAD ──────── */}
        {activeTab === 'notes' && (
          <div className="flex-1 flex flex-col pt-8 px-6 pb-6 overflow-y-auto w-full">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Pin className="w-5 h-5 text-indigo-400 rotate-[30deg] animate-pulse" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Stash Pad</h2>
            </div>
            
            <p className="text-xs text-zinc-500 mb-5 leading-normal shrink-0">
              A local scratchpad to scribble ideas, draft commands, or paste text dumps. Automatically saved to local storage.
            </p>

            <div className="flex-1 flex flex-col min-h-[300px] bg-white/[0.01] border border-white/[0.05] rounded-3xl p-4 shadow-inner relative group focus-within:border-[#7C5CFF]/30 transition-all duration-300">
              {/* Volumetric glow backdrop */}
              <div className="absolute inset-0 bg-[#7C5CFF]/1 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none blur-sm" />
              
              <textarea
                value={stickyNote}
                onChange={e => setStickyNote(e.target.value)}
                placeholder="Paste code blocks, raw texts, or brainstorm here..."
                className="w-full flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-zinc-200 placeholder-zinc-600 resize-none font-mono leading-relaxed"
                style={{ minHeight: '200px' }}
              />

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04] shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!stickyNote.trim()) return;
                      // Add to stash database!
                      const runAdd = async () => {
                        const classifyText = (t: string) => {
                          const lower = t.toLowerCase();
                          if (/^sk-proj-[a-zA-Z0-9_-]{20,}/.test(t)) return 'API Key';
                          if (/^sk-[a-zA-Z0-9]{32,}/.test(t)) return 'API Key';
                          if (/^(ghp_|gho_|github_pat_)[a-zA-Z0-9]{20,}/.test(t)) return 'API Key';
                          if (/^AIza[0-9A-Za-z-_]{35}/.test(t)) return 'API Key';
                          if (/^[a-f0-9]{32,64}$/.test(t)) return 'API Key';
                          if (/password|passwd|secret|token|apikey|api_key/i.test(lower) && t.length < 200) return 'Secret';
                          if (/^https?:\/\//i.test(t)) return 'URL';
                          
                          // Non-greedy SQL check (doesn't span across paragraphs)
                          if (/\b(select\s+[^\n]{1,100}\bfrom|insert\s+into|update\s+[^\n]{1,100}\bset|delete\s+from|create\s+table|drop\s+table|alter\s+table)\b/i.test(t)) return 'SQL';
                          
                          if (((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) return 'JSON';
                          if (/^(npm|yarn|pnpm|npx|node|git|docker|kubectl|cargo|pip|pip3|python|python3|bash|sh|curl|wget|ssh|cd|ls|mkdir|rm|cp|mv|cat|echo|export|source|chmod|sudo|apt|brew)\s/.test(t)) return 'Command';
                          
                          // AI Prompt templates / prompts
                          const promptPrefixes = ['act as', 'you are a', 'write a', 'generate ', 'explain ', 'summarize ', 'create a ', 'prompt:', 'system prompt', 'user prompt', 'design a', 'how to '];
                          if (promptPrefixes.some(p => lower.startsWith(p)) || /prompt:|system prompt|user prompt/i.test(t)) return 'Prompts';

                          if (t.includes('\n') && /[{};()=>]/.test(t)) return 'Code';
                          if (/\b(const|let|var|function|class|import|export|return|async|await|def|fn|pub|use|struct|interface|type|package|func|go|void|public|private|protected|namespace|using|std|include|define)\b/.test(t)) return 'Code';
                          if (/^([a-zA-Z]:\\|\/[a-zA-Z])/.test(t) || /^\.\/|^\.\.\//.test(t)) return 'Path';
                          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email';
                          return 'Text';
                        };

                        const content = stickyNote.trim();
                        const noteTitle = content.slice(0, 40) + (content.length > 40 ? '...' : '');
                        
                        const tempItem: ClipboardItem = {
                          id: Date.now().toString(),
                          content,
                          title: noteTitle,
                          category: 'Stash Pad',
                          sourceApp: 'Stash Pad',
                          createdAt: 'Just now',
                          timestamp: Date.now(),
                          isFavorite: false,
                          isEncrypted: false,
                        };

                        if (invoke) {
                          try {
                            await invoke('add_item', { 
                              content, 
                              category: 'Stash Pad', 
                              title: noteTitle 
                            });
                            await loadItems();
                            showToast("Saved to Stash Pad!", "Saved to dedicated 'Stash Pad' collection.");
                            setStickyNote('');
                          } catch {
                            setItems(prev => [tempItem, ...prev]);
                            showToast("Saved to Stash Pad!", "Saved to dedicated 'Stash Pad' collection.");
                            setStickyNote('');
                          }
                        } else {
                          setItems(prev => [tempItem, ...prev]);
                          showToast("Saved to Stash Pad!", "Saved to dedicated 'Stash Pad' collection.");
                          setStickyNote('');
                        }
                      };
                      runAdd();
                    }}
                    className="py-2 px-3.5 bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 border border-[#7C5CFF]/20 hover:border-[#7C5CFF]/40 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    disabled={!stickyNote.trim()}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save to Stash</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(stickyNote);
                      setCopiedNote(true);
                      setTimeout(() => setCopiedNote(false), 2000);
                    }}
                    className="py-2 px-3.5 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    disabled={!stickyNote.trim()}
                  >
                    {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNote ? 'Copied!' : 'Copy Note'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setStickyNote('')}
                  className="py-2 px-3.5 text-xs font-semibold text-zinc-550 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent cursor-pointer"
                  disabled={!stickyNote.trim()}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────── TAB: ABOUT STASH ──────── */}
        {activeTab === 'about' && (
          <div className="flex-1 flex flex-col pt-8 px-4 sm:px-6 pb-6 overflow-y-auto w-full relative" style={{
            backgroundImage: "linear-gradient(to bottom, rgba(7, 8, 15, 0.90), rgba(11, 12, 22, 0.94)), url('./bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <div className="max-w-2xl mx-auto w-full space-y-5">
              
              {/* Top Logo and Tagline */}
              <div className="text-center mb-6 mt-2 shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex items-center justify-center mx-auto mb-2.5 shadow-inner relative group">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#7C5CFF] to-[#A88CFF] opacity-10 blur-sm" />
                  <img src="./Stash.png" className="w-7 h-7 sm:w-8 sm:h-8 object-contain z-10" alt="Stash Logo" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Stash
                </h2>
                <p className="text-xs text-[#A88CFF] font-semibold mt-0.5">
                  Your Offline Search Engine for Ctrl + C
                </p>
              </div>

              {/* Cosmic Hero Card: The Dev Reality Check */}
              <div className="relative overflow-visible bg-[#0B0C16] bg-gradient-to-r from-[#0F1020] via-[#17182D] to-[#0A0B14] border border-white/[0.06] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:block shrink-0">
                <div className="flex justify-center sm:block">
                  <img 
                    src="./stashorb.png" 
                    className="w-40 h-40 sm:w-28 sm:h-28 object-contain animate-space-float drop-shadow-[0_0_20px_rgba(124,92,255,0.5)] pointer-events-none z-10 mb-2 sm:mb-0 sm:absolute sm:-right-4 sm:-top-4" 
                    alt="Stash Orb Satellite" 
                  />
                </div>
                <div className="w-full sm:pr-24 text-left py-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    The Dev Reality Check
                  </h2>
                  <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed mt-2">
                    Drowning in a raw pile of connection strings, API keys, and terminal commands? Stash automatically structures, names, and indexes your clipboard history locally in real-time.
                  </p>
                </div>
              </div>

              {/* Creator Profile & Open Source Section */}
              <SpotlightCard className="bg-[#121324]/90 border border-[#7C5CFF]/30 hover:border-[#7C5CFF]/50 p-4 sm:p-5 rounded-2xl shadow-xl relative overflow-hidden transition-all shrink-0">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#A88CFF] flex items-center justify-center text-white font-black text-base shadow-md shadow-[#7C5CFF]/30 shrink-0 border border-white/20">
                      JD
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          Joydeep Das
                        </h3>
                        <span className="text-[10px] font-extrabold bg-[#7C5CFF]/25 text-[#C4B5FD] px-2 py-0.5 rounded-full border border-[#7C5CFF]/40 tracking-wide">
                          Creator & Lead Architect
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-indigo-300 italic mt-0.5">
                        Fellow Confused Engineer 🚀
                      </p>
                    </div>
                  </div>

                  <p className="text-[12px] sm:text-[12.5px] text-zinc-300 leading-relaxed mb-4">
                    Built to ensure you never lose an SSH key, API token, or database query at 4:00 AM again.
                  </p>

                  {/* Social & Contact Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    <button
                      onClick={() => {
                        const url = 'https://github.com/joydeep-das';
                        if (invoke) {
                          invoke('open_external', { url }).catch(() => window.open(url, '_blank'));
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-100 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md group"
                    >
                      <Github className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                      <span>GitHub Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        const url = 'https://www.linkedin.com/in/joydeep-das-78123522a';
                        if (invoke) {
                          invoke('open_external', { url }).catch(() => window.open(url, '_blank'));
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      className="py-2.5 px-3 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/35 border border-[#0A66C2]/40 hover:border-[#0A66C2]/60 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0A66C2]/10 group"
                    >
                      <Linkedin className="w-4 h-4 text-[#70B5F9] group-hover:text-white transition-colors" />
                      <span>LinkedIn</span>
                    </button>
                  </div>

                  {/* Creator Email Badge */}
                  <button
                    onClick={() => {
                      const url = 'mailto:joy.thesloth@gmail.com';
                      if (invoke) {
                        invoke('open_external', { url }).catch(() => window.open(url, '_blank'));
                      } else {
                        window.open(url, '_blank');
                      }
                    }}
                    className="w-full py-2 px-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.15] text-xs font-medium text-zinc-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    <span>joy.thesloth@gmail.com</span>
                  </button>
                </div>
              </SpotlightCard>

              {/* How Stash Saves Your Sanity */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 rounded-2xl shadow-md shrink-0">
                <h3 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3.5" style={{ fontFamily: 'Outfit, sans-serif' }}>How Stash Saves Your Sanity</h3>
                
                <div className="space-y-3.5 sm:space-y-4">
                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Local Semantic Search</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Query your clipboard offline. Ask "where is my MongoDB url?" and Stash indexes the relevance instantly.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Smart Auto-Titles</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Raw tokens (JWTs, hashes, API keys) receive descriptive, readable titles automatically.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <Folder className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Zero-Setup Smart Folders</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Developer code, secrets, and urls are dynamically categorized into separate collections.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">100% Offline Vault</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Runs completely locally. API keys, secrets, and credentials are encrypted on-device.</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Developer Reality & Sarcasm Quotes */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 rounded-2xl shadow-md shrink-0">
                <div className="flex items-center gap-2 mb-3.5">
                  <Quote className="w-4 h-4 text-amber-400 rotate-180 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Developer Reality Quote</h3>
                </div>
                
                <div className="space-y-3 text-zinc-300">
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11.5px] sm:text-[12.5px] italic leading-relaxed">
                    "Ctrl + C and Ctrl + V isn't a design pattern, but it's 90% of your codebase. Don't worry, your secrets are safe here."
                  </div>
                </div>
              </SpotlightCard>

            </div>
          </div>
        )}

        {/* ──────── TAB: WHAT'S STASH & GUIDE ──────── */}
        {activeTab === 'guide' && (
          <div className="flex-1 flex flex-col pt-8 px-4 sm:px-6 pb-6 overflow-y-auto w-full relative" style={{
            backgroundImage: "linear-gradient(to bottom, rgba(7, 8, 15, 0.90), rgba(11, 12, 22, 0.94)), url('./bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            {/* Top Title */}
            <div className="text-center mb-6 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-[#7C5CFF]/10">
                <HelpCircle className="w-6 h-6 text-[#A88CFF]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                What's Stash?
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Your local clipboard search engine. Stash automatically indexes and organizes everything you copy into searchable categories.
              </p>
            </div>

            {/* Content Cards */}
            <div className="space-y-4 max-w-2xl mx-auto w-full">
              
              {/* Keyboard Shortcuts Card */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 rounded-2xl shadow-md">
                <div className="flex items-center gap-2 mb-3.5">
                  <Command className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>System Hotkeys & Shortcuts</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                    <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10.5px] font-mono font-bold text-indigo-300 shrink-0 shadow-sm">
                      Alt + Space
                    </div>
                    <div className="text-[11.5px] text-zinc-300">
                      <strong className="text-white block font-bold">Summon / Dismiss Drawer</strong>
                      Toggle Stash window from anywhere on your computer.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                    <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10.5px] font-mono font-bold text-violet-300 shrink-0 shadow-sm">
                      Ctrl + C
                    </div>
                    <div className="text-[11.5px] text-zinc-300">
                      <strong className="text-white block font-bold">Auto-Capture Memory</strong>
                      Copy text, images, SQL, or API keys to auto-store and title them.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                    <div className="px-2 py-1 bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 rounded text-[10.5px] font-mono font-bold text-[#A88CFF] shrink-0 shadow-sm">
                      Stash It Mode
                    </div>
                    <div className="text-[11.5px] text-zinc-300">
                      <strong className="text-white block font-bold">Multi-Select & Combine Copy</strong>
                      Click purple <strong>Stash It</strong> sidebar button to merge clips.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                    <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10.5px] font-mono font-bold text-emerald-300 shrink-0 shadow-sm">
                      Stash Pad
                    </div>
                    <div className="text-[11.5px] text-zinc-300">
                      <strong className="text-white block font-bold">Local Scratchpad</strong>
                      Paste raw ideas into Stash Pad to categorize & save.
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* How To Use Stash - Feature Overview */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 rounded-2xl shadow-md">
                <h3 className="text-xs sm:text-sm font-bold text-violet-400 uppercase tracking-wider mb-3.5" style={{ fontFamily: 'Outfit, sans-serif' }}>Feature Guide</h3>
                
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Ask Stash (Local Q&A & Search)</h4>
                      <p className="text-[11.5px] text-zinc-400 mt-0.5 leading-relaxed">Search your stashed memory using queries like "Stripe API key" or view developer references offline.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Smart Collections & Categories</h4>
                      <p className="text-[11.5px] text-zinc-400 mt-0.5 leading-relaxed">Access categorized collections for Code Snippets, Secrets, Emojis, E-mails, Images, URLs, and DB Queries.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                    <div>
                      <h4 className="text-xs font-bold text-white">5 View Feed Modes</h4>
                      <p className="text-[11.5px] text-zinc-400 mt-0.5 leading-relaxed">Switch between Detailed List, Compact Rows, Detailed Grid, 3x3 Grid, and 4x4 Grid layouts seamlessly using the top right layout toggle.</p>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

            </div>
          </div>
        )}

        {/* ──────── TAB: SETTINGS ──────── */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col pt-8 px-6 pb-6 overflow-y-auto w-full">
            <div className="flex items-center justify-center gap-2 mb-6 shrink-0">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings & Configurations</h2>
            </div>

            <div className="space-y-4 w-full">
              {/* AI Engine & API Keys Settings Card */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <Sparkles className="w-3.5 h-3.5 text-[#A88CFF]" />
                    Inject Your Own API Key
                  </h3>
                  
                  {/* Toggle Switch for API Keys */}
                  <button
                    onClick={() => {
                      const next = !useApiKey;
                      setUseApiKey(next);
                      localStorage.setItem('stash_use_api_keys', String(next));
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useApiKey ? 'bg-[#7C5CFF]' : 'bg-zinc-800'
                    }`}
                    title="Toggle API Key mode for Ask Stash"
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      useApiKey ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Dropdown Select Provider & Single API Key Input Field */}
                <div className="pt-2.5 border-t border-white/[0.04] space-y-2.5">
                  {/* Select AI Provider Dropdown */}
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Select AI Provider</label>
                    <div className="relative">
                      <select
                        value={activeProvider}
                        onChange={e => {
                          const provider = e.target.value;
                          setActiveProvider(provider);
                          localStorage.setItem('stash_active_provider', provider);
                        }}
                        className="w-full bg-zinc-950/90 border border-zinc-800 hover:border-[#7C5CFF]/50 focus:border-[#7C5CFF] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white focus:outline-none transition-all appearance-none cursor-pointer shadow-sm pr-7"
                      >
                        <option value="openai" className="bg-zinc-900 text-white">⚡ OpenAI (GPT-4o / GPT-4o-mini)</option>
                        <option value="gemini" className="bg-zinc-900 text-white">✨ Google Gemini (Gemini 1.5 Flash)</option>
                        <option value="groq" className="bg-zinc-900 text-white">🚀 Groq Cloud (Llama 3.3 70B)</option>
                        <option value="mistral" className="bg-zinc-900 text-white">🌌 Mistral AI (Mistral Small)</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Single Dynamic API Key Input Box */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-medium">
                      <span className="text-zinc-300">
                        {activeProvider === 'openai' && 'OpenAI API Key'}
                        {activeProvider === 'gemini' && 'Google Gemini API Key'}
                        {activeProvider === 'groq' && 'Groq Cloud API Key'}
                        {activeProvider === 'mistral' && 'Mistral AI API Key'}
                      </span>
                      <span className="text-[#A88CFF] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Provider Key
                      </span>
                    </div>

                    {activeProvider === 'openai' && (
                      <input
                        type="password"
                        placeholder="Enter OpenAI API key (sk-...)"
                        value={openaiKey}
                        onChange={e => {
                          setOpenaiKey(e.target.value);
                          localStorage.setItem('stash_openai_key', e.target.value);
                        }}
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-[#7C5CFF] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none transition-all shadow-inner"
                      />
                    )}

                    {activeProvider === 'gemini' && (
                      <input
                        type="password"
                        placeholder="Enter Gemini API key (AIza...)"
                        value={geminiKey}
                        onChange={e => {
                          setGeminiKey(e.target.value);
                          localStorage.setItem('stash_gemini_key', e.target.value);
                        }}
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-[#7C5CFF] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none transition-all shadow-inner"
                      />
                    )}

                    {activeProvider === 'groq' && (
                      <input
                        type="password"
                        placeholder="Enter Groq API key (gsk_...)"
                        value={groqKey}
                        onChange={e => {
                          setGroqKey(e.target.value);
                          localStorage.setItem('stash_groq_key', e.target.value);
                        }}
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-[#7C5CFF] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none transition-all shadow-inner"
                      />
                    )}

                    {activeProvider === 'mistral' && (
                      <input
                        type="password"
                        placeholder="Enter Mistral API key (mistral-...)"
                        value={mistralKey}
                        onChange={e => {
                          setMistralKey(e.target.value);
                          localStorage.setItem('stash_mistral_key', e.target.value);
                        }}
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-[#7C5CFF] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none transition-all shadow-inner"
                      />
                    )}

                    {/* Compact Equal Width Save & Delete Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          let currentVal = '';
                          if (activeProvider === 'openai') {
                            localStorage.setItem('stash_openai_key', openaiKey);
                            currentVal = openaiKey;
                          } else if (activeProvider === 'gemini') {
                            localStorage.setItem('stash_gemini_key', geminiKey);
                            currentVal = geminiKey;
                          } else if (activeProvider === 'groq') {
                            localStorage.setItem('stash_groq_key', groqKey);
                            currentVal = groqKey;
                          } else if (activeProvider === 'mistral') {
                            localStorage.setItem('stash_mistral_key', mistralKey);
                            currentVal = mistralKey;
                          }
                          if (currentVal.trim()) {
                            showToast("API Key Saved!", `${activeProvider.toUpperCase()} key saved.`);
                          } else {
                            showToast("Notice", "API key field is empty.");
                          }
                        }}
                        className="w-full py-1.5 px-2 bg-[#7C5CFF] hover:bg-[#6849E6] text-white text-[11px] font-bold rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap active:scale-[0.98]"
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Save Key</span>
                      </button>

                      <button
                        onClick={() => {
                          if (activeProvider === 'openai') {
                            setOpenaiKey('');
                            localStorage.removeItem('stash_openai_key');
                          } else if (activeProvider === 'gemini') {
                            setGeminiKey('');
                            localStorage.removeItem('stash_gemini_key');
                          } else if (activeProvider === 'groq') {
                            setGroqKey('');
                            localStorage.removeItem('stash_groq_key');
                          } else if (activeProvider === 'mistral') {
                            setMistralKey('');
                            localStorage.removeItem('stash_mistral_key');
                          }
                          showToast("API Key Cleared!", `${activeProvider.toUpperCase()} key removed.`);
                        }}
                        className="w-full py-1.5 px-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-red-400 hover:text-red-300 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap active:scale-[0.98]"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Memory Retention Setting */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl shadow-md">
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Memory Retention Policy</h3>
                <p className="text-[11px] text-zinc-500 mb-3.5">Set how long Stash should keep clipboard items before auto-clearing them. Pinned starred items are always kept.</p>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 3, label: '3 Days' },
                    { value: 7, label: '7 Days' },
                    { value: 0, label: 'Forever' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setRetentionDays(option.value);
                        localStorage.setItem('stash_retention_days', String(option.value));
                        if (option.value > 0) {
                          const cutoffTime = Date.now() - option.value * 24 * 60 * 60 * 1000;
                          const toDelete = items.filter(item => {
                            if (item.isFavorite) return false;
                            const itemTime = item.timestamp || (item.createdAt ? new Date(item.createdAt).getTime() : 0);
                            return itemTime > 0 && itemTime < cutoffTime;
                          });
                          if (toDelete.length > 0) {
                            const ids = new Set(toDelete.map(i => i.id));
                            setItems(prev => prev.filter(i => !ids.has(i.id)));
                            if (invoke) {
                              toDelete.forEach(item => {
                                invoke('delete_item', { id: item.id }).catch(() => {});
                              });
                            }
                          }
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        retentionDays === option.value
                          ? 'bg-[#7C5CFF]/15 text-white border-[#7C5CFF]/45 shadow-[0_2px_8px_rgba(124,92,255,0.15)]'
                          : 'bg-zinc-950/60 border-zinc-900 text-zinc-450 hover:text-zinc-200 hover:border-zinc-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </SpotlightCard>

              {/* Backup & Export Vault Settings */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl shadow-md">
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Backup & Export Vault</h3>
                <p className="text-[11px] text-zinc-500 mb-3.5">Backup, restore or export your entire memory database. Choose your preferred option below.</p>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={handleExportTXT}
                    className="py-2.5 px-3 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export as TXT</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="py-2.5 px-3 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Export as PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.04] pt-3">
                  <button
                    onClick={handleExportJSON}
                    className="py-2.5 px-3 bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 border border-[#7C5CFF]/20 hover:border-[#7C5CFF]/40 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#A88CFF]" />
                    <span>Backup Database (JSON)</span>
                  </button>
                  <button
                    onClick={triggerImportJSON}
                    className="py-2.5 px-3 bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-900/20 hover:border-emerald-900/40 text-xs font-bold text-emerald-450 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-450" />
                    <span>Restore / Import JSON</span>
                  </button>
                </div>
              </SpotlightCard>

              {/* Database Setting */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl shadow-md">
                <h3 className="text-sm font-bold text-white mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>Local Storage Database</h3>
                <p className="text-xs text-zinc-500 mb-3">Stash operates 100% offline. Your data is stored locally in your Electron app directory.</p>
                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-xs font-mono text-zinc-455 truncate shadow-inner mb-4">
                  UserData\stash_db.json
                </div>
                
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-2 px-3 bg-red-950/20 hover:bg-red-950/30 border border-red-900/20 hover:border-red-900/40 text-xs font-bold text-red-400 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Stashed Items</span>
                </button>
              </SpotlightCard>

              {/* Encryption Status */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl flex items-start gap-3.5 shadow-md">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/20 border border-emerald-900/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>Local-First Security Shield</h3>
                  <p className="text-xs leading-normal text-zinc-450">Stash automatically detects secrets (like API keys and tokens) and holds them encrypted in a local vault. They never touch external clouds.</p>
                </div>
              </SpotlightCard>

              {/* Global shortcut config */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl flex items-start gap-3.5 shadow-md">
                <div className="w-9 h-9 rounded-xl bg-indigo-950/20 border border-indigo-900/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>Global Shortcut</h3>
                  <p className="text-xs leading-normal text-zinc-400">Press <kbd className="bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 px-2 py-0.5 rounded text-xs font-mono font-bold text-[#A88CFF] shadow-sm">Alt + V</kbd> anywhere on your computer to summon or dismiss the Stash drawer. <span className="text-zinc-500">(Fallback: Alt+B, Alt+Space)</span></p>
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* ── Sleek Lavender Floating Minimize Line at Bottom (Zero Background Container) ────────────────── */}
        <button
          onClick={async () => {
            try {
              if (typeof window !== 'undefined' && (window as any).electron?.invoke) {
                await (window as any).electron.invoke('minimize_window');
              } else if (invoke) {
                await invoke('minimize_window');
              }
            } catch (err) {
              console.error('Minimize failed:', err);
            }
          }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 py-2 px-8 group cursor-pointer transition-all duration-300 active:scale-95 border-none outline-none bg-transparent"
          title="Click to minimize Stash window"
        >
          <div className="w-28 sm:w-36 h-[4px] rounded-full bg-[#A88CFF] group-hover:bg-[#c4b2ff] group-hover:w-44 shadow-[0_0_12px_rgba(168,140,255,0.85)] group-hover:shadow-[0_0_20px_rgba(168,140,255,1)] transition-all duration-300" />
          <span className="sr-only">Minimize Stash</span>
        </button>
      </main>

      {/* ── Clear All Confirm Modal ────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
              <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Clear all memories?
              </h3>
            </div>
            <p className="text-xs text-zinc-450 mb-5 leading-normal">
              This permanently deletes all {items.length} clipboard entries. Stash AI will forget these context maps. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs text-zinc-450 hover:text-white hover:bg-zinc-850 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 text-xs bg-red-650 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Memory Retention Alert Modal ────────────── */}
      {staleItemsToClear.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 text-indigo-400 mb-3">
              <Clock className="w-6 h-6 animate-pulse" />
              <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Memory Retention Policy
              </h3>
            </div>
            <p className="text-xs text-zinc-300 mb-5 leading-relaxed">
              Your configured <strong>{localStorage.getItem('stash_retention_days') || '3'} Days</strong> retention policy has identified <strong>{staleItemsToClear.length} stale memories</strong>. 
              Would you like to clear them directly, or export them to a file first?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  // Export as TXT
                  const textContent = staleItemsToClear.map(item => {
                    return `========================================\nTITLE: ${item.title}\nCATEGORY: ${item.category}\nDATE: ${item.createdAt}\n----------------------------------------\n${item.content}\n========================================\n\n`;
                  }).join('\n');
                  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `stash_retention_export_${new Date().toISOString().slice(0, 10)}.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                  
                  // Now clear them
                  const idsToDelete = new Set(staleItemsToClear.map(i => i.id));
                  setItems(prev => prev.filter(i => !idsToDelete.has(i.id)));
                  if (invoke) {
                    staleItemsToClear.forEach(item => {
                      invoke('delete_item', { id: item.id }).catch(() => {});
                    });
                  }
                  setStaleItemsToClear([]);
                }}
                className="w-full py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Export & Clear History
              </button>
              
              <button
                onClick={() => {
                  const idsToDelete = new Set(staleItemsToClear.map(i => i.id));
                  setItems(prev => prev.filter(i => !idsToDelete.has(i.id)));
                  if (invoke) {
                    staleItemsToClear.forEach(item => {
                      invoke('delete_item', { id: item.id }).catch(() => {});
                    });
                  }
                  setStaleItemsToClear([]);
                }}
                className="w-full py-2 px-3 text-xs bg-red-650 hover:bg-red-600 text-white font-semibold rounded-xl transition-all cursor-pointer"
              >
                Clear Stale Memories
              </button>
              
              <button
                onClick={() => setStaleItemsToClear([])}
                className="w-full py-2 px-3 text-xs text-zinc-400 hover:text-white hover:bg-zinc-850 rounded-xl transition-all border border-transparent cursor-pointer"
              >
                Keep For Now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden input for backup file restoration */}
      <input
        type="file"
        ref={importFileRef}
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      </div>
    </div>
  );
}

