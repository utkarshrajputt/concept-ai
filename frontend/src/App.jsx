import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Brain, Send, Loader2, BookOpen, AlertCircle, CheckCircle, Copy, Sparkles, Zap, Target, GraduationCap, Microscope, X, BarChart3, History, Moon, Sun, Download, RefreshCw, Keyboard, TrendingUp, Trophy, Lightbulb, Clock, RotateCcw, Search, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

// Theme Context
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DIFFICULTY_LEVELS = [
  {
    value: 'eli5',
    label: 'ELI5',
    description: 'Explain Like I\'m 5',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700'
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Clear & Structured',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  {
    value: 'graduate',
    label: 'Graduate',
    description: 'Detailed & Technical',
    icon: Target,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Expert & Research',
    icon: Microscope,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700'
  }
];

// Advanced Query Normalization Function with enhanced robustness
const normalizeQuery = (query) => {
  if (!query) return '';
  
  return query
    .trim()
    .toLowerCase()
    // Remove extra spaces and normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove common punctuation but preserve essential characters
    .replace(/[.,!?;:'"()[\]{}]/g, '')
    // Keep hyphens and underscores for technical terms
    .replace(/[-_]+/g, ' ')
    // Handle common abbreviations and expansions
    .replace(/\bai\b/g, 'artificial intelligence')
    .replace(/\bml\b/g, 'machine learning')
    .replace(/\bdl\b/g, 'deep learning')
    .replace(/\bnlp\b/g, 'natural language processing')
    .replace(/\bvr\b/g, 'virtual reality')
    .replace(/\bar\b/g, 'augmented reality')
    .replace(/\bui\b/g, 'user interface')
    .replace(/\bux\b/g, 'user experience')
    .replace(/\bapi\b/g, 'application programming interface')
    .replace(/\brest\b/g, 'representational state transfer')
    .replace(/\bcss\b/g, 'cascading style sheets')
    .replace(/\bhtml\b/g, 'hypertext markup language')
    .replace(/\bjs\b/g, 'javascript')
    .replace(/\bts\b/g, 'typescript')
    .replace(/\bdb\b/g, 'database')
    .replace(/\bsql\b/g, 'structured query language')
    .replace(/\bnosql\b/g, 'non relational database')
    .replace(/\baws\b/g, 'amazon web services')
    .replace(/\bgcp\b/g, 'google cloud platform')
    .replace(/\bk8s\b/g, 'kubernetes')
    .replace(/\bci cd\b/g, 'continuous integration continuous deployment')
    // Normalize common question prefixes
    .replace(/^(what is|what are|explain|tell me about|how does|how do|how to|what does|describe|define)\s+/i, '')
    .replace(/^(can you|could you|please)\s+(explain|tell me|describe)\s*/i, '')
    // Normalize common suffixes
    .replace(/\s+(work|works|working|function|functions|functioning)$/i, '')
    .replace(/\s+(mean|means|meaning)$/i, '')
    .replace(/\s+(\?|\.)*$/g, '')
    .trim();
};

// Enhanced rate limiting with adaptive backoff
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  adaptiveBackoff: true,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

const requestQueue = [];
let lastRequestTime = 0;
let consecutiveErrors = 0;

const checkRateLimit = () => {
  const now = Date.now();
  const recentRequests = requestQueue.filter(time => now - time < RATE_LIMIT_CONFIG.windowMs);
  
  if (recentRequests.length >= RATE_LIMIT_CONFIG.maxRequests) {
    const oldestRequest = Math.min(...recentRequests);
    const waitTime = RATE_LIMIT_CONFIG.windowMs - (now - oldestRequest);
    return { limited: true, waitTime };
  }
  
  // Adaptive backoff based on consecutive errors
  if (RATE_LIMIT_CONFIG.adaptiveBackoff && consecutiveErrors > 0) {
    const timeSinceLastRequest = now - lastRequestTime;
    const requiredDelay = Math.min(
      RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, consecutiveErrors - 1),
      RATE_LIMIT_CONFIG.maxDelay
    );
    
    if (timeSinceLastRequest < requiredDelay) {
      return { limited: true, waitTime: requiredDelay - timeSinceLastRequest };
    }
  }
  
  return { limited: false };
};

const recordRequest = (success = true) => {
  const now = Date.now();
  requestQueue.push(now);
  lastRequestTime = now;
  
  if (success) {
    consecutiveErrors = 0;
  } else {
    consecutiveErrors++;
  }
  
  // Clean old requests
  const cutoff = now - RATE_LIMIT_CONFIG.windowMs;
  while (requestQueue.length > 0 && requestQueue[0] < cutoff) {
    requestQueue.shift();
  }
};

// Enhanced search validation
const validateSearchInput = (input) => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Please enter a topic to explain' };
  }
  
  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Please enter a topic to explain' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Topic must be at least 2 characters long' };
  }
  
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Topic must be less than 200 characters' };
  }
  
  // Check for only special characters or numbers
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Topic must contain at least one letter' };
  }
  
  // Check for potentially harmful content
  const suspiciousPatterns = [
    /<script/i, /javascript:/i, /onload=/i, /onerror=/i,
    /eval\(/i, /function\s*\(/i, /alert\(/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
    return { isValid: false, error: 'Invalid characters detected in topic' };
  }
  
  return { isValid: true, sanitized: trimmed };
};

// Enhanced fuzzy matching for better cache hits
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Levenshtein distance
  const editDistance = (s1, s2) => {
    const costs = [];
    for (let i = 0; i <= s2.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s1.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

// Enhanced cached explanation finder with fuzzy matching
const findCachedExplanation = (searchTopic, searchLevel, history) => {
  const normalizedSearch = normalizeQuery(searchTopic);
  
  // First try exact match
  let exactMatch = history.find(item => {
    const normalizedHistoryTopic = normalizeQuery(item.topic);
    return normalizedHistoryTopic === normalizedSearch && item.level === searchLevel && item.explanation;
  });
  
  if (exactMatch) return exactMatch;
  
  // Then try fuzzy match with high similarity threshold
  const fuzzyMatches = history
    .filter(item => item.level === searchLevel && item.explanation)
    .map(item => ({
      ...item,
      similarity: calculateSimilarity(normalizedSearch, normalizeQuery(item.topic))
    }))
    .filter(item => item.similarity >= 0.85) // 85% similarity threshold
    .sort((a, b) => b.similarity - a.similarity);
  
  return fuzzyMatches.length > 0 ? fuzzyMatches[0] : null;
};

// Bulletproof formatting function with comprehensive parsing and edge case handling
const formatExplanation = (text) => {
  if (!text) return '';
  
  // Step 1: Clean and normalize the text
  let formatted = text
    // Normalize line breaks and remove excessive whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, '  ') // Convert tabs to spaces
    .trim();

  // Step 2: Advanced table processing with proper grouping
  // Handle the specific format from your screenshot where everything is on one line
  // "Table 1: Students | StudentID | Name | |----------|-----------|------| | 101 | 1 | Alice | Table 2: ..."
  formatted = formatted.replace(/Table\s+(\d+):\s+(\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\|\s*([-|:\s]+)\s*\|\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g, 
    (match, tableNum, tableName, col1, col2, separator, data1, data2, data3) => {
      return `

### Table ${tableNum}: ${tableName}

| ${col1.trim()} | ${col2.trim()} |
|${'-'.repeat(col1.trim().length + 2)}|${'-'.repeat(col2.trim().length + 2)}|
| ${data1.trim()} | ${data2.trim()} |

`;
    }
  );

  // Also handle the case where multiple tables are concatenated
  formatted = formatted.replace(/(?:Table\s+\d+:\s+\w+[^|]*\|[^|]+\|[^|]+\|[^|]*\|[-|:\s]+\|[^|]*\|[^|]+\|[^|]+\|[^|]*)+/g, (match) => {
    // Split on "Table X:" to separate individual tables
    const tables = match.split(/(?=Table\s+\d+:)/).filter(t => t.trim().length > 0);
    
    return tables.map(table => {
      // Process each table individually
      const tableMatch = table.match(/Table\s+(\d+):\s+(\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\|\s*([-|:\s]+)\s*\|\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
      
      if (tableMatch) {
        const [, tableNum, tableName, col1, col2, , data1, data2, data3] = tableMatch;
        return `

### Table ${tableNum}: ${tableName}

| ${col1.trim()} | ${col2.trim()} |
|${'-'.repeat(Math.max(col1.trim().length, 10))}|${'-'.repeat(Math.max(col2.trim().length, 10))}|
| ${data1.trim()} | ${data2.trim()} |

`;
      }
      return table;
    }).join('\n');
  });

  // Step 3: Process remaining table lines that follow standard markdown format
  const lines = formatted.split('\n');
  let processedLines = [];
  let currentTable = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = /^\|(.+)\|$/.test(line.trim());
    
    if (isTableLine) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line.trim());
    } else {
      if (inTable && currentTable.length > 0) {
        // Process the complete table
        const tableHTML = processTable(currentTable);
        processedLines.push(tableHTML);
        currentTable = [];
        inTable = false;
      }
      processedLines.push(line);
    }
  }

  // Handle any remaining table at the end
  if (inTable && currentTable.length > 0) {
    const tableHTML = processTable(currentTable);
    processedLines.push(tableHTML);
  }

  formatted = processedLines.join('\n');

  // Helper function to process a complete table
  function processTable(tableLines) {
    if (tableLines.length === 0) return '';

    let processedRows = [];
    let headerProcessed = false;
    let numCols = 0;

    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      const content = line.replace(/^\||\|$/g, ''); // Remove outer pipes
      const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
      
      // Skip separator rows (containing only dashes, colons, spaces)
      if (cells.every(cell => /^[-:\s]+$/.test(cell))) {
        continue;
      }

      if (cells.length === 0) continue;

      // Set column count from first valid row
      if (numCols === 0) {
        numCols = Math.min(cells.length, 6); // Max 6 columns
      }

      // Detect if this is a header row
      const isHeader = !headerProcessed && (
        i === 0 || // First row is usually header
        cells.some(cell => {
          return (
            cell.length <= 50 && 
            (cell === cell.toUpperCase() || 
             /^[A-Z][a-zA-Z\s]*$/.test(cell) ||
             ['feature', 'description', 'example', 'type', 'name', 'value', 'step', 'method', 'property', 'attribute', 'parameter', 'option', 'command', 'syntax', 'column', 'field', 'key', 'title'].some(word => 
               cell.toLowerCase().includes(word)
             ))
          );
        })
      );

      if (isHeader && !headerProcessed) {
        processedRows.push(`
          <div class="table-header grid gap-0" style="grid-template-columns: repeat(${numCols}, 1fr);">
            ${cells.slice(0, numCols).map(cell => 
              `<div class="font-bold text-sm p-4 text-center table-header-cell">${cell}</div>`
            ).join('')}
          </div>
        `);
        headerProcessed = true;
      } else {
        processedRows.push(`
          <div class="table-row grid gap-0" style="grid-template-columns: repeat(${numCols}, 1fr);">
            ${cells.slice(0, numCols).map((cell, index) => {
              // Handle different cell types
              const isCode = cell.includes('`') || /^[a-z_]+\([^)]*\)$/.test(cell);
              const isEmphasis = cell.includes('**') || cell.includes('*');
              
              let processedCell = cell;
              if (isCode) {
                processedCell = cell.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">$1</code>');
              }
              if (isEmphasis) {
                processedCell = processedCell
                  .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
                  .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
              }
              
              return `<div class="p-4 text-sm table-cell ${index === 0 ? 'font-medium' : ''}">${processedCell}</div>`;
            }).join('')}
          </div>
        `);
      }
    }

    if (processedRows.length > 0) {
      return `<div class="table-container mb-6 rounded-lg overflow-hidden border shadow-lg">
        ${processedRows.join('')}
      </div>`;
    }

    return '';
  }

  // Step 4: Handle headers with consistent styling
  // Main headers (### or # or ##)
  formatted = formatted.replace(/^#{1,3}\s+(.+)$/gm, (match, title) => {
    return `<div class="header-main mt-8 mb-6 pb-3 border-b-2 border-gray-300">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">${title}</h2>
    </div>`;
  });

  // Sub headers (#### or more)
  formatted = formatted.replace(/^#{4,}\s+(.+)$/gm, (match, title) => {
    return `<div class="header-sub mt-6 mb-4 flex items-center">
      <div class="w-1 h-6 bg-blue-500 rounded mr-3"></div>
      <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
    </div>`;
  });

  // Step 4.5: Handle horizontal rules (---, ***, ___)
  formatted = formatted.replace(/^(\s*)[-*_]{3,}\s*$/gm, () => {
    return `<div class="horizontal-rule my-8 flex items-center">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
      <div class="px-4">
        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
      </div>
      <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
    </div>`;
  });

  // Step 5: Handle lists with proper nesting support
  // Numbered lists (including nested)
  formatted = formatted.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (match, indent, num, content) => {
    const level = Math.floor(indent.length / 2);
    const marginLeft = level > 0 ? `ml-${level * 6}` : '';
    
    return `<div class="numbered-list-item flex items-start space-x-3 mb-3 ${marginLeft}">
      <div class="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">
        ${num}
      </div>
      <div class="flex-1 text-gray-700 leading-relaxed pt-1">${content}</div>
    </div>`;
  });

  // Bullet points (including nested) - Enhanced detection
  formatted = formatted.replace(/^(\s*)[-*+•]\s+(.+)$/gm, (match, indent, content) => {
    const level = Math.floor(indent.length / 2);
    const marginLeft = level > 0 ? `ml-${level * 6}` : '';
    
    return `<div class="bullet-list-item flex items-start space-x-3 mb-2 ${marginLeft}">
      <div class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-3"></div>
      <div class="flex-1 text-gray-700 leading-relaxed">${content}</div>
    </div>`;
  });

  // Handle inline bullet points (like "* text" in the middle of content)
  formatted = formatted.replace(/(\s|^)\*\s+([^*\n]+?)(\s|$)/g, (match, prefix, content, suffix) => {
    return `${prefix}<span class="inline-bullet flex items-center">
      <span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
      <span class="text-gray-700">${content.trim()}</span>
    </span>${suffix}`;
  });

  // Step 6: Handle code blocks with proper language detection
  // First handle code blocks with language specifiers (with or without newline)
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    const trimmedCode = code.trim();
    
    return `<div class="code-block my-6 rounded-lg overflow-hidden border border-gray-300 shadow-lg">
      <div class="bg-gray-800 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
        <span class="text-gray-300 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
          ${language}
        </span>
        <div class="flex space-x-1">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
      <pre class="bg-gray-900 text-green-400 p-4 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre-wrap"><code>${trimmedCode}</code></pre>
    </div>`;
  });

  // Handle simple code blocks without language specifiers
  formatted = formatted.replace(/```\n?([\s\S]*?)\n?```/g, (match, code) => {
    const trimmedCode = code.trim();
    // Skip if already processed (contains HTML)
    if (trimmedCode.includes('<div class="code-block')) {
      return match;
    }
    
    return `<div class="code-block my-6 rounded-lg overflow-hidden border border-gray-300 shadow-lg">
      <div class="bg-gray-800 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
        <span class="text-gray-300 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
          code
        </span>
        <div class="flex space-x-1">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
      <pre class="bg-gray-900 text-green-400 p-4 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre-wrap"><code>${trimmedCode}</code></pre>
    </div>`;
  });

  // Inline code
  formatted = formatted.replace(/`([^`\n]+)`/g, 
    '<code class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm font-mono border border-gray-300 dark:border-gray-600">$1</code>'
  );

  // Step 7: Handle text formatting
  // Bold text (** or __)
  formatted = formatted.replace(/(\*\*|__)((?!\s)[^*_\n]*(?<!\s))\1/g, 
    '<strong class="font-semibold text-gray-900">$2</strong>'
  );

  // Italic text (* or _)
  formatted = formatted.replace(/(\*|_)((?!\s)[^*_\n]*(?<!\s))\1/g, 
    '<em class="italic text-gray-700">$1</em>'
  );

  // Step 8: Handle blockquotes
  formatted = formatted.replace(/^>\s+(.+)$/gm, 
    '<div class="blockquote my-4 pl-4 py-2 border-l-4 border-blue-500 bg-blue-50 italic text-gray-700">$1</div>'
  );

  // Step 9: Handle links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
    '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Step 10: Clean up any remaining formatting artifacts
  formatted = formatted
    // Remove standalone pipes that weren't caught
    .replace(/^\s*\|\s*$/gm, '')
    // Remove excessive spaces
    .replace(/\s{3,}/g, '  ')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove any orphaned HTML tags
    .replace(/<\/div>\s*<div class="table-container/g, '<div class="table-container')
    .trim();

  // Step 11: Process paragraphs
  const sections = formatted.split('\n\n').filter(section => section.trim());
  
  const processedSections = sections.map(section => {
    section = section.trim();
    
    // Skip if already formatted (contains HTML)
    if (section.includes('<div') || 
        section.includes('<h') || 
        section.includes('<pre') || 
        section.includes('<code') ||
        section.includes('<strong') ||
        section.includes('<em') ||
        section.includes('<a ')) {
      return section;
    }
    
    // Handle regular paragraphs
    if (section.length > 0) {
      return `<p class="paragraph mb-4 text-gray-700 leading-relaxed text-base">${section}</p>`;
    }
    
    return '';
  }).filter(section => section.length > 0);

  return processedSections.join('\n\n');
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Add custom selection styling
    const existingStyle = document.getElementById('custom-selection-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'custom-selection-style';
    style.textContent = `
      /* Custom text selection colors */
      ::selection {
        background-color: ${darkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
        color: ${darkMode ? '#e5e7eb' : '#1f2937'};
      }

      ::-moz-selection {
        background-color: ${darkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
        color: ${darkMode ? '#e5e7eb' : '#1f2937'};
      }

      /* Enhanced selection for specific content areas */
      .explanation-content ::selection {
        background-color: ${darkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.15)'};
        color: ${darkMode ? '#f3f4f6' : '#111827'};
      }

      .explanation-content ::-moz-selection {
        background-color: ${darkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.15)'};
        color: ${darkMode ? '#f3f4f6' : '#111827'};
      }

      /* Code block selection */
      .code-block ::selection {
        background-color: ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(168, 85, 247, 0.2)'};
        color: ${darkMode ? '#dcfce7' : '#1e1b4b'};
      }

      .code-block ::-moz-selection {
        background-color: ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(168, 85, 247, 0.2)'};
        color: ${darkMode ? '#dcfce7' : '#1e1b4b'};
      }

      /* Table selection */
      .table-container ::selection {
        background-color: ${darkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(236, 72, 153, 0.15)'};
        color: ${darkMode ? '#fef3c7' : '#831843'};
      }

      .table-container ::-moz-selection {
        background-color: ${darkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(236, 72, 153, 0.15)'};
        color: ${darkMode ? '#fef3c7' : '#831843'};
      }

      /* Header selection */
      .header-main ::selection,
      .header-sub ::selection {
        background-color: ${darkMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
        color: ${darkMode ? '#f3e8ff' : '#312e81'};
      }

      .header-main ::-moz-selection,
      .header-sub ::-moz-selection {
        background-color: ${darkMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
        color: ${darkMode ? '#f3e8ff' : '#312e81'};
      }

      /* Analytics modal selection */
      .analytics-modal ::selection {
        background-color: ${darkMode ? 'rgba(6, 182, 212, 0.25)' : 'rgba(14, 165, 233, 0.15)'};
        color: ${darkMode ? '#cffafe' : '#0c4a6e'};
      }

      .analytics-modal ::-moz-selection {
        background-color: ${darkMode ? 'rgba(6, 182, 212, 0.25)' : 'rgba(14, 165, 233, 0.15)'};
        color: ${darkMode ? '#cffafe' : '#0c4a6e'};
      }
    `;

    document.head.appendChild(style);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Export utilities
const exportToPDF = (content, title) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
          .content { line-height: 1.6; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">${content}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const exportToJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const shareExplanation = async (concept, explanation) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Explanation: ${concept}`,
        text: explanation,
        url: window.location.href
      });
    } catch (err) {
      console.log('Share cancelled');
    }
  } else {
    navigator.clipboard.writeText(`${concept}\n\n${explanation}`);
    alert('Explanation copied to clipboard!');
  }
};

// Keyboard Shortcuts Hook
const useKeyboardShortcuts = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, metaKey, key } = event;
      const isModifierPressed = ctrlKey || metaKey;

      if (isModifierPressed && key === 'Enter' && callbacks.submit) {
        event.preventDefault();
        callbacks.submit();
      } else if (key === 'Escape' && callbacks.escape) {
        event.preventDefault();
        callbacks.escape();
      } else if (isModifierPressed && key === 'k' && callbacks.focus) {
        event.preventDefault();
        callbacks.focus();
      } else if (isModifierPressed && key === 'd' && callbacks.darkMode) {
        event.preventDefault();
        callbacks.darkMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
};

function App() {
  const { darkMode, toggleDarkMode } = useTheme();
  // Generate or retrieve user session ID for personalization
  const [userSessionId, setUserSessionId] = useState(() => {
    let sessionId = localStorage.getItem('conceptai_user_session');
    if (!sessionId) {
      // Generate a simple session ID (not for security, just for data separation)
      sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('conceptai_user_session', sessionId);
    }
    return sessionId;
  });

  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('student');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [cached, setCached] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [localHistory, setLocalHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [topicInputRef, setTopicInputRef] = useState(null);
  const [levelChanged, setLevelChanged] = useState(false);

  // Helper function to change level with visual feedback
  const changeLevelWithFeedback = (newLevel, currentLevel) => {
    if (newLevel !== currentLevel) {
      setLevelChanged(true);
      setTimeout(() => setLevelChanged(false), 1000); // Reset after 1 second
    }
    setLevel(newLevel);
  };

  // Enhanced error handling with retry mechanism, rate limiting, and exponential backoff
  const handleSubmit = async (e, forceRefresh = false) => {
    if (e) e.preventDefault();

    // Enhanced input validation
    const validation = validateSearchInput(topic);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const sanitizedTopic = validation.sanitized;

    // Check rate limiting
    const rateLimitCheck = checkRateLimit();
    if (rateLimitCheck.limited) {
      const waitSeconds = Math.ceil(rateLimitCheck.waitTime / 1000);
      setError(`Too many requests. Please wait ${waitSeconds} seconds before trying again.`);
      return;
    }

    // Check for cached result in local history first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedResult = findCachedExplanation(sanitizedTopic, level, localHistory);
      if (cachedResult) {
        // Load from cache instantly
        setExplanation(cachedResult.explanation);
        setCached(true);
        setRegenerated(false);
        setLoading(false);
        setRegenerating(false);
        setError('');
        setCopySuccess(false);
        
        // Update topic with the cached version for consistency
        if (cachedResult.topic !== sanitizedTopic) {
          setTopic(cachedResult.topic);
        }
        return; // Exit early with cached result
      }
    }

    // Set appropriate loading states
    if (forceRefresh) {
      setRegenerating(true);
    } else {
      setLoading(true);
      setExplanation('');
    }
    
    setError('');
    setCached(false);
    setRegenerated(false);
    setCopySuccess(false);

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${API_BASE_URL}/explain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: sanitizedTopic,
            level: level,
            force_refresh: forceRefresh,
            user_session: userSessionId,
            attempt: attempt + 1 // Include attempt number for backend logging
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle specific HTTP errors
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          } else if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please try again in a few moments.');
          } else if (response.status >= 500) {
            throw new Error(`Server error (${response.status}). Please try again.`);
          } else if (response.status === 400) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid request. Please check your input.');
          } else {
            throw new Error(`Request failed with status ${response.status}`);
          }
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.explanation || typeof data.explanation !== 'string') {
          throw new Error('Invalid response format received from server');
        }

        // Success - update UI and save to history
        setExplanation(data.explanation);
        setRetryCount(0); // Reset retry count on success
        setCached(data.cached || false);
        setRegenerated(forceRefresh);

        // Save to local history with enhanced metadata
        const historyItem = {
          id: Date.now(),
          topic: sanitizedTopic,
          explanation: data.explanation,
          level: level,
          timestamp: new Date().toISOString(),
          cached: data.cached || false,
          responseTime: data.responseTime || null,
          tokenCount: data.tokenCount || null
        };

        setLocalHistory(prev => {
          // Use enhanced normalization to filter out duplicates
          const normalizedNewTopic = normalizeQuery(sanitizedTopic);
          const updated = [historyItem, ...prev.filter(item => {
            const normalizedHistoryTopic = normalizeQuery(item.topic);
            return !(normalizedHistoryTopic === normalizedNewTopic && item.level === level);
          })].slice(0, 100); // Increased history limit
          
          localStorage.setItem('explanationHistory', JSON.stringify(updated));
          return updated;
        });

        // Update topic field with sanitized version
        setTopic(sanitizedTopic);
        recordRequest(true); // Record successful request
        
        // Clear loading states on success
        setLoading(false);
        setRegenerating(false);
        
        return; // Success, exit retry loop

      } catch (err) {
        console.error(`Attempt ${attempt + 1} failed:`, err);
        recordRequest(false); // Record failed request
        
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
          break;
        }
        
        if (attempt === maxRetries) {
          // Final attempt failed
          const errorMessage = err.message || 'Failed to get explanation. Please try again.';
          setError(errorMessage);
          setRetryCount(prev => prev + 1);
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 second delay
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    // Cleanup loading states
    setLoading(false);
    setRegenerating(false);
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      handleSubmit(null, false);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    submit: () => !loading && !regenerating && topic.trim() && handleSubmit(),
    escape: () => {
      if (showAnalytics) setShowAnalytics(false);
      else if (showHistory) setShowHistory(false);
      else if (showShortcuts) setShowShortcuts(false);
    },
    focus: () => topicInputRef?.focus(),
    darkMode: toggleDarkMode
  });
  
  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('explanationHistory');
    if (savedHistory) {
      try {
        setLocalHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse saved history:', e);
      }
    }

    // Auto-focus on input after component mounts
    setTimeout(() => {
      topicInputRef?.focus();
    }, 100);
  }, [topicInputRef]);

  // Enhanced regeneration function with confirmation dialog
  const handleRegenerate = () => {
    const shouldRegenerate = window.confirm(
      "🔄 Regenerate Explanation\n\n" +
      "This will create a fresh explanation and replace the current cached version. " +
      "The new explanation might be different from the current one.\n\n" +
      "Do you want to continue?"
    );
    
    if (shouldRegenerate) {
      handleSubmit(null, true);  // Call handleSubmit with forceRefresh = true
    }
  };

  // 📚 LOCAL HISTORY MANAGEMENT SYSTEM
  const HISTORY_KEY = 'conceptai_search_history';
  const MAX_HISTORY_ITEMS = 10;

  // Add to history function
  const addToHistory = (searchTopic, searchLevel) => {
    const historyItem = {
      id: Date.now(),
      topic: searchTopic,
      level: searchLevel,
      timestamp: new Date().toISOString()
    };

    setLocalHistory(prev => {
      const filteredHistory = prev.filter(item => 
        !(item.topic.toLowerCase() === searchTopic.toLowerCase() && item.level === searchLevel)
      );
      const newHistory = [historyItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Load from history
  const loadFromHistory = (historyItem) => {
    setTopic(historyItem.topic);
    changeLevelWithFeedback(historyItem.level, level); // Use helper function
    setShowHistory(false);
    setError(''); // Clear any existing errors
    
    // Load cached explanation directly from history instead of making API call
    if (historyItem.explanation) {
      // Show brief loading state for better UX
      setLoading(true);
      setTimeout(() => {
        setExplanation(historyItem.explanation);
        setCached(true); // Mark as cached since it's from history
        setRegenerating(false);
        setLoading(false);
        setCopySuccess(false);
      }, 150); // Brief delay to show loading state
    } else {
      // Fallback: If no cached explanation, make API call
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  };

  // Enhanced suggestion handlers with smart filtering
  const handleTopicChange = (e) => {
    const value = e.target.value;
    setTopic(value);
    setError('');
    
    // Show suggestions when user starts typing and we have history
    if (value.length > 1 && localHistory.length > 0) { // Require at least 2 characters
      updateSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Smart suggestion filtering with ranking
  const updateSuggestions = (inputValue) => {
    if (!inputValue || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const normalizedInput = normalizeQuery(inputValue);
    
    // Score and rank suggestions
    const scoredSuggestions = localHistory
      .map(item => {
        const normalizedTopic = normalizeQuery(item.topic);
        
        // Calculate various similarity scores
        const exactStart = normalizedTopic.startsWith(normalizedInput) ? 1 : 0;
        const contains = normalizedTopic.includes(normalizedInput) ? 0.8 : 0;
        const fuzzyScore = calculateSimilarity(normalizedInput, normalizedTopic);
        const levelBonus = item.level === level ? 0.1 : 0; // Prefer current level
        const recentBonus = Math.max(0, 0.1 - (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60 * 24 * 7)); // Recent items get bonus
        
        const totalScore = Math.max(exactStart, contains, fuzzyScore * 0.7) + levelBonus + recentBonus;
        
        return {
          ...item,
          score: totalScore,
          matchType: exactStart ? 'exact' : contains ? 'contains' : 'fuzzy'
        };
      })
      .filter(item => item.score > 0.3) // Filter out low-score matches
      .sort((a, b) => {
        // Sort by score first, then by recency
        if (Math.abs(a.score - b.score) < 0.1) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return b.score - a.score;
      })
      .slice(0, 8); // Show max 8 suggestions

    setSuggestions(scoredSuggestions);
  };

  const handleInputFocus = () => {
    // Show suggestions if we have history and current input
    if (localHistory.length > 0 && topic.length > 1) {
      updateSuggestions(topic);
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // Enhanced suggestion selection with smart level switching
  const selectSuggestion = async (suggestion) => {
    setTopic(suggestion.topic);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // Enhanced: Auto-switch level if different and show visual feedback
    if (suggestion.level !== level) {
      await changeLevelWithFeedback(suggestion.level);
    }
    
    // Enhanced: If we have cached explanation, display it immediately for instant feedback
    const cachedExplanation = findCachedExplanation(suggestion.topic, suggestion.level, localHistory);
    if (cachedExplanation) {
      setExplanation(cachedExplanation.explanation);
      setMetadata(cachedExplanation.metadata || {});
      setCached(true);
      setRegenerated(false);
      setLoading(false);
      setRegenerating(false);
      setError('');
      setCopySuccess(false);
      return;
    }
    
    // Enhanced: Auto-submit for seamless experience
    setTimeout(() => {
      if (suggestion.topic.trim()) {
        handleSubmit(null, suggestion.topic);
      }
    }, 200); // Small delay for better UX
  };

  // Smart keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      // Reset selection when suggestions are hidden
      if (selectedSuggestionIndex !== -1) {
        setSelectedSuggestionIndex(-1);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          // Normal form submission if no suggestion selected
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      case 'Tab':
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          setTopic(suggestions[selectedSuggestionIndex].topic);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
    }
  };

  const handleSuggestionClick = (historyItem) => {
    setTopic(historyItem.topic);
    changeLevelWithFeedback(historyItem.level, level); // Use helper function
    setShowSuggestions(false);
    setError(''); // Clear any errors
    
    // Optionally auto-focus back to input
    setTimeout(() => topicInputRef?.focus(), 100);
  };

  // Clear all history
  const clearHistory = () => {
    const shouldClear = window.confirm(
      "🗑️ Clear Search History\n\n" +
      "This will permanently delete your local search history. This action cannot be undone.\n\n" +
      "Continue?"
    );
    
    if (shouldClear) {
      setLocalHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  // Generate local analytics from browser history
  const generateLocalAnalytics = () => {
    if (localHistory.length === 0) {
      return {
        total_explanations: 0,
        popular_topics: [],
        level_distribution: [],
        cache_hit_rate: 0,
        recent_activity: [],
        last_updated: new Date().toISOString(),
        user_session: userSessionId
      };
    }

    // Calculate analytics from local history
    const topics = {};
    const levels = {};
    let cached = 0;

    localHistory.forEach(item => {
      // Count topics
      if (topics[item.topic]) {
        topics[item.topic]++;
      } else {
        topics[item.topic] = 1;
      }

      // Count levels
      if (levels[item.level]) {
        levels[item.level]++;
      } else {
        levels[item.level] = 1;
      }

      // Count cached items
      if (item.cached) cached++;
    });

    // Convert to arrays
    const popular_topics = Object.entries(topics)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    const level_distribution = Object.entries(levels)
      .map(([level, count]) => ({ level, count }));

    // Generate recent activity (last 7 days)
    const recent_activity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCount = localHistory.filter(item => 
        item.timestamp && item.timestamp.split('T')[0] === dateStr
      ).length;
      
      recent_activity.push({
        date: dateStr,
        count: dayCount
      });
    }

    return {
      total_explanations: localHistory.length,
      popular_topics,
      level_distribution,
      cache_hit_rate: localHistory.length > 0 ? Math.round((cached / localHistory.length) * 100) : 0,
      recent_activity,
      last_updated: new Date().toISOString(),
      user_session: userSessionId
    };
  };

  // 📊 ANALYTICS MANAGEMENT SYSTEM
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // For now, use local analytics only to ensure browser separation
      // TODO: Update backend to properly filter by user_session
      const localAnalytics = generateLocalAnalytics();
      setAnalyticsData(localAnalytics);
      
      // Optional: Still try to fetch from backend for future when it's fixed
      // const response = await fetch(`${API_BASE_URL}/analytics?user_session=${userSessionId}`);
      // const data = await response.json();
      // if (response.ok && data.user_session === userSessionId) {
      //   setAnalyticsData(data);
      // } else {
      //   setAnalyticsData(localAnalytics);
      // }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // Always fallback to local analytics
      setAnalyticsData(generateLocalAnalytics());
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Open analytics modal and fetch data
  const openAnalytics = () => {
    setShowAnalytics(true);
    fetchAnalytics();
  };

  // Copy to clipboard function
  const copyToClipboard = () => {
    navigator.clipboard.writeText(explanation)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = explanation;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed: ', fallbackErr);
        }
        document.body.removeChild(textArea);
      });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Enhanced Header with Dark Mode */}
      <header className={`backdrop-blur-lg border-b sticky top-0 z-50 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-900/80 border-gray-800/20' 
          : 'bg-white/80 border-white/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg">
                <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ConceptAI
                </h1>
                <p className={`text-xs hidden sm:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Intelligent Explanations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Only show essential buttons on mobile, more on desktop */}
              <div className={`hidden sm:flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-full ${
                darkMode ? 'bg-green-900/50' : 'bg-green-100'
              }`}>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  DeepSeek-R1 • Online
                </span>
              </div>
              
              {/* Essential buttons - always visible */}
              <button
                onClick={() => setShowHistory(true)}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 group ${
                  darkMode 
                    ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                title="Search History"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={toggleDarkMode}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 group ${
                  darkMode 
                    ? 'text-gray-400 hover:text-yellow-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                title="Toggle Dark Mode (Ctrl+D)"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Secondary buttons - hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => setShowShortcuts(true)}
                  className={`p-2 rounded-lg transition-all duration-200 group ${
                    darkMode 
                      ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title="Keyboard Shortcuts (Ctrl+K)"
                >
                  <Keyboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                
                <button
                  onClick={openAnalytics}
                  className={`p-2 rounded-lg transition-all duration-200 group ${
                    darkMode 
                      ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title="Usage Analytics"
                >
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Responsive Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)]">
        {/* Left Sidebar - Input & Controls */}
        <div className={`w-full lg:w-96 lg:min-w-96 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-opacity-20 p-4 sm:p-6 lg:overflow-y-auto transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-900/40 border-gray-700' 
            : 'bg-white/60 border-white'
        }`}>
          <div className="space-y-4 sm:space-y-6">
            {/* Topic Input with Suggestions */}
            <div className="space-y-2 sm:space-y-3">
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                What would you like to learn?
              </label>
              <div className="relative">
                <input
                  ref={(el) => setTopicInputRef(el)}
                  type="text"
                  value={topic}
                  onChange={handleTopicChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter any concept... (Ctrl+K to focus)"
                  className={`w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-gray-400 ${
                    darkMode 
                      ? 'bg-gray-800/80 border-gray-700 text-white' 
                      : 'bg-white/80 border-gray-200 text-gray-900'
                  } ${!topic.trim() && topic.length > 0 ? 'border-red-300 focus:ring-red-300' : ''}`}
                  disabled={loading}
                />
                <Sparkles className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3 w-4 h-4 text-indigo-400 pointer-events-none" />
                
                {/* Enhanced Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className={`absolute z-20 w-full mt-1 border rounded-xl shadow-2xl max-h-80 overflow-y-auto backdrop-blur-sm ${
                    darkMode 
                      ? 'bg-gray-800/95 border-gray-600' 
                      : 'bg-white/95 border-gray-200'
                  }`}>
                    <div className={`p-3 text-xs font-semibold uppercase tracking-wide rounded-t-xl border-b ${
                      darkMode 
                        ? 'text-gray-400 bg-gray-700/50 border-gray-600' 
                        : 'text-gray-500 bg-gray-50 border-gray-100'
                    }`}>
                      <Search className="w-3 h-3 inline mr-1" />
                      Smart Suggestions ({suggestions.length})
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id || index}
                        onClick={() => selectSuggestion(suggestion)}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center space-x-3 border-b last:border-b-0 ${
                          index === selectedSuggestionIndex
                            ? darkMode
                              ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : darkMode
                              ? 'text-gray-300 hover:bg-gray-700/50 hover:text-indigo-400 border-gray-700/30'
                              : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border-gray-100'
                        }`}
                      >
                        {/* Match Type Indicator */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          suggestion.matchType === 'exact' 
                            ? 'bg-green-400' 
                            : suggestion.matchType === 'contains'
                            ? 'bg-yellow-400'
                            : 'bg-blue-400'
                        }`} />
                        
                        {/* Level Icon */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          suggestion.level === level
                            ? darkMode ? 'bg-indigo-800/60' : 'bg-indigo-100'
                            : darkMode ? 'bg-gray-700/60' : 'bg-gray-100'
                        }`}>
                          {DIFFICULTY_LEVELS.find(l => l.value === suggestion.level)?.icon && 
                            React.createElement(DIFFICULTY_LEVELS.find(l => l.value === suggestion.level).icon, {
                              className: `w-3 h-3 ${
                                suggestion.level === level
                                  ? darkMode ? 'text-indigo-400' : 'text-indigo-600'
                                  : darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`
                            })
                          }
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="capitalize truncate font-medium">
                              {suggestion.topic}
                            </span>
                            {suggestion.level !== level && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                darkMode 
                                  ? 'bg-amber-900/50 text-amber-400' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                Switch to {DIFFICULTY_LEVELS.find(l => l.value === suggestion.level)?.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {DIFFICULTY_LEVELS.find(l => l.value === suggestion.level)?.label} level
                            </span>
                            <span className={`text-xs ${
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>•</span>
                            <span className={`text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {new Date(suggestion.timestamp).toLocaleDateString()}
                            </span>
                            {suggestion.score && (
                              <>
                                <span className={`text-xs ${
                                  darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>•</span>
                                <span className={`text-xs font-medium ${
                                  suggestion.score > 0.8 
                                    ? 'text-green-500' 
                                    : suggestion.score > 0.5
                                    ? 'text-yellow-500'
                                    : 'text-blue-500'
                                }`}>
                                  {Math.round(suggestion.score * 100)}% match
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Arrow Indicator */}
                        <div className={`transition-transform duration-200 ${
                          index === selectedSuggestionIndex ? 'transform translate-x-1' : ''
                        }`}>
                          <ChevronRight className={`w-4 h-4 ${
                            index === selectedSuggestionIndex
                              ? darkMode ? 'text-indigo-400' : 'text-indigo-600'
                              : darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                        </div>
                      </button>
                    ))}
                    
                    {/* Keyboard Hint */}
                    <div className={`px-4 py-2 text-xs border-t ${
                      darkMode 
                        ? 'text-gray-500 bg-gray-800/50 border-gray-600' 
                        : 'text-gray-400 bg-gray-50 border-gray-100'
                    }`}>
                      <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-700 text-gray-300 rounded">↑↓</kbd> navigate • 
                      <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-700 text-gray-300 rounded ml-1">Enter</kbd> select • 
                      <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-700 text-gray-300 rounded ml-1">Tab</kbd> complete • 
                      <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-700 text-gray-300 rounded ml-1">Esc</kbd> close
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty Levels */}
            <div className="space-y-2 sm:space-y-3">
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Choose explanation level
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 lg:space-y-2">
                {DIFFICULTY_LEVELS.map((diffLevel) => {
                  const IconComponent = diffLevel.icon;
                  return (
                    <button
                      key={diffLevel.value}
                      onClick={() => changeLevelWithFeedback(diffLevel.value, level)}
                      disabled={loading}
                      className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 text-left ${
                        level === diffLevel.value
                          ? `border-transparent bg-gradient-to-r ${diffLevel.color} text-white shadow-lg transform scale-105`
                          : darkMode 
                            ? 'border-gray-600 bg-gray-800/80 hover:border-gray-500 hover:bg-gray-800 text-gray-200'
                            : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:bg-white text-gray-700'
                      } ${levelChanged && level === diffLevel.value ? 'animate-pulse ring-4 ring-blue-400/50' : ''}`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`p-1.5 sm:p-2 rounded-lg ${
                          level === diffLevel.value 
                            ? 'bg-white/20' 
                            : darkMode 
                              ? 'bg-gray-700' 
                              : diffLevel.bgColor
                        }`}>
                          <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            level === diffLevel.value 
                              ? 'text-white' 
                              : darkMode 
                                ? 'text-gray-300' 
                                : diffLevel.textColor
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs sm:text-sm truncate">{diffLevel.label}</div>
                          <div className={`text-xs truncate ${
                            level === diffLevel.value 
                              ? 'text-white/80' 
                              : darkMode 
                                ? 'text-gray-400' 
                                : 'text-gray-500'
                          }`}>
                            {diffLevel.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !topic.trim()}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2 ${
                !topic.trim() 
                  ? 'bg-gray-400 cursor-not-allowed text-white scale-100' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-purple-500/25 active:scale-95'
              } ${loading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'hover:brightness-110'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{!topic.trim() ? 'Enter a topic first' : 'Generate Explanation'}</span>
                </>
              )}
            </button>

            {/* Quick Recent Topics */}
            {localHistory.length > 0 && (
              <div className={`pt-4 border-t ${darkMode ? 'border-gray-600/50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Recent Topics
                  </h3>
                  <button 
                    onClick={() => setShowHistory(true)}
                    className={`text-xs ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} transition-colors`}
                  >
                    View All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {localHistory.slice(0, 4).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setTopic(item.topic);
                        changeLevelWithFeedback(item.level, level); // Use helper function
                        setError(''); // Clear any errors
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 hover:scale-105 ${
                        darkMode
                          ? 'bg-gray-800/60 border-gray-600/50 text-gray-300 hover:bg-gray-700/60 hover:border-indigo-500/30'
                          : 'bg-gray-100/80 border-gray-200 text-gray-700 hover:bg-indigo-100 hover:border-indigo-300'
                      }`}
                      title={`Click to use: ${item.topic} (${item.level} level)`}
                    >
                      {item.topic.length > 12 ? `${item.topic.slice(0, 12)}...` : item.topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Stats - Hidden on small screens to save space */}
            <div className={`hidden sm:block pt-4 border-t ${darkMode ? 'border-gray-600/50' : 'border-gray-200'}`}>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className={`group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-105 overflow-hidden ${
                  darkMode 
                    ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-800/50 hover:border-blue-600/50' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200/50 hover:border-blue-300/50'
                }`}>
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                      darkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
                    }`}>
                      <Zap className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Fast</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Instant Results</div>
                  </div>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10' 
                      : 'bg-gradient-to-r from-blue-100/50 to-indigo-200/50'
                  }`}></div>
                </div>
                <div className={`group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-105 overflow-hidden ${
                  darkMode 
                    ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-800/50 hover:border-green-600/50' 
                    : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200/50 hover:border-green-300/50'
                }`}>
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                      darkMode ? 'bg-green-500/20' : 'bg-green-500/10'
                    }`}>
                      <Brain className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Smart</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI Powered</div>
                  </div>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10' 
                      : 'bg-gradient-to-r from-green-100/50 to-emerald-200/50'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Content Header */}
          <div className={`backdrop-blur-sm border-b border-opacity-20 p-4 sm:p-6 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-900/40 border-gray-700' 
              : 'bg-white/40 border-white'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg sm:text-xl font-bold truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {topic ? `"${topic}"` : 'Ready to learn something new?'}
                </h2>
                <p className={`text-xs sm:text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {topic ? `Explained at ${DIFFICULTY_LEVELS.find(l => l.value === level)?.label} level` : 'Enter a topic and select your preferred explanation level'}
                </p>
              </div>
              {cached && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full shrink-0 ${
                  darkMode 
                    ? 'bg-green-900/50 text-green-400' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Cached</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {error && (
              <div className={`mb-4 sm:mb-6 p-6 rounded-lg sm:rounded-xl border transition-colors duration-300 ${
                darkMode 
                  ? 'bg-red-900/30 border-red-800/50 text-red-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    darkMode ? 'text-red-400' : 'text-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                      Oops! Something went wrong
                    </h3>
                    <p className={`text-sm mt-1 break-words ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                      {error}
                    </p>
                    {retryCount < 3 && (
                      <div className="mt-4 flex items-center space-x-3">
                        <button
                          onClick={handleRetry}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            darkMode 
                              ? 'bg-red-800 hover:bg-red-700 text-red-200' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Try Again ({3 - retryCount} attempts left)</span>
                        </button>
                        <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                          Attempt #{retryCount + 1}/3
                        </span>
                      </div>
                    )}
                    {retryCount >= 3 && (
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Maximum retry attempts reached. Please check your connection and try a different topic.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!explanation && !loading && !error && (
              <div className="flex items-center justify-center h-full min-h-[200px] sm:min-h-[300px]">
                <div className="text-center max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Welcome to ConceptAI
                  </h3>
                  <p className={`text-sm sm:text-base mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Enter any concept you'd like to understand better. Our AI will provide clear, level-appropriate explanations tailored to your learning needs.
                  </p>
                  <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Adaptive</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>Instant</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>Precise</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(loading || regenerating) && !explanation && (
              <div className="space-y-6 animate-pulse">
                {/* Loading skeleton for explanation */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  {/* Header skeleton */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                      <div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>

                  {/* Content skeleton */}
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                    
                    {/* Code block skeleton */}
                    <div className="bg-gray-800 rounded-lg overflow-hidden mt-6">
                      <div className="px-4 py-2 bg-gray-700 flex items-center justify-between">
                        <div className="h-4 bg-gray-600 rounded w-16"></div>
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-600 rounded w-5/6"></div>
                      </div>
                    </div>

                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                  </div>

                  {/* Status text */}
                  <div className="mt-8 text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      🧠 AI is crafting your personalized explanation...
                    </p>
                    <div className={`w-64 bg-gray-200 rounded-full h-2 mx-auto mt-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full animate-pulse transition-all duration-1000" 
                           style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {explanation && (
              <div className={`explanation-wrapper backdrop-blur-lg rounded-2xl border shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden ${
                darkMode 
                  ? 'bg-gray-800/90 border-gray-700/50' 
                  : 'bg-white/80 border-white/30'
              }`}>
                <div className={`explanation-header p-6 border-b ${
                  darkMode 
                    ? 'bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 border-gray-700/40' 
                    : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-white/40'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Explanation</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          {cached && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              darkMode 
                                ? 'bg-green-900/50 text-green-400 border-green-800/50' 
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}>
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                              Cached Result
                            </span>
                          )}
                          {regenerated && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              <Zap className="w-3 h-3 mr-1" />
                              Fresh Content
                            </span>
                          )}
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {DIFFICULTY_LEVELS.find(l => l.value === level)?.label} Level
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
                      {/* Regenerate Button - Blue theme with RefreshCw icon */}
                      <button
                        onClick={handleRegenerate}
                        disabled={regenerating || loading}
                        title="Generate a fresh explanation and replace the cached version"
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm ${
                          regenerating
                            ? 'bg-blue-50 text-blue-400 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                      >
                        {regenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Regenerating...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>Regenerate</span>
                          </>
                        )}
                      </button>

                      {/* Export Button - Purple theme */}
                      <button
                        onClick={() => exportToPDF(formatExplanation(explanation), `Explanation - ${topic}`)}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm bg-purple-500 text-white hover:bg-purple-600 hover:shadow-lg transform hover:-translate-y-0.5"
                        title="Export as PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>

                      {/* Share Button - Commented out until deployment */}
                      {/* 
                      <button
                        onClick={() => shareExplanation(topic, explanation)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md transform hover:-translate-y-0.5"
                        title="Share explanation"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                      */}

                      {/* Copy Button - Green when success, gray when normal */}
                      <button
                        onClick={copyToClipboard}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-sm transform ${
                          copySuccess
                            ? 'bg-green-500 text-white shadow-lg scale-105 animate-bounce'
                            : 'bg-gray-500 text-white hover:bg-gray-600 hover:shadow-xl hover:scale-105 hover:-translate-y-1 active:scale-95 hover:shadow-gray-500/25'
                        }`}
                        title={copySuccess ? "Copied to clipboard!" : "Copy to clipboard"}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`explanation-body p-8 ${
                  darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                }`}>
                  {/* Custom formatted explanation with bulletproof styling */}
                  <div 
                    className={`explanation-content max-w-none ${
                      darkMode 
                        ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-200' 
                        : 'prose-gray prose-headings:text-gray-900 prose-p:text-gray-800'
                    }`}
                    style={{
                      // Custom CSS variables for code block theming
                      '--code-bg': darkMode ? '#1f2937' : '#f9fafb',
                      '--code-text': darkMode ? '#10b981' : '#059669',
                      '--code-border': darkMode ? '#374151' : '#d1d5db'
                    }}
                    dangerouslySetInnerHTML={{ __html: formatExplanation(explanation) }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📚 HISTORY SIDEBAR MODAL */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
          <div 
            className="flex-1 lg:flex-none"
            onClick={() => setShowHistory(false)}
          ></div>
          <div className={`w-full max-w-md shadow-2xl overflow-hidden animate-slide-in-right ${
            darkMode 
              ? 'bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50' 
              : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${
              darkMode 
                ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-800/60' 
                : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'
                  }`}>
                    <History className={`w-6 h-6 ${
                      darkMode ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>Search History</h2>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Your recent searches (stored locally)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className={`p-2 rounded-lg transition-colors group ${
                    darkMode 
                      ? 'hover:bg-gray-700/60' 
                      : 'hover:bg-white/60'
                  }`}
                  title="Close"
                >
                  <X className={`w-5 h-5 ${
                    darkMode 
                      ? 'text-gray-400 group-hover:text-gray-200' 
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                </button>
              </div>
            </div>
                        // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';            // Line 8 - Replace this:
            const API_BASE_URL = 'http://localhost:5000';
            
            // With this:
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            <div className="flex-1 overflow-y-auto max-h-96">
              {localHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <History className={`w-8 h-8 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`font-semibold mb-2 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>No search history yet</h3>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Start exploring concepts to build your history
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {localHistory.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 group hover:shadow-sm border ${
                        darkMode
                          ? 'bg-gray-800/60 hover:bg-gray-700/80 border-gray-700/50 hover:border-indigo-500/30'
                          : 'bg-gray-50 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'
                          }`}>
                            <span className={`text-xs font-bold ${
                              darkMode ? 'text-indigo-400' : 'text-indigo-600'
                            }`}>#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium capitalize truncate transition-colors ${
                              darkMode 
                                ? 'text-gray-200 group-hover:text-indigo-400' 
                                : 'text-gray-900 group-hover:text-indigo-600'
                            }`}>
                              {item.topic}
                            </p>
                            <p className={`text-sm capitalize ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {item.level} level • {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          darkMode ? 'text-indigo-400' : 'text-indigo-400'
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {localHistory.length > 0 && (
              <div className={`p-4 border-t ${
                darkMode 
                  ? 'border-gray-700/50 bg-gray-800/40' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <button
                  onClick={clearHistory}
                  className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                    darkMode
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border-red-800/50 hover:border-red-700/50'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Clear History</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📊 ENHANCED LEARNING ANALYTICS DASHBOARD */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden animate-fade-in ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b transition-colors duration-300 ${
              darkMode 
                ? 'border-gray-700 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800' 
                : 'border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Your Learning Journey</h2>
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Track your progress and discover insights about your learning patterns</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnalytics(false)}
                  className={`p-2 rounded-lg transition-colors group ${
                    darkMode 
                      ? 'hover:bg-gray-700/60 text-gray-400 hover:text-gray-200' 
                      : 'hover:bg-white/60 text-gray-500 hover:text-gray-700'
                  }`}
                  title="Close Dashboard"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Analyzing Your Learning Journey...</h3>
                    <p className={`transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Gathering insights about your learning patterns</p>
                  </div>
                </div>
              ) : analyticsData ? (
                <div className="space-y-8">
                  {/* User Session Info */}
                  <div className={`bg-gradient-to-r rounded-xl p-4 border transition-colors duration-300 ${
                    darkMode 
                      ? 'from-gray-800/50 to-blue-900/20 border-gray-700' 
                      : 'from-gray-50 to-blue-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {userSessionId.split('_')[2]?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className={`font-medium transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>Your Learning Session</h4>
                          <p className={`text-xs transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Session ID: {userSessionId.split('_')[2]?.slice(0, 8) || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Browser-specific</div>
                        <div className={`text-xs transition-colors duration-300 ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}>Private & Local</div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Learning Summary Cards with Insights */}
                  <div className={`bg-gradient-to-r rounded-xl p-6 border transition-colors duration-300 ${
                    darkMode 
                      ? 'from-blue-900/20 to-indigo-900/20 border-blue-700' 
                      : 'from-blue-50 to-indigo-50 border-blue-200'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <Trophy className={`w-6 h-6 transition-colors duration-300 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>Your Learning Achievement</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/60' : 'bg-white/60'
                      }`}>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>{analyticsData.total_explanations}</div>
                        <div className={`text-sm mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Concepts Mastered</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {analyticsData.total_explanations > 20 ? "🌟 Expert Explorer!" : 
                           analyticsData.total_explanations > 10 ? "📚 Knowledge Seeker" : 
                           "🌱 Learning Journey Started"}
                        </div>
                      </div>
                      <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/60' : 'bg-white/60'
                      }`}>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}>{analyticsData.popular_topics.length}</div>
                        <div className={`text-sm mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Unique Topics</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {analyticsData.popular_topics.length > 15 ? "🎯 Diverse Learner" : 
                           analyticsData.popular_topics.length > 8 ? "🔍 Topic Explorer" : 
                           "🎪 Getting Started"}
                        </div>
                      </div>
                      <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/60' : 'bg-white/60'
                      }`}>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${
                          darkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}>{analyticsData.cache_hit_rate}%</div>
                        <div className={`text-sm mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Efficiency Score</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {analyticsData.cache_hit_rate > 70 ? "⚡ Speed Master" : 
                           analyticsData.cache_hit_rate > 40 ? "🚀 Getting Faster" : 
                           "🏃 Building Speed"}
                        </div>
                      </div>
                      <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/60' : 'bg-white/60'
                      }`}>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${
                          darkMode ? 'text-orange-400' : 'text-orange-600'
                        }`}>{localHistory.length}</div>
                        <div className={`text-sm mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Recent Sessions</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {localHistory.length > 8 ? "📈 Consistent Learner" : 
                           localHistory.length > 4 ? "📊 Regular User" : 
                           "🌟 New Explorer"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personalized Insights Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Learning Style Analysis */}
                    <div className={`lg:col-span-2 rounded-xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className={`p-2 rounded-lg transition-colors duration-300 ${
                          darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                        }`}>
                          <Brain className={`w-5 h-5 transition-colors duration-300 ${
                            darkMode ? 'text-indigo-400' : 'text-indigo-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>Your Learning Style Analysis</h3>
                          <p className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Understanding what you explore most</p>
                        </div>
                      </div>
                      
                      {/* Enhanced Popular Topics with Insights */}
                      {analyticsData.popular_topics && analyticsData.popular_topics.length > 0 ? (
                        <div className="space-y-4">
                          {analyticsData.popular_topics.slice(0, 5).map((topic, index) => {
                            const percentage = Math.round((topic.count / analyticsData.total_explanations) * 100);
                            const insights = {
                              0: { emoji: "🏆", text: "Your top favorite - you're becoming an expert here!" },
                              1: { emoji: "🌟", text: "Strong interest - consider diving deeper" },
                              2: { emoji: "📚", text: "Regular exploration - good foundation building" },
                              3: { emoji: "🔍", text: "Curious learner - exploring new areas" },
                              4: { emoji: "🌱", text: "Growing interest - potential for more learning" }
                            };
                            return (
                              <div key={topic.topic} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${
                                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{insights[index]?.emoji || "📖"}</span>
                                  <div>
                                    <div className={`font-medium capitalize transition-colors duration-300 ${
                                      darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>{topic.topic}</div>
                                    <div className={`text-xs transition-colors duration-300 ${
                                      darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>{insights[index]?.text}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-semibold transition-colors duration-300 ${
                                    darkMode ? 'text-indigo-400' : 'text-indigo-600'
                                  }`}>{topic.count} times</div>
                                  <div className={`text-xs transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>{percentage}% of total</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No learning topics yet! Start exploring concepts to see your interests.
                          </div>
                        </div>
                      )}

                      {/* Learning Recommendations */}
                      <div className={`mt-6 p-4 rounded-lg border transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700' 
                          : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                      }`}>
                        <h4 className={`font-semibold mb-2 flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-green-300' : 'text-green-800'
                        }`}>
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Personalized Recommendations
                        </h4>
                        <ul className={`text-sm space-y-1 transition-colors duration-300 ${
                          darkMode ? 'text-green-300' : 'text-green-700'
                        }`}>
                          {analyticsData.popular_topics.length > 10 ? (
                            <li>• You're a diverse learner! Try connecting concepts between your favorite topics.</li>
                          ) : (
                            <li>• Explore related topics to broaden your knowledge base.</li>
                          )}
                          {analyticsData.cache_hit_rate < 50 && (
                            <li>• Try revisiting topics - repetition strengthens understanding!</li>
                          )}
                          <li>• Consider increasing difficulty level for topics you've mastered.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Difficulty Progress & Goals */}
                    <div className="space-y-6">
                      {/* Learning Level Distribution */}
                      <div className={`rounded-xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className={`p-2 rounded-lg transition-colors duration-300 ${
                            darkMode ? 'bg-green-900/30' : 'bg-green-100'
                          }`}>
                            <Target className={`w-5 h-5 transition-colors duration-300 ${
                              darkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>Learning Levels</h3>
                            <p className={`text-sm transition-colors duration-300 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Your comfort zones</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {analyticsData.level_distribution && analyticsData.level_distribution.length > 0 ? analyticsData.level_distribution.map((level, index) => {
                            const percentage = Math.round((level.count / analyticsData.total_explanations) * 100);
                            const colors = {
                              'student': { 
                                bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-100', 
                                text: darkMode ? 'text-blue-300' : 'text-blue-800', 
                                bar: 'bg-blue-500' 
                              },
                              'graduate': { 
                                bg: darkMode ? 'bg-cyan-900/30' : 'bg-cyan-100', 
                                text: darkMode ? 'text-cyan-300' : 'text-cyan-800', 
                                bar: 'bg-cyan-500' 
                              },
                              'advanced': { 
                                bg: darkMode ? 'bg-green-900/30' : 'bg-green-100', 
                                text: darkMode ? 'text-green-300' : 'text-green-800', 
                                bar: 'bg-green-500' 
                              },
                              'eli5': { 
                                bg: darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100', 
                                text: darkMode ? 'text-yellow-300' : 'text-yellow-800', 
                                bar: 'bg-yellow-500' 
                              }
                            };
                            const color = colors[level.level] || colors.student;
                            
                            return (
                              <div key={level.level} className={`p-3 rounded-lg transition-colors duration-300 ${color.bg}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className={`font-medium capitalize transition-colors duration-300 ${color.text}`}>{level.level}</span>
                                  <span className={`text-sm transition-colors duration-300 ${color.text}`}>{level.count} ({percentage}%)</span>
                                </div>
                                <div className={`w-full rounded-full h-2 transition-colors duration-300 ${
                                  darkMode ? 'bg-gray-700/50' : 'bg-white/50'
                                }`}>
                                  <div 
                                    className={`${color.bar} h-2 rounded-full transition-all duration-300`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="text-center py-6">
                              <div className={`text-sm transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                No learning level data yet. Start exploring concepts!
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Level Progression Insight */}
                        <div className={`mt-4 p-3 rounded-lg transition-colors duration-300 ${
                          darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'
                        }`}>
                          <div className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-indigo-300' : 'text-indigo-800'
                          }`}>
                            <div className="font-medium mb-1">💡 Level Insight:</div>
                            {(() => {
                              if (!analyticsData.level_distribution || analyticsData.level_distribution.length === 0) {
                                return "Start exploring different difficulty levels to get insights!";
                              }
                              const maxLevel = analyticsData.level_distribution.reduce((max, curr) => curr.count > max.count ? curr : max);
                              const insights = {
                                'eli5': "You love simple explanations! Try 'student' level for more depth.",
                                'student': "Great foundation building! Ready to try 'graduate' level?",
                                'graduate': "Strong learner! Consider 'advanced' for challenging topics.",
                                'advanced': "Expert learner! You're mastering complex concepts."
                              };
                              return insights[maxLevel.level] || "Keep exploring different difficulty levels!";
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className={`rounded-xl p-6 border shadow-sm transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Clock className="w-5 h-5 mr-2 text-orange-500" />
                          Learning Patterns
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className={`transition-colors duration-300 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Avg. concepts per session:</span>
                            <span className={`font-medium transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {Math.round(analyticsData.total_explanations / Math.max(localHistory.length, 1))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`transition-colors duration-300 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Most active difficulty:</span>
                            <span className={`font-medium capitalize transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {analyticsData.level_distribution && analyticsData.level_distribution.length > 0 
                                ? analyticsData.level_distribution.reduce((max, curr) => curr.count > max.count ? curr : max).level
                                : "Not available yet"
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`transition-colors duration-300 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Learning efficiency:</span>
                            <span className={`font-medium transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {analyticsData.cache_hit_rate > 70 ? "🚀 Excellent" : 
                               analyticsData.cache_hit_rate > 40 ? "📈 Good" : "🌱 Improving"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Recent Activity with Learning Progress */}
                  {analyticsData.recent_activity && analyticsData.recent_activity.length > 0 && (
                    <div className={`rounded-xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg transition-colors duration-300 ${
                            darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                          }`}>
                            <TrendingUp className={`w-5 h-5 transition-colors duration-300 ${
                              darkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>Learning Progress</h3>
                            <p className={`text-sm transition-colors duration-300 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Your activity over the last 7 days</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold transition-colors duration-300 ${
                            darkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            {analyticsData.recent_activity && analyticsData.recent_activity.length > 0 
                              ? analyticsData.recent_activity.reduce((sum, day) => sum + day.count, 0)
                              : 0
                            }
                          </div>
                          <div className={`text-xs transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Total this week</div>
                        </div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={analyticsData.recent_activity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={{ stroke: '#e2e8f0' }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis axisLine={{ stroke: '#e2e8f0' }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value, name) => [`${value} concepts learned`, 'Daily Progress']}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#7c3aed" 
                            strokeWidth={3}
                            dot={{ fill: '#7c3aed', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 8, stroke: '#7c3aed', strokeWidth: 2, fill: '#ffffff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Weekly Learning Insights */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(() => {
                          if (!analyticsData.recent_activity || analyticsData.recent_activity.length === 0) {
                            return (
                              <div className="col-span-3 text-center py-4">
                                <div className="text-gray-500 dark:text-gray-400 text-sm">
                                  No recent activity data available yet
                                </div>
                              </div>
                            );
                          }
                          
                          const weekTotal = analyticsData.recent_activity.reduce((sum, day) => sum + day.count, 0);
                          const maxDay = analyticsData.recent_activity.reduce((max, curr) => curr.count > max.count ? curr : max);
                          const avgDaily = weekTotal / 7;
                          
                          return (
                            <>
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                                <div className="text-green-800 dark:text-green-300 font-medium">📈 Most Active Day</div>
                                <div className="text-sm text-green-600 dark:text-green-400">{maxDay.date} - {maxDay.count} concepts</div>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="text-blue-800 dark:text-blue-300 font-medium">⚡ Daily Average</div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">{avgDaily.toFixed(1)} concepts per day</div>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                                <div className="text-purple-800 dark:text-purple-300 font-medium">🎯 Weekly Goal</div>
                                <div className="text-sm text-purple-600 dark:text-purple-400">
                                  {weekTotal >= 14 ? "🏆 Exceeded!" : weekTotal >= 7 ? "✅ On Track" : "🌱 Keep Going"}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Actionable Learning Dashboard */}
                  <div className={`bg-gradient-to-r rounded-xl p-6 border transition-colors duration-300 ${
                    darkMode 
                      ? 'from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-700' 
                      : 'from-indigo-50 via-purple-50 to-pink-50 border-indigo-200'
                  }`}>
                    <div className="flex items-center space-x-3 mb-6">
                      <Zap className={`w-6 h-6 transition-colors duration-300 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-600'
                      }`} />
                      <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>Your Next Learning Steps</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Smart Recommendations */}
                      <div className={`backdrop-blur-sm rounded-lg p-4 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/70' : 'bg-white/70'
                      }`}>
                        <h4 className={`font-semibold mb-3 flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                          Explore New Topics
                        </h4>
                        <div className="space-y-2 text-sm">
                          {analyticsData.popular_topics.length < 10 ? (
                            <>
                              <div className={`transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>• Try AI/Machine Learning basics</div>
                              <div className={`transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>• Explore programming concepts</div>
                              <div className={`transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>• Learn about data structures</div>
                            </>
                          ) : (
                            <>
                              <div className={`transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>• Advanced {analyticsData.popular_topics[0].topic} topics</div>
                              <div className={`transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>• Related to your interests</div>
                              <div className={`transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>• Cross-domain connections</div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={`backdrop-blur-sm rounded-lg p-4 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/70' : 'bg-white/70'
                      }`}>
                        <h4 className={`font-semibold mb-3 flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Target className="w-4 h-4 mr-2 text-green-500" />
                          Challenge Yourself
                        </h4>
                        <div className={`space-y-2 text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {(() => {
                            if (!analyticsData.level_distribution || analyticsData.level_distribution.length === 0) {
                              return (
                                <>
                                  <div>• Start with any difficulty level that feels comfortable</div>
                                  <div>• Experiment with different explanation depths</div>
                                  <div>• Try ELI5 for complex topics!</div>
                                </>
                              );
                            }
                            const currentLevel = analyticsData.level_distribution.reduce((max, curr) => curr.count > max.count ? curr : max).level;
                            const suggestions = {
                              'eli5': '• Try "student" level explanations\n• Build on simple concepts\n• Ask follow-up questions',
                              'student': '• Explore "graduate" complexity\n• Connect multiple concepts\n• Try practical applications',
                              'graduate': '• Challenge with "advanced" topics\n• Deep dive into specifics\n• Explore edge cases',
                              'advanced': '• Teach others what you know\n• Explore cutting-edge topics\n• Create connections'
                            };
                            return (suggestions[currentLevel] || suggestions.student).split('\n').map((suggestion, i) => (
                              <div key={i}>{suggestion}</div>
                            ));
                          })()}
                        </div>
                      </div>

                      <div className={`backdrop-blur-sm rounded-lg p-4 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800/70' : 'bg-white/70'
                      }`}>
                        <h4 className={`font-semibold mb-3 flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                          Learning Goals
                        </h4>
                        <div className={`space-y-2 text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <div>• Reach {Math.max(50, Math.ceil(analyticsData.total_explanations / 10) * 10)} total concepts</div>
                          <div>• Explore {Math.max(20, analyticsData.popular_topics.length + 5)} unique topics</div>
                          <div>• Maintain {Math.max(15, Math.ceil((analyticsData.recent_activity?.reduce((sum, day) => sum + day.count, 0) || 0) / 7 * 1.5))} concepts/week</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar to Next Milestone */}
                    <div className={`mt-6 p-4 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Progress to Next Milestone</span>
                        <span className={`text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {analyticsData.total_explanations}/{Math.ceil(analyticsData.total_explanations / 10) * 10} concepts
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-3 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (analyticsData.total_explanations / (Math.ceil(analyticsData.total_explanations / 10) * 10)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Footer with Export Option */}
                  <div className={`rounded-lg p-6 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                      <div className="text-center sm:text-left">
                        <div className={`flex items-center justify-center sm:justify-start space-x-2 text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                          <span>Last updated: {new Date(analyticsData.last_updated).toLocaleString()}</span>
                        </div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          Analytics calculated from your local browser data only
                        </div>
                        <div className={`text-xs mt-2 transition-colors duration-300 ${
                          darkMode ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>
                          💡 Your data is stored locally per browser. Switch browsers = fresh start!
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => {
                            const dataStr = JSON.stringify({
                              userSession: userSessionId,
                              analytics: analyticsData,
                              localHistory: localHistory,
                              exportDate: new Date().toISOString()
                            }, null, 2);
                            const dataBlob = new Blob([dataStr], {type: 'application/json'});
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `conceptai-learning-data-${new Date().toISOString().split('T')[0]}.json`;
                            link.click();
                          }}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Export your personal learning data"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export Data</span>
                        </button>
                        <button 
                          onClick={fetchAnalytics}
                          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30' 
                      : 'bg-gradient-to-r from-indigo-100 to-purple-100'
                  }`}>
                    <TrendingUp className={`w-10 h-10 transition-colors duration-300 ${
                      darkMode ? 'text-indigo-400' : 'text-indigo-500'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Start Your Learning Journey!</h3>
                  <p className={`mb-6 max-w-md mx-auto transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Your learning analytics will appear here once you start exploring concepts. 
                    Each explanation you request helps build your personal learning insights.
                  </p>
                  <div className="space-y-4">
                    <button 
                      onClick={fetchAnalytics}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>Check for Data</span>
                      </div>
                    </button>
                    <div className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <p>💡 Tip: Ask about any topic to start building your learning profile!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Keyboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Keyboard Shortcuts
                    </h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Speed up your workflow
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShortcuts(false)}
                  className={`p-2 rounded-lg transition-colors group ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  title="Close"
                >
                  <X className={`w-5 h-5 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {[
                { key: 'Ctrl + Enter', action: 'Submit topic for explanation' },
                { key: 'Ctrl + K', action: 'Focus on topic input field' },
                { key: 'Ctrl + D', action: 'Toggle dark mode' },
                { key: 'Escape', action: 'Close modals and dialogs' },
              ].map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {shortcut.action}
                  </span>
                  <div className="flex items-center space-x-1">
                    {shortcut.key.split(' + ').map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>+</span>}
                        <kbd className={`px-2 py-1 rounded text-xs font-mono ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300 border border-gray-600' 
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}>
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App with Theme Provider
export default function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}