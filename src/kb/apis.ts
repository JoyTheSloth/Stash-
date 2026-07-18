import { DevKnowledgeItem } from '../knowledgeBase';

export const APIS_KNOWLEDGE: DevKnowledgeItem[] = [
  {
    id: 'api_grok',
    keywords: ['grok', 'xai', 'grok api', 'grok-2', 'grok-beta'],
    title: 'xAI Grok API Request Specs',
    category: 'Code',
    language: 'JSON',
    description: 'xAI Grok API Endpoint (OpenAI Compatible)',
    content: `POST https://api.x.ai/v1/chat/completions
Headers:
  Authorization: Bearer xai-YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "model": "grok-2-latest",
  "messages": [
    { "role": "system", "content": "You are Grok." },
    { "role": "user", "content": "Hello Grok!" }
  ],
  "temperature": 0.7
}`
  },
  {
    id: 'api_gemini',
    keywords: ['gemini', 'google ai', 'gemini api', 'gemini-1.5', 'flash', 'pro'],
    title: 'Google Gemini API Request Specs',
    category: 'Code',
    language: 'JSON',
    description: 'Google Gemini REST API (generateContent)',
    content: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_KEY
Headers:
  Content-Type: application/json

Body:
{
  "contents": [
    {
      "parts": [{ "text": "Explain quantum computing in simple terms." }]
    }
  ]
}`
  },
  {
    id: 'api_claude',
    keywords: ['claude', 'anthropic', 'claude api', 'sonnet', 'haiku', 'opus'],
    title: 'Anthropic Claude API Request Specs',
    category: 'Code',
    language: 'JSON',
    description: 'Anthropic Claude 3.5 Messages API',
    content: `POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: YOUR_CLAUDE_API_KEY
  anthropic-version: 2023-06-01
  Content-Type: application/json

Body:
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    { "role": "user", "content": "Write a high-performance function." }
  ]
}`
  },
  {
    id: 'api_openai',
    keywords: ['openai', 'gpt', 'gpt-4', 'gpt-4o', 'chatgpt'],
    title: 'OpenAI Chat Completions API Specs',
    category: 'Code',
    language: 'JSON',
    description: 'OpenAI v1 Chat Completions API',
    content: `POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer sk-proj-YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "model": "gpt-4o",
  "messages": [
    { "role": "user", "content": "Format JSON response." }
  ]
}`
  },
  {
    id: 'api_deepseek',
    keywords: ['deepseek', 'deepseek api', 'deepseek-coder'],
    title: 'DeepSeek API Request Specs',
    category: 'Code',
    language: 'JSON',
    description: 'DeepSeek REST API',
    content: `POST https://api.deepseek.com/chat/completions
Headers:
  Authorization: Bearer sk-YOUR_DEEPSEEK_KEY
  Content-Type: application/json

Body:
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "user", "content": "Optimize this SQL query." }
  ]
}`
  },
  {
    id: 'api_ollama',
    keywords: ['ollama', 'local llm', 'ollama api'],
    title: 'Ollama Local LLM REST API Specs',
    category: 'Code',
    language: 'JSON',
    description: 'Ollama Local Inference API',
    content: `POST http://localhost:11434/api/generate
Headers:
  Content-Type: application/json

Body:
{
  "model": "llama3",
  "prompt": "Summarize log output.",
  "stream": false
}`
  },
  {
    id: 'api_s3_upload',
    keywords: ['s3', 'aws', 'upload', 's3 bucket', 'aws sdk'],
    title: 'AWS S3 File Upload (Node.js SDK v3)',
    category: 'Code',
    language: 'TypeScript',
    description: 'Standard Amazon Web Services S3 object client upload method.',
    content: `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });

async function uploadFile(bucketName: string, key: string, fileBuffer: Buffer) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: "image/png"
  });

  try {
    const data = await s3.send(command);
    return data;
  } catch (err) {
    console.error("AWS S3 Upload Error:", err);
    throw err;
  }
}`
  }
];
