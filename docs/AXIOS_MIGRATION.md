# Axios Migration Documentation

## Overview

This document describes the migration from fetch-based API calls to Axios with parallel execution and automatic response caching with fallback storage.

## Architecture

### Core Components

1. **Axios Client** (`utils/axiosClient.ts`)
   - Configured Axios instance with base URL
   - Request/response interceptors for authentication
   - Automatic token refresh on 401 errors
   - Error handling and conversion

2. **API Cache** (`utils/apiCache.ts`)
   - Automatic response caching with TTL
   - In-memory cache with localStorage fallback
   - Cache key generation from URL + params + method
   - Automatic cache invalidation

3. **API Storage** (`utils/apiStorage.ts`)
   - Fallback storage for API results
   - Storage chain: sessionStorage → localStorage → cookies
   - Automatic expiration and cleanup

4. **Axios Request Wrapper** (`utils/request/axiosRequest.ts`)
   - Unified request wrapper combining cache + storage + Axios
   - Drop-in replacements for `request()` and `authenticatedFetch()`
   - Configurable cache per request
   - Parallel execution by default

5. **Sequential Group Execution** (`utils/sequentialGroup.ts`)
   - Utilities for executing groups of related API calls
   - Sequential or concurrent execution options
   - Concurrency limits

## Migration Summary

All 10 service files have been migrated from fetch to Axios:

### Phase 1 - Foundation
- ✅ `services/api.ts` - API info endpoint
- ✅ `services/health.ts` - Health checks

### Phase 2 - Authentication
- ✅ `services/auth.ts` - Login, register, token refresh

### Phase 3 - Core Features
- ✅ `services/user.ts` - User profile operations
- ✅ `services/contact.ts` - Contact operations (8 API calls)
- ✅ `services/company.ts` - Company operations (13 API calls)

### Phase 4 - Additional Features
- ✅ `services/apollo.ts` - Apollo analytics (2 API calls)
- ✅ `services/analytics.ts` - Analytics (9 API calls)
- ✅ `services/aiChat.ts` - AI chat (5 API calls)
- ✅ `services/import.ts` - Import operations (4 API calls)

## API Changes

### Request Functions

#### Before (fetch-based)
```typescript
import { request, authenticatedFetch } from '../utils/request';
import { authenticatedFetch } from './auth';

const response = await request(url, {
  method: 'GET',
  timeout: 336000000,
  retries: 1,
});

const response = await authenticatedFetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

#### After (Axios-based)
```typescript
import { axiosRequest, axiosAuthenticatedRequest } from '../utils/axiosRequest';

const response = await axiosRequest(url, {
  method: 'GET',
  timeout: 336000000,
  useCache: true,
});

const response = await axiosAuthenticatedRequest(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  data: data, // Note: 'data' instead of 'body', no JSON.stringify needed
  useCache: false,
});
```

### Key Differences

1. **Body vs Data**: Use `data` instead of `body`, and no need for `JSON.stringify()` - Axios handles it automatically
2. **FormData**: Still works, but Axios handles Content-Type automatically
3. **Response Interface**: Returns a Response-like object compatible with existing code
4. **Cache Options**: Options `useCache`, `cacheTTL`, `skipCache`, `invalidateCache`
5. **Parallel Execution**: All API calls execute in parallel by default (no queue)

## Request Options

### AxiosRequestOptions

```typescript
interface AxiosRequestOptions extends AxiosRequestConfig {
  useCache?: boolean;      // Use response caching (default: true)
  cacheTTL?: number;       // Cache TTL in milliseconds (default: 5 minutes)
  skipCache?: boolean;     // Skip cache check (force fresh request)
  invalidateCache?: string | RegExp; // Pattern to invalidate cache entries
}
```

### Examples

```typescript
// Custom cache TTL
await axiosRequest(url, {
  method: 'GET',
  useCache: true,
  cacheTTL: 10 * 60 * 1000, // 10 minutes
});

// Invalidate cache on write
await axiosAuthenticatedRequest(url, {
  method: 'PUT',
  invalidateCache: /^\/api\/v1\/contacts/,
});
```

## API Storage Management

### Storage Fallback Chain

API results are automatically stored with a fallback chain:
1. **sessionStorage** (primary) - Fast, session-scoped
2. **localStorage** (secondary) - Persistent across sessions
3. **cookies** (tertiary) - Works even when storage is disabled

### Storage Functions

```typescript
import { getApiResult, setApiResult, clearApiResult } from '../utils/apiStorage';

// Get stored API result
const cached = getApiResult(cacheKey);

// Store API result
setApiResult(cacheKey, data, ttl);

// Clear stored result
clearApiResult(cacheKey);
```

## Cache Management

### Cache Statistics

```typescript
import { getCacheStats } from '../utils/apiCache';

const stats = getCacheStats();
console.log({
  hits: stats.hits,
  misses: stats.misses,
  size: stats.size,
  hitRate: stats.hitRate,
});
```

### Clear Cache

```typescript
import { clearCache, clearCacheByPattern, clearCacheEntry } from '../utils/apiCache';

// Clear all cache
clearCache();

// Clear cache by pattern
clearCacheByPattern(/^\/api\/v1\/contacts/);

// Clear specific entry
clearCacheEntry(cacheKey);
```

## Sequential Group Execution

### Execute Sequentially

```typescript
import { executeSequentially } from '../utils/sequentialGroup';

const results = await executeSequentially([
  () => fetchUser(),
  () => fetchContacts(),
  () => fetchCompanies(),
]);

if (results.allSucceeded) {
  console.log('All requests succeeded');
} else {
  console.error('Some requests failed:', results.errors);
}
```

### Execute Concurrently

```typescript
import { executeConcurrently } from '../utils/sequentialGroup';

const results = await executeConcurrently([
  () => fetchUser(),
  () => fetchContacts(),
  () => fetchCompanies(),
]);
```

### Execute with Concurrency Limit

```typescript
import { executeWithConcurrencyLimit } from '../utils/sequentialGroup';

// Execute 3 requests at a time
const results = await executeWithConcurrencyLimit(
  requests,
  3 // concurrency limit
);
```

## Error Handling

Error handling remains the same - all errors are converted to the existing `ParsedError` format:

```typescript
try {
  const response = await axiosAuthenticatedRequest(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await parseApiError(response, 'Request failed');
    throw new Error(formatErrorMessage(error, 'Request failed'));
  }

  const data = await response.json();
} catch (error) {
  const parsedError = parseExceptionError(error, 'Request failed');
  console.error(parsedError);
}
```

## Token Refresh

Token refresh is handled automatically by Axios interceptors. The refresh flow:

1. Request fails with 401 Unauthorized
2. Interceptor attempts to refresh token
3. If successful, retries original request with new token
4. If refresh fails, clears tokens and redirects to login

No code changes needed - works automatically for all authenticated requests.

## Backward Compatibility

The migration maintains backward compatibility:

- All service function signatures remain unchanged
- Response objects are compatible with existing code
- Error handling works the same way
- Token management unchanged

## Performance Considerations

### Parallel Execution

- **Concurrent execution**: All API calls execute in parallel by default
- **Performance**: Faster response times for multiple requests
- **Consideration**: May increase server load, but improves user experience
- **Control**: Use `executeWithConcurrencyLimit()` for controlled concurrency

### Cache Impact

- **Cache hits**: Instant response from cache (no network call)
- **Cache misses**: Normal network request + cache storage
- **Storage**: In-memory primary, localStorage fallback
- **TTL**: Default 5 minutes, configurable per request

## Debugging

### Enable Cache Logging

```typescript
import { getCacheStats } from '../utils/apiCache';

// Monitor cache in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('Cache stats:', getCacheStats());
  }, 5000);
}
```

## Troubleshooting

### Cache Not Working

- Check cache stats: `getCacheStats()`
- Verify `useCache: true` (default for GET requests)
- Check TTL hasn't expired
- Verify localStorage is available

### Token Refresh Issues

- Check token storage: `getToken()`, `getRefreshToken()`
- Verify refresh endpoint is accessible
- Check network connectivity
- Review browser console for errors

## Migration Checklist

- [x] Create Axios client with interceptors
- [x] Implement API cache
- [x] Implement API storage with fallback chain
- [x] Create Axios request wrapper
- [x] Create sequential group utilities
- [x] Remove request queue system
- [x] Enable parallel API execution
- [x] Migrate api.ts and health.ts
- [x] Migrate auth.ts
- [x] Migrate user.ts, contact.ts, company.ts
- [x] Migrate apollo.ts, analytics.ts, aiChat.ts, import.ts
- [x] Update all authenticatedFetch calls
- [x] Update all request() calls
- [x] Replace body with data
- [x] Add queue and cache options
- [x] Test authentication flow
- [x] Test token refresh
- [x] Verify error handling
- [x] Create documentation

## Future Enhancements

Potential improvements:

1. **Request deduplication**: Prevent duplicate requests
2. **Request cancellation**: Cancel pending requests
3. **Retry logic**: Automatic retry for failed requests
4. **Cache strategies**: Different cache strategies per endpoint
5. **Offline support**: Store requests when offline, execute when online
6. **Request prioritization**: Optional priority system for critical requests

