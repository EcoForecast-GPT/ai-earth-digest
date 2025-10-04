export interface DateParseResult {
  date: Date;
  confidence: number;
  matches: string[];
}

export function parseNaturalDate(text: string): DateParseResult | null {
  if (!text) return null;
  
  const normalized = text.toLowerCase().trim();
  
  // Initialize result
  let result: DateParseResult = {
    date: new Date(),
    confidence: 0,
    matches: []
  };

  // Array of month names and their variations
  const months: { [key: string]: number } = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };

  // Pattern matchers with their confidence scores
  const patterns = [
    // ISO format: YYYY-MM-DD
    {
      regex: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
      confidence: 1.0,
      parse: (matches: string[]) => {
        const [_, year, month, day] = matches;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    },
    // DD/MM/YYYY or MM/DD/YYYY
    {
      regex: /\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/,
      confidence: 0.9,
      parse: (matches: string[]) => {
        let [_, part1, part2, year] = matches;
        // Convert 2-digit year to 4-digit
        if (year.length === 2) year = '20' + year;
        
        // Try to determine if it's DD/MM or MM/DD
        const p1 = parseInt(part1);
        const p2 = parseInt(part2);
        
        // If first number is > 12, it must be a day
        if (p1 > 12) {
          return new Date(parseInt(year), p2 - 1, p1);
        }
        // If second number is > 12, it must be a day
        if (p2 > 12) {
          return new Date(parseInt(year), p1 - 1, p2);
        }
        // Default to MM/DD format
        return new Date(parseInt(year), p1 - 1, p2);
      }
    },
    // Month DD, YYYY or DD Month YYYY
    {
      regex: new RegExp(`\\b(${Object.keys(months).join('|')}|\\d{1,2})\\s*[,\\s]\\s*(\\d{1,2}|${Object.keys(months).join('|')})\\s*[,\\s]\\s*(\\d{4})\\b`, 'i'),
      confidence: 0.95,
      parse: (matches: string[]) => {
        let [_, part1, part2, year] = matches;
        part1 = part1.toLowerCase();
        part2 = part2.toLowerCase();
        
        // Determine if part1 is month or day
        let month: number, day: number;
        if (months[part1] !== undefined) {
          month = months[part1];
          day = parseInt(part2);
        } else if (months[part2] !== undefined) {
          month = months[part2];
          day = parseInt(part1);
        } else {
          // Both are numbers, assume American format (month first)
          month = parseInt(part1) - 1;
          day = parseInt(part2);
        }
        
        return new Date(parseInt(year), month, day);
      }
    },
    // Relative dates (tomorrow, next week, etc.)
    {
      regex: /\b(tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in\s+(\d+)\s+days?)\b/i,
      confidence: 0.8,
      parse: (matches: string[]) => {
        const today = new Date();
        if (matches[1].toLowerCase() === 'tomorrow') {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          return tomorrow;
        }
        if (matches[1].startsWith('next ')) {
          const dayName = matches[1].split(' ')[1].toLowerCase();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = days.indexOf(dayName);
          const currentDay = today.getDay();
          const daysAhead = (targetDay + 7 - currentDay) % 7;
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysAhead);
          return targetDate;
        }
        if (matches[1].startsWith('in ')) {
          const daysAhead = parseInt(matches[2]);
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysAhead);
          return targetDate;
        }
        return today;
      }
    },
    // This/next month/year
    {
      regex: /\b(this|next)\s+(month|year)\b/i,
      confidence: 0.7,
      parse: (matches: string[]) => {
        const today = new Date();
        const isNext = matches[1].toLowerCase() === 'next';
        const unit = matches[2].toLowerCase();
        
        if (unit === 'month') {
          today.setMonth(today.getMonth() + (isNext ? 1 : 0));
        } else if (unit === 'year') {
          today.setFullYear(today.getFullYear() + (isNext ? 1 : 0));
        }
        
        return today;
      }
    }
  ];

  // Try each pattern and find the highest confidence match
  let bestMatch: DateParseResult | null = null;
  
  for (const pattern of patterns) {
    const matches = normalized.match(pattern.regex);
    if (matches) {
      const parsedDate = pattern.parse(matches);
      if (isValidDate(parsedDate)) {
        const match: DateParseResult = {
          date: parsedDate,
          confidence: pattern.confidence,
          matches: Array.from(matches)
        };
        
        if (!bestMatch || match.confidence > bestMatch.confidence) {
          bestMatch = match;
        }
      }
    }
  }
  
  return bestMatch;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}