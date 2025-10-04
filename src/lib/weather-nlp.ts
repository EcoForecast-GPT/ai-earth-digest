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
const weatherPatterns = {
  timeExpressions: [
    /(?:next|last|this)\s+(?:week|month|year|season)/i,
    /(?:in|during|for)\s+(?:summer|winter|spring|fall|autumn)/i,
    /(?:from|between)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)\s+(?:to|and|until)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
    /(?:early|mid|late)\s+([A-Za-z]+)/i
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
  // Implementation of sophisticated date processing
  // This is a placeholder - actual implementation would be more complex
  return {
    start: new Date(),
    end: new Date(),
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