export interface WeatherIntent {
  type: 'current' | 'forecast' | 'historical' | 'comparison' | 'trend' | 'advice';
  timeframe?: {
    start?: Date;
    end?: Date;
    period?: 'day' | 'week' | 'month' | 'season' | 'year';
  };
  location?: {
    primary?: string;
    compare?: string;
    coordinates?: { lat: number; lon: number };
  };
  metrics?: Array<'temperature' | 'precipitation' | 'humidity' | 'wind' | 'pressure'>;
  context?: {
    previousIntent?: WeatherIntent;
    conversationTopic?: string;
    relevantConditions?: string[];
  };
}

interface NLPResult {
  intent: WeatherIntent;
  confidence: number;
  entities: {
    dates: Date[];
    locations: string[];
    metrics: string[];
    conditions: string[];
  };
  context?: {
    requiresClarity?: boolean;
    missingInfo?: string[];
    suggestedFollowUp?: string;
  };
}

// Sophisticated patterns for weather-specific language
const commonQuestions = {
  clothing: [
    /what (should|can) I wear/i,
    /do I need (a|an|to bring|to wear)/i,
    /(should|can) I wear/i,
    /dress code/i,
    /clothing advice/i,
    /bring (umbrella|jacket|coat|sunscreen)/i
  ],
  activities: [
    /can I (go|do)/i,
    /(good|nice|okay) (for|to) (go|do)/i,
    /(should|can) we (plan|have|do)/i,
    /planning (a|an|to|for)/i,
    /(possible|safe) to/i
  ],
  comfort: [
    /will (it|the weather) be (nice|good|okay|comfortable)/i,
    /how (hot|cold|warm|cool|wet|dry|humid) will it be/i,
    /will I (need|be|feel)/i,
    /(feel|feels) like/i
  ],
  risk: [
    /risk of (rain|storm|snow|heat|cold)/i,
    /chance of (rain|storm|snow|precipitation)/i,
    /will it (rain|snow|storm)/i,
    /weather warning/i,
    /(dangerous|safe|risky)/i
  ],
  comparison: [
    /(warmer|colder|better|worse) than/i,
    /compared to/i,
    /difference between/i,
    /same as/i,
    /like (yesterday|last|previous)/i
  ]
};

const weatherPatterns = {
  timeExpressions: [
    /(?:next|last|this)\s+(?:week|month|year|season)/i,
    /(?:in|during|for)\s+(?:summer|winter|spring|fall|autumn)/i,
    /(?:from|between)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)\s+(?:to|and|until)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
    /(?:early|mid|late)\s+([A-Za-z]+)/i,
    /(?:tomorrow|today|yesterday)/i,
    /(?:in|after)\s+(\d+)\s+(?:day|days)/i,
    /next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(?:morning|afternoon|evening|night)/i,
    /(?:this|later|earlier)\s+(?:morning|afternoon|evening|night)/i
  ],
  
  locationPatterns: [
    /(?:in|at|near|around)\s+([A-Za-z\s]+)(?:\s*,\s*([A-Za-z\s]+))?/i,
    /(?:between|from)\s+([A-Za-z\s]+)\s+(?:and|to)\s+([A-Za-z\s]+)/i,
    /(\d+\.?\d*)\s*°?\s*[NS]\s*,\s*(\d+\.?\d*)\s*°?\s*[EW]/i
  ],

  metricPatterns: [
    /(?:temperature|temp|hot|cold|warm|cool)/i,
    /(?:rain|precipitation|snow|hail|sleet)/i,
    /(?:humidity|humid|dry|moisture)/i,
    /(?:wind|breeze|gust)/i,
    /(?:pressure|barometric|atmospheric)/i
  ],

  comparisonPatterns: [
    /(?:compare|versus|vs|difference|between)/i,
    /(?:more|less|higher|lower|warmer|colder)\s+than/i,
    /(?:similar|like|as)\s+(?:to|in)/i
  ]
};

export function parseWeatherQuery(
  query: string,
  conversationContext?: {
    previousQueries?: string[];
    previousIntents?: WeatherIntent[];
    currentLocation?: string;
    currentTimeframe?: { start: Date; end: Date };
  }
): NLPResult {
  const result: NLPResult = {
    intent: { type: 'current' },
    confidence: 0,
    entities: {
      dates: [],
      locations: [],
      metrics: [],
      conditions: []
    }
  };

  // Determine primary intent
  if (query.match(/(?:forecast|prediction|will it|expected|upcoming|next)/i)) {
    result.intent.type = 'forecast';
  } else if (query.match(/(?:history|historical|past|previous|last|before)/i)) {
    result.intent.type = 'historical';
  } else if (query.match(/(?:compare|versus|vs|difference|between)/i)) {
    result.intent.type = 'comparison';
  } else if (query.match(/(?:trend|pattern|change|shift|development)/i)) {
    result.intent.type = 'trend';
  } else if (query.match(/(?:should|recommend|advice|suggest|better to)/i)) {
    result.intent.type = 'advice';
  }

  // Extract timeframe
  for (const pattern of weatherPatterns.timeExpressions) {
    const match = query.match(pattern);
    if (match) {
      // Process timeframe based on matched expression
      const timeframe = processTimeframe(match[0], new Date());
      if (timeframe) {
        result.intent.timeframe = timeframe;
      }
    }
  }

  // Extract locations
  for (const pattern of weatherPatterns.locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      if (match[1]) result.entities.locations.push(match[1].trim());
      if (match[2]) result.entities.locations.push(match[2].trim());
    }
  }

  // Extract metrics
  for (const pattern of weatherPatterns.metricPatterns) {
    const match = query.match(pattern);
    if (match) {
      result.entities.metrics.push(match[0].toLowerCase());
    }
  }

  // Consider conversation context
  if (conversationContext) {
    if (conversationContext.currentLocation && result.entities.locations.length === 0) {
      result.entities.locations.push(conversationContext.currentLocation);
    }
    if (conversationContext.previousIntents && conversationContext.previousIntents.length > 0) {
      result.intent.context = {
        previousIntent: conversationContext.previousIntents[conversationContext.previousIntents.length - 1]
      };
    }
  }

  // Calculate confidence based on extracted information
  result.confidence = calculateConfidence(result);

  // Check if clarification is needed
  const missingInfo = checkRequiredInfo(result);
  if (missingInfo.length > 0) {
    result.context = {
      requiresClarity: true,
      missingInfo,
      suggestedFollowUp: generateClarifyingQuestion(missingInfo)
    };
  }

  return result;
}

function processTimeframe(expression: string, currentDate: Date): WeatherIntent['timeframe'] {
  const lowerExpression = expression.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lowerExpression === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      start: tomorrow,
      end: tomorrow,
      period: 'day'
    };
  }

  if (lowerExpression === 'today') {
    return {
      start: today,
      end: today,
      period: 'day'
    };
  }

  if (lowerExpression === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      start: yesterday,
      end: yesterday,
      period: 'day'
    };
  }

  // Handle "in X days"
  const daysMatch = lowerExpression.match(/(?:in|after)\s+(\d+)\s+(?:day|days)/);
  if (daysMatch) {
    const daysToAdd = parseInt(daysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysToAdd);
    return {
      start: futureDate,
      end: futureDate,
      period: 'day'
    };
  }

  // Handle next weekday
  const weekdayMatch = lowerExpression.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekdayMatch) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = weekdays.indexOf(weekdayMatch[1]);
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + (7 + targetDay - today.getDay()) % 7);
    return {
      start: nextDate,
      end: nextDate,
      period: 'day'
    };
  }

  // Handle relative time periods
  if (lowerExpression.match(/next\s+(?:week|month|year|season)/)) {
    const period = lowerExpression.split(' ')[1] as 'week' | 'month' | 'year' | 'season';
    const start = new Date(today);
    const end = new Date(today);
    
    switch (period) {
      case 'week':
        start.setDate(today.getDate() + 7);
        end.setDate(today.getDate() + 13);
        break;
      case 'month':
        start.setMonth(today.getMonth() + 1);
        end.setMonth(today.getMonth() + 2, 0);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() + 1);
        end.setFullYear(today.getFullYear() + 2, 0);
        break;
      case 'season':
        start.setMonth(Math.floor((today.getMonth() + 3) / 3) * 3 + 3);
        end.setMonth(Math.floor((today.getMonth() + 3) / 3) * 3 + 5, 30);
        break;
    }
    
    return { start, end, period };
  }

  // Default to today if no pattern matches
  return {
    start: today,
    end: today,
    period: 'day'
  };
}

function calculateConfidence(result: NLPResult): number {
  let confidence = 0.5; // Base confidence
  
  // Add confidence based on clear intent matches
  if (result.intent.type !== 'current') confidence += 0.1;
  
  // Add confidence for each piece of extracted information
  if (result.intent.timeframe) confidence += 0.1;
  if (result.entities.locations.length > 0) confidence += 0.1;
  if (result.entities.metrics.length > 0) confidence += 0.1;
  
  // Reduce confidence if context suggests missing information
  if (result.context?.requiresClarity) confidence -= 0.2;
  
  return Math.min(1, Math.max(0, confidence));
}

function checkRequiredInfo(result: NLPResult): string[] {
  const missing: string[] = [];
  
  // Check for required information based on intent type
  switch (result.intent.type) {
    case 'comparison':
      if (result.entities.locations.length < 2) {
        missing.push('second_location');
      }
      break;
    case 'trend':
      if (!result.intent.timeframe) {
        missing.push('time_period');
      }
      break;
    case 'forecast':
      if (!result.intent.timeframe) {
        missing.push('future_date');
      }
      break;
  }
  
  if (result.entities.locations.length === 0) {
    missing.push('location');
  }
  
  return missing;
}

function generateClarifyingQuestion(missingInfo: string[]): string {
  const questions = {
    location: 'Which location would you like to know about?',
    second_location: 'Which location would you like to compare with?',
    time_period: 'What time period are you interested in?',
    future_date: 'How far into the future would you like the forecast for?'
  };
  
  return questions[missingInfo[0]] || 'Could you provide more details about your request?';
}