/**
 * Sequential Group Execution
 * 
 * Utilities for executing groups of related API calls sequentially or concurrently.
 */

/**
 * Result of a single request in a group
 */
export interface GroupRequestResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  index: number;
}

/**
 * Result of a group execution
 */
export interface GroupExecutionResult<T = any> {
  results: GroupRequestResult<T>[];
  allSucceeded: boolean;
  anySucceeded: boolean;
  errors: Error[];
}

/**
 * Execute requests sequentially (one after another)
 * 
 * @param requests - Array of request functions to execute
 * @param useQueue - Whether to use the global request queue (default: true)
 * @returns Promise resolving to aggregated results
 */
export const executeSequentially = async <T = any>(
  requests: Array<() => Promise<T>>,
  useQueue: boolean = true
): Promise<GroupExecutionResult<T>> => {
  const results: GroupRequestResult<T>[] = [];
  const errors: Error[] = [];

  for (let i = 0; i < requests.length; i++) {
    const requestFn = requests[i];
    
    try {
      let result: T;
      
      if (useQueue) {
        // Use queue for sequential execution
        const { enqueueRequest } = await import('./requestQueue');
        result = await enqueueRequest(requestFn);
      } else {
        // Execute directly (still sequential, but bypasses queue)
        result = await requestFn();
      }

      results.push({
        success: true,
        data: result,
        index: i,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      
      results.push({
        success: false,
        error: err,
        index: i,
      });
    }
  }

  return {
    results,
    allSucceeded: errors.length === 0,
    anySucceeded: results.some(r => r.success),
    errors,
  };
};

/**
 * Execute requests concurrently (in parallel)
 * 
 * Note: This bypasses the global request queue and executes all requests in parallel.
 * Use with caution as it may overwhelm the server or cause rate limiting.
 * 
 * @param requests - Array of request functions to execute
 * @returns Promise resolving to aggregated results
 */
export const executeConcurrently = async <T = any>(
  requests: Array<() => Promise<T>>
): Promise<GroupExecutionResult<T>> => {
  // Execute all requests in parallel
  const promises = requests.map((requestFn, index) =>
    requestFn()
      .then((data: T) => ({
        success: true,
        data,
        index,
      } as GroupRequestResult<T>))
      .catch((error: any) => ({
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        index,
      } as GroupRequestResult<T>))
  );

  const results = await Promise.all(promises);
  const errors = results
    .filter(r => !r.success)
    .map(r => r.error!)
    .filter((e): e is Error => e !== undefined);

  return {
    results,
    allSucceeded: errors.length === 0,
    anySucceeded: results.some(r => r.success),
    errors,
  };
};

/**
 * Execute requests with a concurrency limit
 * 
 * Executes requests in batches, with a maximum number of concurrent requests.
 * 
 * @param requests - Array of request functions to execute
 * @param concurrency - Maximum number of concurrent requests (default: 3)
 * @param useQueue - Whether to use the global request queue for each batch (default: true)
 * @returns Promise resolving to aggregated results
 */
export const executeWithConcurrencyLimit = async <T = any>(
  requests: Array<() => Promise<T>>,
  concurrency: number = 3,
  useQueue: boolean = true
): Promise<GroupExecutionResult<T>> => {
  const results: GroupRequestResult<T>[] = [];
  const errors: Error[] = [];

  // Process requests in batches
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    
    // Execute batch sequentially if using queue, otherwise concurrently
    const batchResults = useQueue
      ? await executeSequentially(batch, true)
      : await executeConcurrently(batch);

    results.push(...batchResults.results);
    errors.push(...batchResults.errors);
  }

  return {
    results,
    allSucceeded: errors.length === 0,
    anySucceeded: results.some(r => r.success),
    errors,
  };
};

