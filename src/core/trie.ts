export class Trie {
  private root: TrieNode;
  
  constructor() {
    this.root = new TrieNode();
  }
  
  insert(word: string): void {
    let current = this.root;
    
    // Convert to lowercase for case-insensitive lookup
    const normalizedWord = word.toLowerCase();
    
    for (const char of normalizedWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.originalWord = word; // Store the original casing
  }
  
  search(word: string): boolean {
    const node = this.findNode(word.toLowerCase());
    return node !== undefined && node.isEndOfWord;
  }
  
  startsWith(prefix: string): boolean {
    return this.findNode(prefix.toLowerCase()) !== undefined;
  }
  
  // Find all words that start with the given prefix
  findAllWithPrefix(prefix: string): string[] {
    const results: string[] = [];
    const node = this.findNode(prefix.toLowerCase());
    
    if (node) {
      this.collectWords(node, prefix.toLowerCase(), results);
    }
    
    return results;
  }
  
  private findNode(prefix: string): TrieNode | undefined {
    let current = this.root;
    
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return undefined;
      }
      current = current.children.get(char)!;
    }
    
    return current;
  }
  
  private collectWords(node: TrieNode, currentPrefix: string, results: string[]): void {
    if (node.isEndOfWord) {
      results.push(node.originalWord || currentPrefix);
    }
    
    for (const [char, childNode] of node.children.entries()) {
      this.collectWords(childNode, currentPrefix + char, results);
    }
  }
}

class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  originalWord?: string; // Store original casing
  
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}