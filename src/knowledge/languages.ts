import { DevKnowledgeItem } from '../knowledgeBase';

export const LANGUAGES_KNOWLEDGE: DevKnowledgeItem[] = [
  {
    id: 'cpp_smart_pointers',
    keywords: ['c++', 'cpp', 'smart pointers', 'unique_ptr', 'shared_ptr', 'memory'],
    title: 'C++ Modern Smart Pointers (std::unique_ptr & std::shared_ptr)',
    category: 'Code',
    language: 'C++',
    description: 'RAII memory management without raw deletes.',
    content: `#include <memory>
#include <iostream>

struct Resource {
    void speak() { std::cout << "Resource active!\\n"; }
};

void demo() {
    // Unique ownership (movable, not copyable)
    std::unique_ptr<Resource> uPtr = std::make_unique<Resource>();
    uPtr->speak();

    // Shared reference counting ownership
    std::shared_ptr<Resource> sPtr1 = std::make_shared<Resource>();
    std::shared_ptr<Resource> sPtr2 = sPtr1; // Reference count = 2
}`
  },
  {
    id: 'cpp_fast_io',
    keywords: ['c++', 'cpp', 'fast io', 'cin', 'cout', 'competitive programming'],
    title: 'C++ Competitive Programming Fast I/O Template',
    category: 'Code',
    language: 'C++',
    description: 'Optimized I/O speed for high performance C++ execution.',
    content: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Fast I/O bindings
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (cin >> n) {
        vector<int> a(n);
        for (int i = 0; i < n; i++) cin >> a[i];
        sort(a.begin(), a.end());
    }
    return 0;
}`
  },
  {
    id: 'js_async_await_promise',
    keywords: ['javascript', 'js', 'typescript', 'ts', 'async', 'await', 'promise', 'fetch'],
    title: 'JS Async/Await with Timeout & AbortController',
    category: 'Code',
    language: 'TypeScript',
    description: 'Production-grade async request handling with timeout safeguards.',
    content: `async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}`
  },
  {
    id: 'js_debounce_throttle',
    keywords: ['debounce', 'throttle', 'javascript', 'performance', 'frontend'],
    title: 'Debounce & Throttle Utility Functions',
    category: 'Code',
    language: 'TypeScript',
    description: 'Rate-limiting high frequency DOM events (resize, scroll, keyup).',
    content: `// Debounce: Delay execution until input stops
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle: Limit execution to max once per interval
function throttle<T extends (...args: any[]) => void>(func: T, limit: number) {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
}`
  },
  {
    id: 'python_comprehensions',
    keywords: ['python', 'py', 'list comprehension', 'dict comprehension', 'lambda'],
    title: 'Python List, Dict & Generator Comprehensions',
    category: 'Code',
    language: 'Python',
    description: 'Idiomatic Pythonic data manipulation.',
    content: `# List comprehension with filter
squares = [x**2 for x in range(10) if x % 2 == 0]

# Dict comprehension
char_counts = {char: count for char, count in [('a', 5), ('b', 3)]}

# Generator expression (memory efficient)
sum_squares = sum(x**2 for x in range(100000))`
  },
  {
    id: 'python_decorators',
    keywords: ['python', 'decorator', 'wrapper', 'timing', 'logging'],
    title: 'Python Timing & Logging Decorator Pattern',
    category: 'Code',
    language: 'Python',
    description: 'Wrap functions with execution timing and metadata.',
    content: `import time
from functools import wraps

def function_timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[{func.__name__}] executed in {elapsed:.4f}s")
        return result
    return wrapper`
  },
  {
    id: 'rust_concurrency',
    keywords: ['rust', 'rs', 'concurrency', 'arc', 'mutex', 'thread'],
    title: 'Rust Safe Concurrency (Arc + Mutex across threads)',
    category: 'Code',
    language: 'Rust',
    description: 'Thread-safe shared mutable state without data races.',
    content: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }
    for handle in handles { handle.join().unwrap(); }
    println!("Final count: {}", *counter.lock().unwrap());
}`
  },
  {
    id: 'go_concurrency',
    keywords: ['go', 'golang', 'goroutine', 'channels', 'concurrency'],
    title: 'Go Goroutines & Channels Concurrency Pattern',
    category: 'Code',
    language: 'Go',
    description: 'Go idiomatic worker pool / channel concurrency model.',
    content: `package main
import "fmt"

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }
    for j := 1; j <= 5; j++ { jobs <- j }
    close(jobs)
    for a := 1; a <= 5; a++ { fmt.Println(<-results) }
}`
  },
  {
    id: 'java_streams',
    keywords: ['java', 'streams', 'lambda', 'optional', 'oop'],
    title: 'Java Streams API & Lambda Expressions',
    category: 'Code',
    language: 'Java',
    description: 'Functional programming patterns in modern Java.',
    content: `import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class StreamsDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");
        List<String> filtered = names.stream()
            .filter(name -> name.startsWith("A") || name.length() > 4)
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        System.out.println(filtered);
    }
}`
  }
];
