import { DSA_KNOWLEDGE } from './knowledge/dsa';
import { LANGUAGES_KNOWLEDGE } from './knowledge/languages';
import { WEB_KNOWLEDGE } from './knowledge/web';
import { DEVOPS_KNOWLEDGE } from './knowledge/devops';
import { APIS_KNOWLEDGE } from './knowledge/apis';

export interface DevKnowledgeItem {
  id: string;
  keywords: string[];
  title: string;
  category: 'Code' | 'Command' | 'API Key' | 'URL' | 'JSON' | 'Secret';
  language?: string;
  description: string;
  content: string;
}

export const DEV_KNOWLEDGE_BASE: DevKnowledgeItem[] = [
  ...DSA_KNOWLEDGE,
  ...LANGUAGES_KNOWLEDGE,
  ...WEB_KNOWLEDGE,
  ...DEVOPS_KNOWLEDGE,
  ...APIS_KNOWLEDGE
];
