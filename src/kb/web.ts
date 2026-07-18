import { DevKnowledgeItem } from '../knowledgeBase';

export const WEB_KNOWLEDGE: DevKnowledgeItem[] = [
  {
    id: 'react_hooks_perf',
    keywords: ['react', 'usememo', 'usecallback', 'performance', 'hooks'],
    title: 'React Performance Hooks (useMemo & useCallback)',
    category: 'Code',
    language: 'TypeScript',
    description: 'Prevent unnecessary sub-tree re-renders and heavy computations.',
    content: `import React, { useMemo, useCallback } from 'react';

const ExpensiveList = ({ items, filterText, onItemClick }: any) => {
  // Memoize heavy array filtering
  const filtered = useMemo(() => {
    return items.filter((item: string) => item.toLowerCase().includes(filterText.toLowerCase()));
  }, [items, filterText]);

  // Memoize stable callback reference
  const handleClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  return <div>{filtered.length} items</div>;
};`
  },
  {
    id: 'css_flex_grid',
    keywords: ['css', 'flexbox', 'grid', 'layout', 'tailwind'],
    title: 'CSS Flexbox & Grid Core Properties Cheatsheet',
    category: 'Code',
    language: 'CSS',
    description: 'Quick reference for flex & grid alignment.',
    content: `/* Flexbox Layout Container */
.flex-container {
  display: flex;
  flex-direction: row; /* row | column */
  justify-content: center; /* flex-start | flex-end | center | space-between */
  align-items: center; /* stretch | flex-start | flex-end | center */
  flex-wrap: wrap;
}

/* Grid Layout Container */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}`
  },
  {
    id: 'regex_common',
    keywords: ['regex', 'regular expression', 'email', 'url', 'validation'],
    title: 'Common Regular Expressions (Email, URL, Phone)',
    category: 'Code',
    language: 'JavaScript',
    description: 'Standard regex validation patterns.',
    content: `// 1. Email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

// 2. URL validation
const urlRegex = /^(https?:\\/\\/)?(www\\.)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(\\/\\S*)?$/;

// 3. Phone number (optional country code)
const phoneRegex = /^(\\+?\\d{1,3}[- ]?)?\\d{10}$/;`
  },
  {
    id: 'js_jwt_decode',
    keywords: ['jwt', 'token', 'decode', 'auth', 'jwt decode'],
    title: 'JWT Token Decode (Zero-dependency Local Parser)',
    category: 'Code',
    language: 'JavaScript',
    description: 'Decodes a JSON Web Token payload in pure JS.',
    content: `function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Invalid JWT token format:", error);
    return null;
  }
}`
  },
  {
    id: 'nextjs_app_router',
    keywords: ['nextjs', 'next.js', 'server action', 'app router', 'rsc'],
    title: 'Next.js App Router RSC Fetch & Server Actions',
    category: 'Code',
    language: 'TypeScript',
    description: 'Standard Next.js 14/15 React Server Component data fetching and mutating.',
    content: `// React Server Component (app/page.tsx)
export default async function Page() {
  const res = await fetch('https://api.example.com/data', { next: { revalidate: 3600 } });
  const data = await res.json();

  async function updateAction(formData: FormData) {
    'use server';
    const id = formData.get('id');
    // mutate db or trigger cache revalidation
  }

  return (
    <form action={updateAction}>
      <input type="hidden" name="id" value={data.id} />
      <button type="submit">Submit</button>
    </form>
  );
}`
  },
  {
    id: 'node_express_server',
    keywords: ['express', 'node', 'server', 'express.js', 'backend'],
    title: 'Node.js Express REST API Server Boilerplate',
    category: 'Code',
    language: 'JavaScript',
    description: 'Standard setup for Express backend server with middleware.',
    content: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.post('/api/data', (req, res) => {
  const { name, val } = req.body;
  res.status(201).json({ message: 'Created', received: { name, val } });
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});`
  }
];
