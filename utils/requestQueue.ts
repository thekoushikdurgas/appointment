/**
 * Request Queue
 * 
 * Global sequential request queue that processes API calls one at a time (FIFO).
 * Provides optional priority levels and queue management.
 */

/**
 * Queue item interface
 */
interface QueueItem {
  id: string;
  priority: number; // Higher number = higher priority
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

/**
 * Queue status
 */
export interface QueueStatus {
  isProcessing: boolean;
  pending: number;
  executing: number;
  completed: number;
  enabled: boolean;
}

/**
 * Queue configuration
 */
interface QueueConfig {
  enabled: boolean;
  maxPriority: number;
}

/**
 * Default configuration
 */
const defaultConfig: QueueConfig = {
  enabled: true,
  maxPriority: 10,
};

/**
 * Queue state
 */
let queueConfig: QueueConfig = { ...defaultConfig };
let queue: QueueItem[] = [];
let isProcessing = false;
let queueStats = {
  completed: 0,
  executing: 0,
};

/**
 * Generate unique ID for queue item
 */
const generateQueueId = (): string => {
  return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Enable or disable the queue
 */
export const setQueueEnabled = (enabled: boolean): void => {
  queueConfig.enabled = enabled;
  
  if (enabled && !isProcessing) {
    // Start processing if queue was enabled and there are pending items
    processQueue();
  }
};

/**
 * Check if queue is enabled
 */
export const isQueueEnabled = (): boolean => {
  return queueConfig.enabled;
};

/**
 * Enqueue a request
 */
export const enqueueRequest = <T = any>(
  execute: () => Promise<T>,
  priority: number = 0
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    // If queue is disabled, execute immediately
    if (!queueConfig.enabled) {
      console.log('[QUEUE] Queue disabled, executing immediately');
      execute()
        .then(resolve)
        .catch(reject);
      return;
    }

    // Create queue item
    const item: QueueItem = {
      id: generateQueueId(),
      priority: Math.min(Math.max(priority, 0), queueConfig.maxPriority),
      execute,
      resolve,
      reject,
      timestamp: Date.now(),
    };

    console.log('[QUEUE] Enqueuing request:', {
      id: item.id,
      priority: item.priority,
      queueLength: queue.length,
      isProcessing,
    });

    // Add to queue
    queue.push(item);

    // Sort queue by priority (higher priority first), then by timestamp (FIFO for same priority)
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Earlier timestamp first (FIFO)
    });

    console.log('[QUEUE] Queue state after enqueue:', {
      queueLength: queue.length,
      isProcessing,
    });

    // Start processing if not already processing
    if (!isProcessing) {
      console.log('[QUEUE] Starting queue processing');
      processQueue();
    }
  });
};

/**
 * Process the queue
 */
const processQueue = async (): Promise<void> => {
  console.log('[QUEUE] processQueue called, state:', {
    enabled: queueConfig.enabled,
    isProcessing,
    queueLength: queue.length,
  });

  // Don't process if queue is disabled
  if (!queueConfig.enabled) {
    console.log('[QUEUE] Queue disabled, stopping processing');
    isProcessing = false;
    return;
  }

  // Don't process if already processing
  if (isProcessing) {
    console.log('[QUEUE] Already processing, returning');
    return;
  }

  // Don't process if queue is empty
  if (queue.length === 0) {
    console.log('[QUEUE] Queue empty, stopping processing');
    isProcessing = false;
    return;
  }

  // Mark as processing
  isProcessing = true;
  queueStats.executing = 1;
  console.log('[QUEUE] Starting to process queue item');

  // Get next item from queue (highest priority, oldest timestamp)
  const item = queue.shift();
  
  if (!item) {
    console.log('[QUEUE] No item found after shift');
    isProcessing = false;
    queueStats.executing = 0;
    return;
  }

  console.log('[QUEUE] Processing item:', {
    id: item.id,
    priority: item.priority,
    remainingInQueue: queue.length,
  });

  try {
    console.log('[QUEUE] Executing request for item:', item.id);
    // Execute the request
    const result = await item.execute();
    console.log('[QUEUE] Request completed successfully for item:', item.id);
    
    // Resolve the promise
    item.resolve(result);
    
    // Update stats
    queueStats.completed++;
  } catch (error) {
    console.error('[QUEUE] Request failed for item:', item.id, error);
    // Reject the promise
    item.reject(error);
  } finally {
    // Mark as not processing
    queueStats.executing = 0;
    isProcessing = false;
    
    console.log('[QUEUE] Item processed, checking for next item:', {
      remainingInQueue: queue.length,
    });
    
    // Process next item
    processQueue();
  }
};

/**
 * Clear the queue
 */
export const clearQueue = (): void => {
  // Reject all pending items
  queue.forEach(item => {
    item.reject(new Error('Queue cleared'));
  });
  
  // Clear the queue
  queue = [];
  isProcessing = false;
  queueStats.executing = 0;
};

/**
 * Get queue status
 */
export const getQueueStatus = (): QueueStatus => {
  return {
    isProcessing,
    pending: queue.length,
    executing: queueStats.executing,
    completed: queueStats.completed,
    enabled: queueConfig.enabled,
  };
};

/**
 * Reset queue statistics
 */
export const resetQueueStats = (): void => {
  queueStats = {
    completed: 0,
    executing: 0,
  };
};

/**
 * Get queue size
 */
export const getQueueSize = (): number => {
  return queue.length;
};

