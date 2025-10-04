import { WeatherIntent } from './weather-nlp';

interface ConversationContext {
  currentTopic?: string;
  relevantConditions: string[];
  locationHistory: string[];
  intentHistory: WeatherIntent[];
  recentMetrics: Set<string>;
  lastUpdateTime: number;
}

interface MemoryNode {
  type: 'location' | 'condition' | 'metric' | 'time';
  value: string;
  frequency: number;
  lastAccessed: number;
  relatedNodes: Set<string>;
}

export class WeatherConversationMemory {
  private context: ConversationContext;
  private memoryGraph: Map<string, MemoryNode>;
  private readonly MEMORY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_HISTORY = 10;

  constructor() {
    this.context = {
      relevantConditions: [],
      locationHistory: [],
      intentHistory: [],
      recentMetrics: new Set(),
      lastUpdateTime: Date.now()
    };
    this.memoryGraph = new Map();
  }

  public updateContext(
    intent: WeatherIntent,
    locations: string[],
    conditions: string[],
    metrics: string[]
  ): void {
    this.pruneOldMemory();

    // Update location history
    if (locations.length > 0) {
      this.context.locationHistory.unshift(...locations);
      this.context.locationHistory = [...new Set(this.context.locationHistory)].slice(0, this.MAX_HISTORY);
    }

    // Update intent history
    this.context.intentHistory.unshift(intent);
    this.context.intentHistory = this.context.intentHistory.slice(0, this.MAX_HISTORY);

    // Update metrics
    metrics.forEach(metric => this.context.recentMetrics.add(metric));

    // Update conditions and build relationships
    conditions.forEach(condition => {
      this.addToMemoryGraph('condition', condition);
      locations.forEach(location => {
        this.addToMemoryGraph('location', location);
        this.linkNodes(condition, location);
      });
    });

    this.context.lastUpdateTime = Date.now();
  }

  public getRelevantContext(
    query: string,
    currentLocation?: string
  ): {
    suggestedLocations: string[];
    relevantConditions: string[];
    commonMetrics: string[];
    relatedIntents: WeatherIntent[];
  } {
    this.pruneOldMemory();

    const result = {
      suggestedLocations: [],
      relevantConditions: [],
      commonMetrics: [],
      relatedIntents: []
    };

    // Find relevant locations
    if (currentLocation) {
      const locationNode = this.memoryGraph.get(this.getNodeKey('location', currentLocation));
      if (locationNode) {
        result.suggestedLocations = Array.from(locationNode.relatedNodes)
          .map(key => this.memoryGraph.get(key))
          .filter(node => node && node.type === 'location')
          .sort((a, b) => b!.frequency - a!.frequency)
          .map(node => node!.value)
          .slice(0, 3);
      }
    }

    // Find common conditions and metrics
    const recentLocations = new Set(this.context.locationHistory.slice(0, 3));
    for (const location of recentLocations) {
      const locationNode = this.memoryGraph.get(this.getNodeKey('location', location));
      if (locationNode) {
        locationNode.relatedNodes.forEach(key => {
          const node = this.memoryGraph.get(key);
          if (node) {
            if (node.type === 'condition') {
              result.relevantConditions.push(node.value);
            } else if (node.type === 'metric') {
              result.commonMetrics.push(node.value);
            }
          }
        });
      }
    }

    // Get related intents
    result.relatedIntents = this.context.intentHistory
      .filter(intent => this.isIntentRelevant(intent, query))
      .slice(0, 3);

    return {
      suggestedLocations: [...new Set(result.suggestedLocations)],
      relevantConditions: [...new Set(result.relevantConditions)],
      commonMetrics: [...new Set(result.commonMetrics)],
      relatedIntents: result.relatedIntents
    };
  }

  private addToMemoryGraph(type: MemoryNode['type'], value: string): void {
    const key = this.getNodeKey(type, value);
    const existing = this.memoryGraph.get(key);
    
    if (existing) {
      existing.frequency += 1;
      existing.lastAccessed = Date.now();
    } else {
      this.memoryGraph.set(key, {
        type,
        value,
        frequency: 1,
        lastAccessed: Date.now(),
        relatedNodes: new Set()
      });
    }
  }

  private linkNodes(value1: string, value2: string): void {
    const keys = [value1, value2].map(v => this.getNodeKey('condition', v));
    const nodes = keys.map(k => this.memoryGraph.get(k));
    
    if (nodes[0] && nodes[1]) {
      nodes[0].relatedNodes.add(keys[1]);
      nodes[1].relatedNodes.add(keys[0]);
    }
  }

  private getNodeKey(type: MemoryNode['type'], value: string): string {
    return `${type}:${value.toLowerCase()}`;
  }

  private pruneOldMemory(): void {
    const now = Date.now();
    for (const [key, node] of this.memoryGraph.entries()) {
      if (now - node.lastAccessed > this.MEMORY_TIMEOUT) {
        this.memoryGraph.delete(key);
      }
    }
  }

  private isIntentRelevant(intent: WeatherIntent, query: string): boolean {
    // Check if the intent matches the current query context
    // This is a simple implementation - could be made more sophisticated
    return intent.type === 'current' || query.toLowerCase().includes(intent.type);
  }
}