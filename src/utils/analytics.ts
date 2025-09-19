// Simple analytics utility for tracking user behavior
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem('analytics-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.isEnabled = prefs.enabled !== false;
      }
    } catch (error) {
      console.warn('Failed to load analytics preferences:', error);
    }
  }

  enable() {
    this.isEnabled = true;
    this.savePreferences();
  }

  disable() {
    this.isEnabled = false;
    this.events = []; // Clear existing events
    this.savePreferences();
  }

  private savePreferences() {
    try {
      localStorage.setItem('analytics-preferences', JSON.stringify({
        enabled: this.isEnabled
      }));
    } catch (error) {
      console.warn('Failed to save analytics preferences:', error);
    }
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now()
    };

    this.events.push(event);
    
    // Keep only last 1000 events to prevent memory bloat
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Save to localStorage for persistence
    this.saveEvents();
  }

  private saveEvents() {
    try {
      localStorage.setItem('analytics-events', JSON.stringify(this.events));
    } catch (error) {
      // If storage is full, clear old events and try again
      this.events = this.events.slice(-500);
      try {
        localStorage.setItem('analytics-events', JSON.stringify(this.events));
      } catch (retryError) {
        console.warn('Failed to save analytics events:', retryError);
      }
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getEventsSince(timestamp: number): AnalyticsEvent[] {
    return this.events.filter(event => event.timestamp >= timestamp);
  }

  getEventsByName(eventName: string): AnalyticsEvent[] {
    return this.events.filter(event => event.name === eventName);
  }

  getStats() {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEvents = this.events.length;
    const uniqueEvents = Object.keys(eventCounts).length;
    const dateRange = this.events.length > 0 ? {
      start: new Date(Math.min(...this.events.map(e => e.timestamp))),
      end: new Date(Math.max(...this.events.map(e => e.timestamp)))
    } : null;

    return {
      totalEvents,
      uniqueEvents,
      eventCounts,
      dateRange,
      isEnabled: this.isEnabled
    };
  }

  clearEvents() {
    this.events = [];
    try {
      localStorage.removeItem('analytics-events');
    } catch (error) {
      console.warn('Failed to clear analytics events:', error);
    }
  }

  // Load events from localStorage on initialization
  private loadEvents() {
    try {
      const saved = localStorage.getItem('analytics-events');
      if (saved) {
        this.events = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load analytics events:', error);
      this.events = [];
    }
  }
}

// Initialize and load saved events
const analytics = new Analytics();
(analytics as any).loadEvents?.();

export { analytics };

// Common event tracking functions
export const trackUserAction = (action: string, context?: string, metadata?: Record<string, any>) => {
  analytics.track('user_action', {
    action,
    context,
    ...metadata
  });
};

export const trackPlaybackEvent = (event: string, trackId?: string, metadata?: Record<string, any>) => {
  analytics.track('playback_event', {
    event,
    trackId,
    ...metadata
  });
};

export const trackFeatureUsage = (feature: string, metadata?: Record<string, any>) => {
  analytics.track('feature_usage', {
    feature,
    ...metadata
  });
};

export const trackError = (error: string, context?: string, metadata?: Record<string, any>) => {
  analytics.track('error', {
    error,
    context,
    ...metadata
  });
};
