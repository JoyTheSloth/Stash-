const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove CornerDownLeft import
content = content.replace(', CornerDownLeft', '');

// Remove CornerDownLeft button blocks
const buttonPattern1 = /<button\s+onClick=\{\(e\) => \{\s+e\.stopPropagation\(\);\s+handlePasteItem\(item\);\s+\}\}\s+className="p-1\.5 rounded border border-white\/\[0\.06\] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"\s+title="Paste into active application \(Auto-pastes & minimizes Stash\)"\s+>\s+<CornerDownLeft className="w-3\.5 h-3\.5 text-\[#A88CFF\]" \/>\s+<\/button>/g;

const buttonPattern2 = /<button\s+onClick=\{\(e\) => \{\s+e\.stopPropagation\(\);\s+handlePasteItem\(item\);\s+\}\}\s+className="p-1\.5 rounded-lg border border-white\/\[0\.08\] hover:border-white\/\[0\.18\] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all shadow-sm flex items-center gap-1 text-\[10\.5px\] font-bold"\s+title="Paste into active application \(Auto-pastes & minimizes Stash\)"\s+>\s+<CornerDownLeft className="w-3\.5 h-3\.5 text-\[#A88CFF\]" \/>\s+<span className="hidden sm:inline">Paste<\/span>\s+<\/button>/g;

content = content.replace(/title="Copy to clipboard \(Keeps Stash open\)"/g, 'title="Copy to clipboard"');

// Clean up any remaining CornerDownLeft JSX blocks safely
content = content.split('\r\n').join('\n'); // normalize line endings to LF

// Replace compact mode paste button
const compactPasteBtn = `                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePasteItem(item);
                                      }}
                                      className="p-1.5 rounded border border-white/[0.06] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
                                      title="Paste into active application (Auto-pastes & minimizes Stash)"
                                    >
                                      <CornerDownLeft className="w-3.5 h-3.5 text-[#A88CFF]" />
                                    </button>`;

content = content.replace(compactPasteBtn, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.tsx cleaned up successfully.');
