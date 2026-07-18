import { DevKnowledgeItem } from '../knowledgeBase';

export const DEVOPS_KNOWLEDGE: DevKnowledgeItem[] = [
  {
    id: 'cmd_docker',
    keywords: ['docker', 'container', 'docker command', 'compose'],
    title: 'Docker & Docker Compose Essential CLI',
    category: 'Command',
    language: 'Bash',
    description: 'Daily container operations cheatsheet.',
    content: `docker run -d -p 8080:80 --name my_app nginx:latest
docker ps -a
docker exec -it my_app /bin/sh
docker logs -f --tail 100 my_app
docker compose up -d --build
docker system prune -af`
  },
  {
    id: 'cmd_git',
    keywords: ['git', 'github', 'commit', 'branch', 'rebase', 'merge'],
    title: 'Git Developer Workflow & Recovery Commands',
    category: 'Command',
    language: 'Bash',
    description: 'Branching, committing, and undoing git mistakes.',
    content: `git status
git add .
git commit -m "feat: expand developer knowledge base"
git push origin main
git checkout -b feature/new-branch
# Undo last commit keeping changes:
git reset --soft HEAD~1`
  },
  {
    id: 'sql_joins_aggregations',
    keywords: ['sql', 'join', 'group by', 'query', 'database', 'postgres', 'mysql'],
    title: 'SQL Master Cheat Sheet (LEFT JOIN, GROUP BY, HAVING)',
    category: 'Code',
    language: 'SQL',
    description: 'Common analytical and relational query patterns.',
    content: `-- Join with aggregation and threshold filtering
SELECT 
    u.id AS user_id, 
    u.email, 
    COUNT(o.id) AS total_orders,
    SUM(o.amount) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.email
HAVING SUM(o.amount) > 500
ORDER BY total_spent DESC;`
  },
  {
    id: 'linux_commands',
    keywords: ['linux', 'bash', 'terminal', 'commands', 'grep', 'find'],
    title: 'Linux CLI Cheat Sheet (awk, grep, find, tar, tail)',
    category: 'Command',
    language: 'Bash',
    description: 'Essential terminal shell commands.',
    content: `# Search text inside files
grep -rnw '/path/to/dir' -e 'pattern'

# Find files matching name pattern
find /path/to/dir -name "*.log" -type f -mtime -7

# Print specific column from space-separated stream
cat access.log | awk '{print $7}' | sort | uniq -c

# Monitor logs in real time
tail -f -n 50 /var/log/syslog`
  },
  {
    id: 'nginx_reverse_proxy',
    keywords: ['nginx', 'reverse proxy', 'server', 'ssl', 'conf'],
    title: 'Nginx Reverse Proxy Server Block Config',
    category: 'Code',
    language: 'Nginx',
    description: 'Nginx virtual host reverse proxy template.',
    content: `server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`
  },
  {
    id: 'github_actions',
    keywords: ['github actions', 'ci/cd', 'workflow', 'yaml', 'yml'],
    title: 'GitHub Actions Node.js CI/CD Workflow Template',
    category: 'Code',
    language: 'YAML',
    description: 'Automated test and build runner.',
    content: `name: Node.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm test`
  }
];
