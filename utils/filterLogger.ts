/**
 * Filter Logger Utility
 * 
 * Provides comprehensive logging for filter operations with:
 * - Structured logging format
 * - Toggle-able via localStorage flag
 * - Color-coded console output
 * - Filter change history tracking
 * 
 * Usage:
 * ```typescript
 * import { filterLogger } from '@/utils/filterLogger';
 * 
 * // Enable logging
 * filterLogger.enable();
 * 
 * // Log filter changes
 * filterLogger.logFilterChange('city', 'New York', 'San Francisco');
 * 
 * // Log API request
 * filterLogger.logApiRequest('/api/v1/contacts/', queryParams);
 * 
 * // Log API response
 * filterLogger.logApiResponse(200, { count: 150, results: [...] });
 * 
 * // Disable logging
 * filterLogger.disable();
 * ```
 */

const STORAGE_KEY = 'contacts_filter_debug';

export interface FilterChange {
  timestamp: number;
  filterName: string;
  oldValue: any;
  newValue: any;
}

export interface ApiRequest {
  timestamp: number;
  endpoint: string;
  queryParams: URLSearchParams | Record<string, any>;
  method: string;
}

export interface ApiResponse {
  timestamp: number;
  statusCode: number;
  data: any;
  duration?: number;
}

class FilterLogger {
  private enabled: boolean = false;
  private history: FilterChange[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    // Check localStorage for debug flag
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.enabled = stored === 'true';
    }
  }

  /**
   * Enable filter logging
   */
  enable(): void {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    console.log(
      '%c[FILTER DEBUG] Logging enabled',
      'color: #10b981; font-weight: bold; font-size: 12px;'
    );
  }

  /**
   * Disable filter logging
   */
  disable(): void {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'false');
    }
    console.log(
      '%c[FILTER DEBUG] Logging disabled',
      'color: #ef4444; font-weight: bold; font-size: 12px;'
    );
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggle logging on/off
   */
  toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  /**
   * Log a filter change
   */
  logFilterChange(filterName: string, oldValue: any, newValue: any): void {
    if (!this.enabled) return;

    const change: FilterChange = {
      timestamp: Date.now(),
      filterName,
      oldValue,
      newValue,
    };

    // Add to history
    this.history.push(change);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Format values for display
    const formatValue = (val: any): string => {
      if (val === null || val === undefined || val === '') return '(empty)';
      if (val === 'All') return '(All)';
      if (Array.isArray(val)) {
        return val.length === 0 ? '[]' : `[${val.join(', ')}]`;
      }
      return String(val);
    };

    console.log(
      `%c[FILTER CHANGE]%c ${filterName}%c: %c${formatValue(oldValue)}%c → %c${formatValue(newValue)}`,
      'color: #3b82f6; font-weight: bold;',
      'color: #8b5cf6; font-weight: bold;',
      'color: #6b7280;',
      'color: #ef4444; text-decoration: line-through;',
      'color: #6b7280;',
      'color: #10b981; font-weight: bold;'
    );
  }

  /**
   * Log multiple filter changes at once
   */
  logFilterChanges(changes: Record<string, { old: any; new: any }>): void {
    if (!this.enabled) return;

    console.group('%c[FILTER CHANGES] Multiple filters updated', 'color: #3b82f6; font-weight: bold;');
    Object.entries(changes).forEach(([filterName, { old: oldValue, new: newValue }]) => {
      this.logFilterChange(filterName, oldValue, newValue);
    });
    console.groupEnd();
  }

  /**
   * Log filter clear action
   */
  logFilterClear(filterNames: string[]): void {
    if (!this.enabled) return;

    console.log(
      `%c[FILTER CLEAR]%c Cleared ${filterNames.length} filter(s): %c${filterNames.join(', ')}`,
      'color: #f59e0b; font-weight: bold;',
      'color: #6b7280;',
      'color: #8b5cf6;'
    );
  }

  /**
   * Log API request with query parameters
   */
  logApiRequest(endpoint: string, queryParams: URLSearchParams | Record<string, any>, method: string = 'GET'): void {
    if (!this.enabled) return;

    const params = queryParams instanceof URLSearchParams 
      ? Object.fromEntries(queryParams.entries())
      : queryParams;

    const paramCount = Object.keys(params).length;
    const queryString = queryParams instanceof URLSearchParams
      ? queryParams.toString()
      : new URLSearchParams(params as any).toString();

    console.group(
      `%c[API REQUEST]%c ${method} ${endpoint}%c (${paramCount} params)`,
      'color: #06b6d4; font-weight: bold;',
      'color: #6b7280;',
      'color: #8b5cf6;'
    );
    
    console.log('%cQuery String:', 'color: #6b7280; font-weight: bold;');
    console.log(`%c${queryString || '(no parameters)'}`, 'color: #10b981;');
    
    if (paramCount > 0) {
      console.log('%cParameters:', 'color: #6b7280; font-weight: bold;');
      console.table(params);
    }
    
    console.groupEnd();
  }

  /**
   * Log API response
   */
  logApiResponse(statusCode: number, data: any, duration?: number): void {
    if (!this.enabled) return;

    const isSuccess = statusCode >= 200 && statusCode < 300;
    const statusColor = isSuccess ? '#10b981' : '#ef4444';
    
    const durationText = duration ? ` (${duration}ms)` : '';

    console.group(
      `%c[API RESPONSE]%c Status: %c${statusCode}${durationText}`,
      'color: #06b6d4; font-weight: bold;',
      'color: #6b7280;',
      `color: ${statusColor}; font-weight: bold;`
    );

    // Log result count if available
    if (data?.results) {
      console.log(
        `%cResults: %c${data.results.length} items`,
        'color: #6b7280; font-weight: bold;',
        'color: #10b981; font-weight: bold;'
      );
    }

    if (data?.count !== undefined) {
      console.log(
        `%cTotal Count: %c${data.count}`,
        'color: #6b7280; font-weight: bold;',
        'color: #10b981; font-weight: bold;'
      );
    }

    if (data?.meta) {
      console.log('%cMeta:', 'color: #6b7280; font-weight: bold;');
      console.table(data.meta);
    }

    // Log error details if present
    if (!isSuccess && data?.detail) {
      console.error('%cError:', 'color: #ef4444; font-weight: bold;', data.detail);
    }

    console.groupEnd();
  }

  /**
   * Log active filters summary
   */
  logActiveFilters(filters: Record<string, any>): void {
    if (!this.enabled) return;

    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (value === 'All' || value === '' || value === null || value === undefined) {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    });

    console.group(
      `%c[ACTIVE FILTERS]%c ${activeFilters.length} filter(s) applied`,
      'color: #8b5cf6; font-weight: bold;',
      'color: #6b7280;'
    );

    if (activeFilters.length > 0) {
      const filterObj = Object.fromEntries(activeFilters);
      console.table(filterObj);
    } else {
      console.log('%cNo filters applied', 'color: #6b7280; font-style: italic;');
    }

    console.groupEnd();
  }

  /**
   * Get filter change history
   */
  getHistory(): FilterChange[] {
    return [...this.history];
  }

  /**
   * Clear filter change history
   */
  clearHistory(): void {
    this.history = [];
    if (this.enabled) {
      console.log(
        '%c[FILTER DEBUG] History cleared',
        'color: #f59e0b; font-weight: bold;'
      );
    }
  }

  /**
   * Log filter statistics
   */
  logStatistics(stats: {
    totalFilters: number;
    activeFilters: number;
    filtersByCategory: Record<string, number>;
  }): void {
    if (!this.enabled) return;

    console.group(
      `%c[FILTER STATS]%c ${stats.activeFilters}/${stats.totalFilters} filters active`,
      'color: #8b5cf6; font-weight: bold;',
      'color: #6b7280;'
    );

    console.log('%cBy Category:', 'color: #6b7280; font-weight: bold;');
    console.table(stats.filtersByCategory);

    console.groupEnd();
  }

  /**
   * Log a custom debug message
   */
  log(message: string, data?: any): void {
    if (!this.enabled) return;

    if (data) {
      console.log(
        `%c[FILTER DEBUG]%c ${message}`,
        'color: #6b7280; font-weight: bold;',
        'color: #6b7280;',
        data
      );
    } else {
      console.log(
        `%c[FILTER DEBUG]%c ${message}`,
        'color: #6b7280; font-weight: bold;',
        'color: #6b7280;'
      );
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, data?: any): void {
    if (!this.enabled) return;

    if (data) {
      console.warn(
        `%c[FILTER WARNING]%c ${message}`,
        'color: #f59e0b; font-weight: bold;',
        'color: #6b7280;',
        data
      );
    } else {
      console.warn(
        `%c[FILTER WARNING]%c ${message}`,
        'color: #f59e0b; font-weight: bold;',
        'color: #6b7280;'
      );
    }
  }

  /**
   * Log an error
   */
  error(message: string, error?: any): void {
    if (!this.enabled) return;

    if (error) {
      console.error(
        `%c[FILTER ERROR]%c ${message}`,
        'color: #ef4444; font-weight: bold;',
        'color: #6b7280;',
        error
      );
    } else {
      console.error(
        `%c[FILTER ERROR]%c ${message}`,
        'color: #ef4444; font-weight: bold;',
        'color: #6b7280;'
      );
    }
  }
}

// Export singleton instance
export const filterLogger = new FilterLogger();

// Export to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).filterLogger = filterLogger;
  
  // Log instructions on how to use
  if (filterLogger.isEnabled()) {
    console.log(
      '%c[FILTER DEBUG]%c Available commands:\n' +
      '  • filterLogger.enable() - Enable logging\n' +
      '  • filterLogger.disable() - Disable logging\n' +
      '  • filterLogger.toggle() - Toggle logging\n' +
      '  • filterLogger.getHistory() - View change history\n' +
      '  • filterLogger.clearHistory() - Clear history',
      'color: #10b981; font-weight: bold;',
      'color: #6b7280;'
    );
  }
}

