import { DevKnowledgeItem } from '../knowledgeBase';

export const DSA_KNOWLEDGE: DevKnowledgeItem[] = [
  {
    id: 'dsa_lru_cache',
    keywords: ['lru', 'lru cache', 'least recently used', 'cache', 'dsa', 'data structure'],
    title: 'LRU Cache (HashMap + Doubly LinkedList)',
    category: 'Code',
    language: 'TypeScript',
    description: 'Constant time cache eviction policy implementation.',
    content: `class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value); // move to most recent
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`
  },
  {
    id: 'dsa_binary_search',
    keywords: ['binary search', 'search', 'dsa', 'algorithm', 'logarithmic', 'cpp', 'c++'],
    title: 'Binary Search Algorithm (Iterative & Lower Bound)',
    category: 'Code',
    language: 'C++',
    description: 'O(log N) search on sorted arrays in C++.',
    content: `#include <vector>
#include <iostream>

int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
  },
  {
    id: 'dsa_two_pointers',
    keywords: ['two pointers', 'sliding window', 'dsa', 'array', 'algorithm'],
    title: 'Two Pointers Pattern (Container With Most Water / Pair Sum)',
    category: 'Code',
    language: 'JavaScript',
    description: 'Optimal linear O(N) array search pattern.',
    content: `// Two Pointers: Find pair with target sum in sorted array
function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}`
  },
  {
    id: 'dsa_trie',
    keywords: ['trie', 'prefix tree', 'dsa', 'autocomplete', 'dictionary'],
    title: 'Trie (Prefix Tree) Data Structure',
    category: 'Code',
    language: 'TypeScript',
    description: 'Fast O(L) prefix lookup and search.',
    content: `class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
}

class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children.has(ch)) curr.children.set(ch, new TrieNode());
      curr = curr.children.get(ch)!;
    }
    curr.isEndOfWord = true;
  }

  startsWith(prefix: string): boolean {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children.has(ch)) return false;
      curr = curr.children.get(ch)!;
    }
    return true;
  }
}`
  },
  {
    id: 'dsa_bfs_dfs_graph',
    keywords: ['graph', 'bfs', 'dfs', 'breadth first', 'depth first', 'dsa'],
    title: 'Graph Traversal (BFS & DFS in JavaScript)',
    category: 'Code',
    language: 'JavaScript',
    description: 'Queue-based BFS and recursive DFS graph search.',
    content: `// Breadth-First Search (Shortest Path in unweighted graph)
function bfs(graph, startNode) {
  const visited = new Set([startNode]);
  const queue = [startNode];
  while (queue.length > 0) {
    const node = queue.shift();
    console.log("Visited:", node);
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`
  },
  {
    id: 'dsa_merge_sort',
    keywords: ['merge sort', 'sorting', 'divide and conquer', 'dsa', 'algorithm'],
    title: 'Merge Sort Algorithm (Stable O(N log N) Sorting)',
    category: 'Code',
    language: 'TypeScript',
    description: 'Classic divide and conquer sorting algorithm.',
    content: `function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let l = 0, r = 0;
  while (l < left.length && r < right.length) {
    if (left[l] < right[r]) result.push(left[l++]);
    else result.push(right[r++]);
  }
  return [...result, ...left.slice(l), ...right.slice(r)];
}`
  },
  {
    id: 'dsa_sliding_window',
    keywords: ['sliding window', 'subarray', 'max sum', 'dsa', 'algorithm'],
    title: 'Sliding Window Pattern (Max Sum Subarray of Size K)',
    category: 'Code',
    language: 'TypeScript',
    description: 'Linear time O(N) sliding window implementation.',
    content: `function maxSubarraySum(arr: number[], k: number): number {
  if (arr.length < k) return 0;
  let maxSum = 0, tempSum = 0;
  for (let i = 0; i < k; i++) tempSum += arr[i];
  maxSum = tempSum;
  for (let i = k; i < arr.length; i++) {
    tempSum = tempSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, tempSum);
  }
  return maxSum;
}`
  },
  {
    id: 'dsa_knapsack_dp',
    keywords: ['knapsack', 'dynamic programming', 'dp', '0/1 knapsack', 'dsa'],
    title: '0/1 Knapsack Problem (Dynamic Programming Bottom-Up)',
    category: 'Code',
    language: 'TypeScript',
    description: 'Solve the classic optimization knapsack problem in O(N * W).',
    content: `function knapsack(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= W; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(values[i - 1] + dp[i - 1][w - weights[i - 1]], dp[i - 1][w]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}`
  }
];
