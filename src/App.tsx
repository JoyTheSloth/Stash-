import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Linkedin
} from 'lucide-react';
import SpotlightCard from './components/SpotlightCard';

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

const CATEGORIES = ['All', 'Favorites', 'Secrets', 'Code', 'Command', 'SQL', 'URL', 'JSON', 'Path', 'Email', 'Emoji', 'Image', 'Text'];

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

  // Memory Retention policy (3 days, 7 days, 0 = forever)
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    return Number(localStorage.getItem('stash_retention_days') || '0');
  });

  // Gemini Search Bar & Speech States
  const [isListening, setIsListening] = useState(false);
  const [aiModel, setAiModel] = useState<'Flash' | 'Pro'>('Flash');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compact' | 'grid' | 'grid3'>('list');

  // Stash Copy (Bulk Copy) feature
  const [stashCopyIds, setStashCopyIds] = useState<string[]>([]);
  const [isStashItActive, setIsStashItActive] = useState<boolean>(false);
  const [stashSeparator, setStashSeparator] = useState<'double_newline' | 'newline' | 'space' | 'comma'>('double_newline');

  const toggleStashCopy = (id: string) => {
    setStashCopyIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleStashCopy = () => {
    if (stashCopyIds.length === 0) return;
    
    const selectedItems = items.filter(item => stashCopyIds.includes(item.id));
    
    let separatorStr = '\n\n';
    if (stashSeparator === 'newline') separatorStr = '\n';
    else if (stashSeparator === 'space') separatorStr = ' ';
    else if (stashSeparator === 'comma') separatorStr = ', ';
    
    const combinedContent = selectedItems.map(item => item.content).join(separatorStr);
    
    if (invoke) {
      invoke('copy_to_clipboard', { content: combinedContent })
        .then(() => {
          setCopiedId('stash_copy_success');
          setTimeout(() => setCopiedId(null), 2000);
          showToast("Multi-Stash Copied!", `Combined ${selectedItems.length} entries into 1 clip!`);
          setStashCopyIds([]);
          setIsStashItActive(false);
        })
        .catch(err => {
          console.error("Failed to copy stash combined text:", err);
          navigator.clipboard.writeText(combinedContent)
            .then(() => {
              setCopiedId('stash_copy_success');
              setTimeout(() => setCopiedId(null), 2000);
              showToast("Multi-Stash Copied!", `Combined ${selectedItems.length} entries into 1 clip!`);
              setStashCopyIds([]);
              setIsStashItActive(false);
            })
            .catch(() => {});
        });
    } else {
      navigator.clipboard.writeText(combinedContent)
        .then(() => {
          setCopiedId('stash_copy_success');
          setTimeout(() => setCopiedId(null), 2000);
          showToast("Multi-Stash Copied!", `Combined ${selectedItems.length} entries into 1 clip!`);
          setStashCopyIds([]);
          setIsStashItActive(false);
        })
        .catch(() => {});
    }
  };

  const startSpeechRecognition = (target: 'search' | 'chat') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try in a compatible environment.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      if (target === 'search') {
        setSearchQuery(prev => (prev ? prev + ' ' + speechToText : speechToText));
      } else {
        setChatQuery(prev => (prev ? prev + ' ' + speechToText : speechToText));
      }
    };
    
    recognition.start();
  };

  // Chat/AI State
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'stash',
      text: "Hello! I am Stash, your AI clipboard memory. Ask me anything about what you've copied. I search context, associate projects, and retrieve passwords or keys without needing exact keywords.",
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
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
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

  // AI Chat handler
  const handleChatSubmit = (queryText: string) => {
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

    // Search logic matching user query
    setTimeout(() => {
      const qLower = queryText.toLowerCase();
      let matches: ClipboardItem[] = [];

      if (qLower.includes('key') || qLower.includes('api') || qLower.includes('token') || qLower.includes('secret')) {
        matches = items.filter(item => 
          item.category === 'API Key' || 
          item.category === 'Secret' || 
          item.title.toLowerCase().includes('key') || 
          item.content.toLowerCase().includes('key')
        );
      } else if (qLower.includes('docker') || qLower.includes('command') || qLower.includes('npm') || qLower.includes('git') || qLower.includes('terminal')) {
        matches = items.filter(item => 
          item.category === 'Command' || 
          item.content.toLowerCase().includes('docker') || 
          item.content.toLowerCase().includes('npm') || 
          item.content.toLowerCase().includes('git')
        );
      } else if (qLower.includes('sql') || qLower.includes('query') || qLower.includes('database') || qLower.includes('db') || qLower.includes('mongo') || qLower.includes('postgres')) {
        matches = items.filter(item => 
          item.category === 'SQL' || 
          item.content.includes('mongodb') || 
          item.title.toLowerCase().includes('db')
        );
      } else if (qLower.includes('url') || qLower.includes('link') || qLower.includes('website') || qLower.includes('http')) {
        matches = items.filter(item => 
          item.category === 'URL' || 
          item.content.startsWith('http')
        );
      } else if (qLower.includes('jwt') || qLower.includes('auth') || qLower.includes('token')) {
        matches = items.filter(item => 
          item.content.toLowerCase().includes('jwt') || 
          item.title.toLowerCase().includes('token') ||
          item.category === 'Secret'
        );
      } else {
        matches = items.filter(item => 
          item.content.toLowerCase().includes(qLower) || 
          item.title.toLowerCase().includes(qLower) || 
          item.category.toLowerCase().includes(qLower)
        );
      }

      let replyText = '';
      if (matches.length > 0) {
        replyText = `I found ${matches.length} matching memory item(s) in your stash database. Here are the top results:`;
      } else {
        replyText = `I couldn't find any clipboard items matching "${queryText}" in my memory. Try copying something like an API key or a terminal command first, then ask me again!`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'stash',
        text: replyText,
        timestamp: Date.now(),
        matchedItems: matches.slice(0, 3)
      };

      setChatMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
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
  const collections = (() => {
    const groups: Record<string, ClipboardItem[]> = {};
    items.forEach(item => {
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
      } else {
        if (!groups['Text & General']) groups['Text & General'] = [];
        groups['Text & General'].push(item);
      }
    });
    return groups;
  })();

  // Calculate statistics for Insights Tab
  const stats = (() => {
    const total = items.length;
    const copiesToday = items.filter(i => i.timestamp && (Date.now() - i.timestamp < 24 * 60 * 60 * 1000)).length;
    const hoursSaved = Math.round((total * 5 / 60) * 10) / 10; // 5 mins per copy
    const duplicateCopies = Math.round(total * 0.15); // Mock deduplicated items percentage
    
    // Category Breakdown
    const categoriesCount = CATEGORIES.reduce((acc, cat) => {
      if (cat === 'All' || cat === 'Favorites') return acc;
      acc[cat] = items.filter(i => {
        if (cat === 'Secrets') return i.category === 'API Key' || i.category === 'Secret';
        return i.category.toLowerCase() === cat.toLowerCase();
      }).length;
      return acc;
    }, {} as Record<string, number>);

    return { total, copiesToday, hoursSaved, duplicateCopies, categoriesCount };
  })();

  // Filter items for the Home view
  const sortedItems = [...items].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (b.timestamp ?? 0) - (a.timestamp ?? 0);
  });

  const filteredItems = sortedItems.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    const catMatch =
      selectedCategory === 'All' ||
      (selectedCategory === 'Favorites' && item.isFavorite) ||
      (selectedCategory === 'Secrets' && (item.category === 'API Key' || item.category === 'Secret')) ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    if (!catMatch) return false;
    if (!query) return true;
    return (
      item.content.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const getCategoryIcon = (cat: string, size = 'w-3.5 h-3.5') => {
    switch (cat) {
      case 'API Key': return <KeyRound className={`${size} text-[#A88CFF]`} />;
      case 'Secret': return <KeyRound className={`${size} text-red-400`} />;
      case 'URL': return <Globe className={`${size} text-emerald-400`} />;
      case 'Code': return <Code2 className={`${size} text-blue-400`} />;
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
      case 'API Key': return 'bg-[#7C5CFF]';
      case 'Secret': return 'bg-red-500';
      case 'URL': return 'bg-emerald-500';
      case 'Code': return 'bg-blue-500';
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

  const getCategoryGlow = (cat: string) => {
    switch (cat) {
      case 'API Key': return 'shadow-[#7C5CFF]/5 hover:border-[#7C5CFF]/30';
      case 'Secret': return 'shadow-red-500/5 hover:border-red-500/30';
      case 'URL': return 'shadow-emerald-500/5 hover:border-emerald-500/30';
      case 'Code': return 'shadow-blue-500/5 hover:border-blue-500/30';
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
      case 'API Key': return 'rgba(124, 92, 255, 0.06)';
      case 'Secret': return 'rgba(239, 68, 68, 0.06)';
      case 'URL': return 'rgba(16, 185, 129, 0.06)';
      case 'Code': return 'rgba(59, 130, 246, 0.06)';
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




  return (
    <div className="flex h-screen w-screen bg-[#07070a] bg-[radial-gradient(ellipse_100%_100%_at_50%_-15%,rgba(124,92,255,0.15),rgba(0,0,0,0))] font-sans text-zinc-100 antialiased overflow-hidden select-none"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Sidebar (iOS Glassmorphism & Apple VisionOS design) ── */}
      <aside className="w-[58px] sm:w-[68px] shrink-0 border-r border-white/10 bg-[#0f1020]/40 flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden shadow-2xl shadow-black/45 transition-all duration-300">
        {/* Soft volumetric gradient glows */}
        <div className="absolute -left-12 top-24 w-40 h-40 rounded-full bg-[#7C5CFF]/5 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 bottom-36 w-40 h-40 rounded-full bg-[#A88CFF]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center w-full">
          {/* Top Section */}
          <div className="pt-5 pb-4 flex justify-center shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#A88CFF] flex items-center justify-center shadow-lg shadow-[#7C5CFF]/20 shrink-0 overflow-hidden transition-all duration-300">
              <img src="/Stash.png" className="w-5.5 h-5.5 sm:w-7 sm:h-7 object-contain relative z-10 transition-all duration-300" alt="Stash Logo" />
            </div>
          </div>

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

        {/* Floating Success Toast */}
        {toast.show && (
          <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5 bg-zinc-900/95 border border-[#7C5CFF]/30 px-4 py-2.5 rounded-xl text-xs text-zinc-200 shadow-2xl backdrop-blur-md">
              <Check className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-white block">{toast.title}</span>
                <span className="text-[10px] text-zinc-400">{toast.desc}</span>
              </div>
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
                    placeholder="Search memories or ask Stash... (Ctrl+F)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runTemplateQuery(searchQuery)}
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 py-1.5 text-zinc-100 text-[13px] placeholder-zinc-550 min-w-0"
                  />

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-zinc-550 hover:text-zinc-300 shrink-0"
                      title="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Microphone speech trigger */}
                  <button
                    onClick={() => startSpeechRecognition('search')}
                    className={`p-1.5 rounded-full transition-all shrink-0 mr-1 relative ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                    title={isListening ? "Listening..." : "Search with speech"}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {isListening && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    )}
                  </button>

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
                { name: 'All', label: 'All', icon: <img src="/Stash.png" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain opacity-70 transition-all duration-300" alt="All" /> },
                { name: 'Favorites', label: 'Starred', icon: <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 transition-all duration-300" /> },
                { name: 'Secrets', label: 'Secrets', icon: <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 transition-all duration-300" /> },
                { name: 'Code', label: 'Code', icon: <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 transition-all duration-300" /> },
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
              {/* Stash Copy Active Panel */}
              {stashCopyIds.length > 0 && (
                <div className="mb-3 bg-gradient-to-r from-[#151622]/90 to-[#0f1020]/90 border border-[#7C5CFF]/30 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_24px_rgba(124,92,255,0.08)] backdrop-blur-xl shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-[#7C5CFF] to-pink-500" />
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/20 flex items-center justify-center text-[#A88CFF]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Stash Copy Queue
                        <span className="text-[10px] font-mono bg-[#7C5CFF]/25 text-[#A88CFF] px-2 py-0.5 rounded-full font-bold">
                          {stashCopyIds.length} items
                        </span>
                      </h3>
                      <p className="text-[10px] text-zinc-450 mt-0.5">Ready to combine and copy to clipboard.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-900 px-2 py-1 rounded-xl">
                      <span className="text-[9.5px] text-zinc-500 font-semibold uppercase tracking-wider">Join:</span>
                      <select
                        value={stashSeparator}
                        onChange={(e) => setStashSeparator(e.target.value as any)}
                        className="bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px] font-bold text-zinc-300 cursor-pointer pr-1 py-0"
                      >
                        <option value="double_newline" className="bg-[#151622]">Double Newlines</option>
                        <option value="newline" className="bg-[#151622]">Single Newline</option>
                        <option value="space" className="bg-[#151622]">Spaces</option>
                        <option value="comma" className="bg-[#151622]">Commas</option>
                      </select>
                    </div>

                    <button
                      onClick={handleStashCopy}
                      className="flex-1 sm:flex-initial py-1.5 px-3 bg-[#7C5CFF] hover:bg-[#6849E6] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === 'stash_copy_success' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
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
                      className="p-1.5 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Clear stash queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

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
                        ? <img src="/Stash.png" className="w-6 h-6 opacity-30 object-contain grayscale" alt="Stash Logo" />
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
                      
                      if (viewMode === 'grid3' || viewMode === 'grid4') {
                        // Strict Grid Mode: compact aspect-square boxes (3x3 or 4x4)
                        return (
                          <SpotlightCard
                            key={item.id}
                            spotlightColor={getCategorySpotlightColor(item.category)}
                            onClick={() => isStashItActive ? toggleStashCopy(item.id) : handleCopy(item)}
                            className={`group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-xl overflow-hidden transition-all duration-205 p-2 flex flex-col justify-between aspect-square cursor-pointer shadow-sm ${
                              stashCopyIds.includes(item.id) 
                                ? 'border border-[#7C5CFF]/70 shadow-[0_0_10px_rgba(124,92,255,0.12)] bg-[#7C5CFF]/[0.02]' 
                                : 'border border-white/[0.06] hover:border-white/[0.12]'
                            } ${getCategoryGlow(item.category)}`}
                            title={isStashItActive ? "Click to toggle Stash selection" : "Click to copy"}
                          >
                            {/* Brand indicator top line */}
                            <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${getCategoryColor(item.category)}`} />
                            
                            <div className="flex items-center justify-between mt-1">
                              <div className={`${viewMode === 'grid4' ? 'w-5 h-5' : 'w-6 h-6'} rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center`}>
                                {getCategoryIcon(item.category, viewMode === 'grid4' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5')}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleStashCopy(item.id); }}
                                  className={`p-1 transition-colors ${stashCopyIds.includes(item.id) ? 'text-[#A88CFF]' : 'text-zinc-550 hover:text-zinc-300'}`}
                                  title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Add to Stash Copy"}
                                >
                                  <Layers className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                  className="p-1 text-zinc-650 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                               </div>
                             </div>

                             <div className="mt-1 flex-1 min-w-0 flex flex-col justify-between">
                               <p className={`${viewMode === 'grid4' ? 'text-[8.5px]' : 'text-[10px]'} font-bold text-zinc-200 truncate`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                                 {item.title}
                               </p>
                               {item.category === 'Image' ? (
                                 <div className={`mt-1 w-full ${viewMode === 'grid4' ? 'h-7' : 'h-10'} border border-zinc-900 bg-black/30 rounded-md overflow-hidden flex items-center justify-center`}>
                                   <img src={item.content} className="h-full w-full object-cover" alt="Image" />
                                 </div>
                               ) : (
                                 <p className={`${viewMode === 'grid4' ? 'text-[7.5px] line-clamp-1' : 'text-[9px] line-clamp-2'} text-zinc-550 font-mono mt-0.5 break-all leading-tight`}>
                                   {item.isEncrypted && !revealed ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : item.content}
                                 </p>
                               )}
                             </div>
                           </SpotlightCard>
                         );
                       }
                        /*




                               )}


                         );
                       }
                        */
                       if (viewMode === 'compact') {
                         // Compact List Mode: single-line rows by default, expandable
                         return (
                           <SpotlightCard
                             key={item.id}
                             spotlightColor={getCategorySpotlightColor(item.category)}
                             onClick={() => isStashItActive ? toggleStashCopy(item.id) : setExpandedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                             className={`group relative bg-white/[0.01] hover:bg-white/[0.03] rounded-xl overflow-hidden transition-all duration-150 p-2 pl-3.5 cursor-pointer shadow-sm flex flex-col ${
                               stashCopyIds.includes(item.id)
                                 ? 'border border-[#7C5CFF]/70 shadow-[0_0_10px_rgba(124,92,255,0.12)] bg-[#7C5CFF]/[0.02]'
                                 : 'border border-white/[0.04] hover:border-white/[0.08]'
                             } ${getCategoryGlow(item.category)}`}
                           >
                             {/* Left brand indicator */}
                             <div className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${getCategoryColor(item.category)}`} />

                             {/* Row Header - Single Line Layout */}
                             <div className="flex items-center justify-between w-full min-w-0">
                               <div className="flex items-center gap-2 min-w-0 flex-1">
                                 <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center">
                                   {getCategoryIcon(item.category, 'w-3 h-3')}
                                 </div>
                                 <p className="text-[12.5px] font-bold text-zinc-200 truncate flex-1 pr-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                   {item.isFavorite && <Pin className="inline w-3 h-3 mr-1 text-amber-450 -mt-0.5 fill-amber-400/20" />}
                                   {item.title}
                                 </p>
                               </div>

                               {/* Actions & Meta right-aligned */}
                               <div className="flex items-center gap-2 shrink-0">
                                 <span className="text-[9px] text-zinc-555 font-mono hidden sm:inline mr-1">{item.createdAt}</span>
                                 
                                 <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded-lg border border-white/[0.03]">
                                   {item.isEncrypted && (
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] }));
                                       }}
                                       className="p-1 rounded hover:bg-zinc-850 text-zinc-555 hover:text-zinc-200 transition-colors"
                                       title={revealed ? 'Hide secret' : 'Reveal secret'}
                                     >
                                       {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                     </button>
                                   )}
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       toggleFavorite(item.id);
                                     }}
                                     className={`p-1 rounded hover:bg-zinc-800 transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-zinc-550'}`}
                                     title={item.isFavorite ? 'Unpin' : 'Pin to top'}
                                   >
                                     <Bookmark className={`w-3 h-3 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                                   </button>
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       toggleStashCopy(item.id);
                                     }}
                                     className={`p-1 rounded transition-colors ${
                                       stashCopyIds.includes(item.id) ? 'text-[#A88CFF] bg-[#7C5CFF]/15' : 'text-zinc-555 hover:text-zinc-200'
                                     }`}
                                     title={stashCopyIds.includes(item.id) ? "Remove from Stash Copy" : "Add to Stash Copy"}
                                   >
                                     <Layers className="w-3 h-3" />
                                   </button>
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleCopy(item);
                                     }}
                                     className={`p-1 rounded border transition-all ${
                                       copiedId === item.id ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-450' : 'border-transparent hover:bg-zinc-800 text-zinc-555'
                                     }`}
                                     title="Copy"
                                   >
                                     {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                   </button>
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       deleteItem(item.id);
                                     }}
                                     className="p-1 rounded hover:bg-red-955/20 text-zinc-555 hover:text-red-400 transition-colors"
                                     title="Delete"
                                   >
                                     <Trash2 className="w-3 h-3" />
                                   </button>
                                 </div>
                               </div>
                             </div>

                            {/* Expanded Content View */}
                            {isExpanded && (
                              <div className="mt-2.5 border-t border-white/[0.03] pt-2 ml-8 transition-all duration-200">
                                {item.isEncrypted && !revealed ? (
                                  <div className="flex flex-col items-center justify-center py-4 bg-red-955/5 border border-red-900/15 rounded-xl text-center text-red-400/80 shadow-inner">
                                    <KeyRound className="w-4 h-4 text-red-505 animate-pulse mb-1" />
                                    <span className="text-[10px] font-semibold">Sensitive Secret Vault Shielded</span>
                                    <span className="text-[8px] text-red-505/50 mt-0.5">Reveal secret to view content</span>
                                  </div>
                                ) : item.category === 'Image' ? (
                                  <div className="relative border bg-black/40 border-white/[0.05] rounded-xl overflow-hidden max-h-48 flex items-center justify-center p-1.5 shadow-inner">
                                    <img src={item.content} className="max-h-44 object-contain rounded-lg" alt="Stashed image" />
                                  </div>
                                ) : (
                                  <pre className="text-[11px] font-mono px-3 py-2 rounded-lg border bg-black/40 border-white/[0.05] text-zinc-300 leading-relaxed shadow-inner overflow-x-auto whitespace-pre-wrap break-all max-h-36 overflow-y-auto">
                                    {item.content}
                                  </pre>
                                )}
                                <div className="flex justify-between items-center text-[9px] text-zinc-600 mt-2 font-mono px-1">
                                  <span>{item.category} · {item.content.length.toLocaleString()} chars</span>
                                  <span>Copied {item.createdAt}</span>
                                </div>
                              </div>
                            )}
                          </SpotlightCard>
                        );
                      }

                      // Option 1 & 3: Previous Detailed Views (list = detailed list, grid = detailed grid)
                      return (
                        <SpotlightCard
                          key={item.id}
                          spotlightColor={getCategorySpotlightColor(item.category)}
                          onClick={() => isStashItActive && toggleStashCopy(item.id)}
                          className={`group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 p-4 shadow-md shadow-black/20 ${
                            stashCopyIds.includes(item.id) 
                              ? 'border border-[#7C5CFF]/70 shadow-[0_0_12px_rgba(124,92,255,0.25)] bg-[#7C5CFF]/[0.04]' 
                              : 'border border-white/[0.06] hover:border-white/[0.12]'
                          } ${getCategoryGlow(item.category)} ${isStashItActive ? 'cursor-pointer' : ''}`}
                        >
                          {/* Left vertical brand indicator */}
                          <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${getCategoryColor(item.category)}`} />

                          {/* Header details */}
                          <div className="flex flex-col gap-1.5 mb-2.5 relative pl-3.5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-7 h-7 shrink-0 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center shadow-inner">
                                  {getCategoryIcon(item.category, 'w-3.5 h-3.5')}
                                </div>
                                <p className="text-[13px] font-bold text-zinc-200 truncate leading-snug group-hover:text-white transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                  {item.isFavorite && <Pin className="inline w-3 h-3 mr-1 text-amber-450 -mt-0.5 fill-amber-400/20" />}
                                  {item.title}
                                </p>
                              </div>

                              {/* Actions overlay on hover */}
                              <div className="absolute right-0 top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-[#07070a]/90 backdrop-blur-sm pl-2 py-0.5 rounded-l-lg z-10">
                                {item.isEncrypted && (
                                  <button
                                    onClick={() => setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] }))}
                                    className="p-1.5 rounded hover:bg-zinc-850 text-zinc-555 hover:text-zinc-200 transition-colors"
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
                                  onClick={() => handleCopy(item)}
                                  className={`p-1.5 rounded border transition-all ${
                                    copiedId === item.id
                                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-450 shadow-sm shadow-emerald-500/10'
                                      : 'border-transparent hover:bg-zinc-850 text-zinc-555 hover:text-zinc-200'
                                  }`}
                                  title="Copy to clipboard"
                                >
                                  {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="p-1.5 rounded hover:bg-red-955/20 text-zinc-650 hover:text-red-405 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Metadata Row: Category on left, Chars count & Clock on right */}
                            <div className="flex items-center justify-between text-[9px] text-zinc-550 font-semibold mt-0.5">
                              <span className="font-mono bg-zinc-900 border border-zinc-800/80 px-1.5 py-0.5 rounded uppercase text-[8px] tracking-wide">
                                {item.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span>{item.content.length.toLocaleString()} chars</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {item.createdAt}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Content block */}
                          {item.isEncrypted && !revealed ? (
                            <div className="flex flex-col items-center justify-center py-5 bg-red-955/5 border border-red-900/15 rounded-xl text-center text-red-400/80 shadow-inner ml-3.5">
                              <KeyRound className="w-5 h-5 text-red-505 animate-pulse mb-1.5" />
                              <span className="text-[11px] font-semibold tracking-wide">Sensitive Secret Vault Shielded</span>
                              <span className="text-[9px] text-red-500/50 mt-0.5">Click the eye icon to decrypt locally</span>
                            </div>
                          ) : item.category === 'Image' ? (
                            <div className="relative border bg-black/40 border-white/[0.05] rounded-xl overflow-hidden max-h-48 flex items-center justify-center p-1.5 ml-3.5 shadow-inner select-text">
                              <img src={item.content} className="max-h-44 object-contain rounded-lg" alt="Stashed image thumbnail" />
                            </div>
                          ) : (
                            <pre className={`text-[11.5px] font-mono px-3.5 py-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all overflow-y-auto border bg-black/40 border-white/[0.05] text-zinc-300 leading-relaxed shadow-inner ml-3.5 ${
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
            backgroundImage: "linear-gradient(to bottom, rgba(7, 8, 15, 0.90), rgba(11, 12, 22, 0.94)), url('/bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            {/* Header */}
            <header className="px-6 py-4 border-b border-zinc-900/40 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-400" />
                <h2 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>Ask Stash</h2>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 w-full ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}
                >
                  {msg.sender === 'stash' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-900/30 flex items-center justify-center shrink-0 shadow-md">
                      <img src="/Stash.png" className="w-4 h-4 object-contain" alt="Stash Logo" />
                    </div>
                  )}
                  <div className={`p-4 rounded-[20px] text-sm leading-relaxed max-w-[85%] border shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-[#7C5CFF]/10 border-[#7C5CFF]/20 text-indigo-200 rounded-br-none shadow-[#7C5CFF]/5'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-305 rounded-bl-none'
                  }`}>
                    {msg.sender === 'user' ? (
                      <span className="font-semibold text-indigo-400 uppercase text-[10px] block mb-1">You</span>
                    ) : (
                      <span className="font-semibold text-zinc-400 uppercase text-[10px] block mb-1">Stash AI</span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Matched Items Rendering */}
                    {msg.matchedItems && msg.matchedItems.length > 0 && (
                      <div className="mt-3.5 space-y-2.5 border-t border-zinc-800/50 pt-3">
                        {msg.matchedItems.map(item => {
                          const revealed = revealedSecrets[item.id] || !item.isEncrypted;
                          const isExpanded = expandedItems[item.id] || false;
                          const isLong = item.content.length > 120 || item.content.includes('\n');
                          return (
                            <SpotlightCard key={item.id} spotlightColor={getCategorySpotlightColor(item.category)} className="relative bg-zinc-950/50 border border-zinc-900 rounded-2xl p-3 pl-4.5 flex flex-col gap-2 shadow-inner">
                              <div className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${getCategoryColor(item.category)}`} />
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  {getCategoryIcon(item.category, 'w-3.5 h-3.5')}
                                  <span className="text-[12px] font-bold text-zinc-205 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    {item.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.isEncrypted && (
                                    <button
                                      onClick={() => setRevealedSecrets(p => ({ ...p, [item.id]: !p[item.id] }))}
                                      className="p-1 rounded hover:bg-zinc-850 text-zinc-550 hover:text-zinc-300"
                                    >
                                      {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  
                                  {/* Expand/Collapse Toggle Button */}
                                  {(!item.isEncrypted || revealed) && isLong && (
                                    <button
                                      onClick={() => setExpandedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                                      className="p-1 rounded hover:bg-zinc-850 text-zinc-550 hover:text-zinc-300 transition-colors"
                                      title={isExpanded ? 'Collapse content' : 'Expand full content'}
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleCopy(item)}
                                    className={`p-1 rounded border text-zinc-550 hover:text-zinc-300 transition-all ${
                                      copiedId === item.id ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-450' : 'border-transparent hover:bg-zinc-850'
                                    }`}
                                  >
                                    {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                              {item.category === 'Image' ? (
                                <div className="relative border border-zinc-900 bg-zinc-955 rounded-lg overflow-hidden max-h-48 flex items-center justify-center p-1.5 shadow-inner">
                                  <img src={item.content} className="max-h-44 object-contain rounded-lg" alt="Stashed image thumbnail" />
                                </div>
                              ) : (
                                <pre className={`text-[11px] font-mono p-2.5 rounded-lg break-all overflow-x-auto whitespace-pre-wrap leading-relaxed transition-all duration-250 ${
                                  isExpanded ? 'max-h-[350px] overflow-y-auto' : 'max-h-16 overflow-hidden'
                                } ${
                                  item.isEncrypted && !revealed ? 'bg-red-955/5 text-red-500/40 border border-red-900/10' : 'bg-zinc-950 border border-zinc-900/80 text-zinc-300'
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
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 w-full mr-auto">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-900/30 flex items-center justify-center shrink-0">
                    <img src="/Stash.png" className="w-4 h-4 object-contain" alt="Stash Logo" />
                  </div>
                  <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl rounded-bl-none text-zinc-500 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-[#7C5CFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#7C5CFF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#7C5CFF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/20">
              <div className="w-full flex items-center bg-zinc-900/80 border border-zinc-800 focus-within:border-[#7C5CFF]/60 rounded-2xl p-1.5 shadow-2xl backdrop-blur-sm gap-1">
                <input
                  type="text"
                  placeholder="Ask Stash anything... (e.g. 'Show SQL queries', 'Find OpenAI key')"
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSubmit(chatQuery)}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 py-2 px-3 text-zinc-100 text-sm placeholder-zinc-550 min-w-0"
                />
                
                {/* Speech recognition mic button */}
                <button
                  onClick={() => startSpeechRecognition('chat')}
                  className={`p-2 rounded-xl transition-all relative shrink-0 ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                  title={isListening ? "Listening..." : "Dictate question"}
                >
                  <Mic className="w-4 h-4" />
                  {isListening && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => handleChatSubmit(chatQuery)}
                  className="bg-[#7C5CFF] hover:bg-[#6847ec] text-white p-2.5 rounded-xl transition-all shadow-md shadow-[#7C5CFF]/20 shrink-0"
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
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>AI Smart Collections</h2>
                  <p className="text-xs text-zinc-500 mt-1">Stash automatically structures your clipboard history into contextual folders in real time. Zero setup required.</p>
                </div>
                
                {Object.keys(collections).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-950/20 border border-zinc-900 rounded-2xl p-8">
                    <Folder className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500">No collections grouped yet.</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Copy things containing words like 'TripEva' to watch AI group them automatically.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(collections).map(([name, groupItems]) => (
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
                            <button
                              onClick={() => handleCopy(item)}
                              className={`p-1.5 rounded border transition-all ${
                                copiedId === item.id ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'border-transparent hover:bg-zinc-850 text-zinc-550'
                              }`}
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
                          if (/\b(select\s.+from|insert\s+into|update\s.+set|delete\s+from|create\s+table|drop\s+table|alter\s+table)\b/i.test(t)) return 'SQL';
                          if (((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) return 'JSON';
                          if (/^(npm|yarn|pnpm|npx|node|git|docker|kubectl|cargo|pip|pip3|python|python3|bash|sh|curl|wget|ssh|cd|ls|mkdir|rm|cp|mv|cat|echo|export|source|chmod|sudo|apt|brew)\s/.test(t)) return 'Command';
                          if (t.includes('\n') && /[{};()=>]/.test(t)) return 'Code';
                          if (/\b(const|let|var|function|class|import|export|return|async|await|def|fn|pub|use|struct|interface|type|package|func|go|void|public|private|protected|namespace|using|std|include|define)\b/.test(t)) return 'Code';
                          if (/^([a-zA-Z]:\\|\/[a-zA-Z])/.test(t) || /^\.\/|^\.\.\//.test(t)) return 'Path';
                          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email';
                          return 'Text';
                        };

                        const content = stickyNote.trim();
                        const cat = classifyText(content);
                        const isEnc = cat === 'API Key' || cat === 'Secret';
                        
                        const tempItem = {
                          id: Date.now().toString(),
                          content: stickyNote,
                          title: stickyNote.trim().slice(0, 40) + (stickyNote.length > 40 ? '...' : ''),
                          category: cat,
                          createdAt: new Date().toISOString(),
                          timestamp: Date.now(),
                          isFavorite: false,
                          isEncrypted: isEnc,
                        };

                        if (invoke) {
                          try {
                            await invoke('add_item', { content: stickyNote });
                            await loadItems();
                            showToast("Saved & Categorized!", `Automatically sorted to '${cat}' category.`);
                            setStickyNote('');
                          } catch {
                            setItems(prev => [tempItem, ...prev]);
                            showToast("Saved to Stash", `Sorted to '${cat}' folder.`);
                            setStickyNote('');
                          }
                        } else {
                          setItems(prev => [tempItem, ...prev]);
                          showToast("Saved to Stash", `Sorted to '${cat}' folder.`);
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
            backgroundImage: "linear-gradient(to bottom, rgba(7, 8, 15, 0.90), rgba(11, 12, 22, 0.94)), url('/bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <div className="max-w-2xl mx-auto w-full space-y-5">
              
              {/* Top Logo and Tagline */}
              <div className="text-center mb-6 mt-2 shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex items-center justify-center mx-auto mb-2.5 shadow-inner relative group">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#7C5CFF] to-[#A88CFF] opacity-10 blur-sm" />
                  <img src="/Stash.png" className="w-7 h-7 sm:w-8 sm:h-8 object-contain z-10" alt="Stash Logo" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Stash
                </h2>
                <p className="text-xs text-[#A88CFF] font-semibold mt-0.5">
                  Your ChatGPT for Ctrl + C
                </p>
              </div>

              {/* Cosmic Hero Card: The Dev Reality Check */}
              <div className="relative overflow-visible bg-[#0B0C16] bg-gradient-to-r from-[#0F1020] via-[#17182D] to-[#0A0B14] border border-white/[0.06] rounded-3xl p-4 sm:p-5 sm:pt-6 shadow-2xl flex flex-col sm:block shrink-0">
                <div className="flex justify-center sm:block">
                  <img 
                    src="/stashorb.png" 
                    className="w-48 h-48 sm:w-32 sm:h-32 object-contain animate-space-float drop-shadow-[0_0_20px_rgba(124,92,255,0.5)] pointer-events-none z-10 mb-2 sm:mb-0 sm:absolute sm:-right-6 sm:-top-6" 
                    alt="Stash Orb Satellite" 
                  />
                </div>
                <div className="w-full sm:pr-24 text-left py-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    The Dev Reality Check
                  </h2>
                  <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed mt-2">
                    Every day you copy API keys, Mongo connection strings, SQL queries, and terminal scripts. Traditional clipboard managers dump them into a raw, chronological pile. In a few hours, finding what you copied becomes a frustrating scroll-fest where you wonder who wrote that code. (Spoiler alert: it was you, at 4:00 AM).
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
                    Built with desperation and caffeine so you never lose an SSH key, Mongo connection string, or uncommitted regex script at 4:00 AM again.
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
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Semantic AI Search</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Ask "where is my OpenAI key?" even if you never copied the text "OpenAI key". Stash connects the dots. (And yes, that includes the database URL you pasted in panic).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Smart AI Titles</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Instead of displaying a raw character dump like <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] text-zinc-450 border border-zinc-900 break-all">eyJhbGciOiJIUzI1NiIsInR5cCI...</code>, Stash titles it <i>"Super Secret JWT that probably should not be on your clipboard."</i> You're welcome.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <Folder className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Dynamic Smart Folders</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Stash groups developer code, secrets, and project workflows dynamically into Collections automatically. Zero manual drag-and-drop. We know you are too lazy to organize files.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300">
                    <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-white block mb-0.5">Local-First Vault</strong>
                      <span className="text-[11.5px] sm:text-[12.5px] text-zinc-400 leading-relaxed block">Stash runs 100% locally. We encrypt passwords and tokens because we know you have a habit of keeping secrets in unprotected `.env` files. We won't judge, but we will protect you.</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Developer Reality & Sarcasm Quotes */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 rounded-2xl shadow-md shrink-0">
                <div className="flex items-center gap-2 mb-3.5">
                  <Quote className="w-4 h-4 text-amber-400 rotate-180 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Developer Reality & Sarcasm</h3>
                </div>
                
                <div className="space-y-3 text-zinc-300">
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11.5px] sm:text-[12.5px] italic leading-relaxed">
                    "It works on my machine. ¯\_(ツ)_/¯ — Famous last words before pushing to production and going on vacation."
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11.5px] sm:text-[12.5px] italic leading-relaxed">
                    "Ctrl + C and Ctrl + V isn't a design pattern, but it's 90% of your codebase. Don't worry, your secrets are safe with us."
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[11.5px] sm:text-[12.5px] italic leading-relaxed">
                    "There are only two hard things in Computer Science: cache invalidation, naming variables, and remembering where you pasted that database credentials string 10 minutes ago."
                  </div>
                </div>
              </SpotlightCard>

            </div>
          </div>
        )}

        {/* ──────── TAB: WHAT'S STASH & GUIDE ──────── */}
        {activeTab === 'guide' && (
          <div className="flex-1 flex flex-col pt-8 px-4 sm:px-6 pb-6 overflow-y-auto w-full relative" style={{
            backgroundImage: "linear-gradient(to bottom, rgba(7, 8, 15, 0.90), rgba(11, 12, 22, 0.94)), url('/bg.png')",
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
                Your AI-powered local clipboard memory system. Stash automatically organizes everything you copy into searchable smart folders.
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
                    <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Ask Stash (AI Search)</h4>
                      <p className="text-[11.5px] text-zinc-400 mt-0.5 leading-relaxed">Ask natural questions like "What was the Stripe API key I copied yesterday?" or "Find my Docker compose command".</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Smart Collections & Folders</h4>
                      <p className="text-[11.5px] text-zinc-400 mt-0.5 leading-relaxed">View categorized smart folders for Code Snippets, Secret Tokens, Image Captures, URLs, and DB Credentials.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
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

              {/* Export Vault Setting */}
              <SpotlightCard className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl shadow-md">
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Export Memory Vault</h3>
                <p className="text-[11px] text-zinc-500 mb-3.5">Save your entire clipboard memory database. Choose your preferred format to back up your stashed items.</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleExportTXT}
                    className="flex-1 py-2 px-3 bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 border border-[#7C5CFF]/20 hover:border-[#7C5CFF]/40 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#A88CFF]" />
                    <span>Export as TXT</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex-1 py-2 px-3 bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 border border-[#7C5CFF]/20 hover:border-[#7C5CFF]/40 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#A88CFF]" />
                    <span>Export as PDF</span>
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
                  <h3 className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>Global Shortcuts</h3>
                  <p className="text-xs leading-normal text-zinc-455">Press <kbd className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 shadow-sm">Alt + Space</kbd> anywhere on your system to summon or dismiss the Stash drawer window helper.</p>
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}
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
    </div>
  );
}
