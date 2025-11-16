# Backend Connectivity Requirements

## Overview

The NexusCRM application requires connectivity to a backend API server for all authenticated operations. This document outlines the connectivity requirements, configuration, and troubleshooting steps.

## API Configuration

### Base URL

The backend API base URL is configured via the `NEXT_PUBLIC_API_BASE_URL` environment variable.

**Default**: `http://54.87.173.234`

**Configuration Location**: `services/api.ts`

```typescript
const getApiBaseUrl = (): string => {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://54.87.173.234';
  return backendUrl.replace(/\/$/, '');
};
```

### Environment Variable Setup

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://54.87.173.234
```

Or set it in your deployment environment.

## Connectivity Requirements

### Network Requirements

1. **CORS Configuration**: The backend must support CORS (Cross-Origin Resource Sharing) for browser requests
   - All API endpoints must include appropriate CORS headers
   - Credentials should be allowed for authenticated requests

2. **Network Accessibility**: 
   - The backend server must be accessible from the client's network
   - Firewall rules must allow HTTP/HTTPS traffic on the configured port
   - For production, use HTTPS instead of HTTP

3. **Response Time**: 
   - Default timeout: 30 seconds per request
   - Configured in `services/auth.ts` (authenticatedFetch) and `utils/request.ts`
   - Retry logic: 1-2 retries for network errors

### API Endpoints

The application uses the following API endpoints:

#### Public Endpoints (No Authentication Required)
- `GET /` - API info
- `POST /api/v2/auth/login/` - User login
- `POST /api/v2/auth/register/` - User registration
- `POST /api/v2/auth/refresh/` - Token refresh
- `GET /health/` - Health check

#### Authenticated Endpoints (Require Bearer Token)
- `GET /api/v2/users/profile/` - User profile
- `GET /api/v1/contacts/` - List contacts
- `GET /api/v1/contacts/count/` - Contact count
- `GET /api/v1/contacts/fields/{field}/distinct/` - Distinct field values
- `GET /api/v2/ai-chats/` - AI chat sessions
- And more...

## Error Handling

### Timeout Errors

The application handles timeout errors gracefully:

1. **Detection**: Timeout errors are detected in `utils/errorHandler.ts`
   - Error messages containing "timeout" or "Timeout" are identified
   - Marked with `isTimeoutError: true`

2. **User-Friendly Messages**: 
   - Timeout errors display: "Request timed out. Please try again."
   - Network errors display: "Unable to connect to the server..."

3. **Retry Logic**:
   - Automatic retry on network/timeout errors (1-2 retries)
   - Exponential backoff between retries
   - Configured in `utils/request.ts`

### Common Error Scenarios

#### 1. Backend Server Unreachable
**Symptoms**: 
- Console errors: "Request timed out. Please try again."
- Network errors in browser console

**Solutions**:
- Verify backend server is running
- Check network connectivity
- Verify firewall rules
- Check if backend URL is correct

#### 2. CORS Errors
**Symptoms**:
- Browser console shows CORS policy errors
- Requests fail with CORS-related messages

**Solutions**:
- Configure backend to allow CORS from frontend origin
- Add appropriate CORS headers in backend
- For development, consider using a proxy

#### 3. Authentication Timeouts
**Symptoms**:
- Login requests timing out
- Session refresh failures

**Solutions**:
- Verify backend authentication endpoints are accessible
- Check backend authentication service health
- Verify token refresh endpoint is working

## Health Check

The application includes a health check utility in `services/health.ts`:

```typescript
import { checkHealth } from '@/services/health';

const healthStatus = await checkHealth();
if (healthStatus.isHealthy) {
  console.log('Backend is healthy');
} else {
  console.error('Backend health check failed:', healthStatus.error);
}
```

## Troubleshooting Steps

### 1. Verify Backend Availability

```bash
# Test backend connectivity
curl http://54.87.173.234/health/

# Or test from browser
# Open: http://54.87.173.234/health/
```

### 2. Check Environment Variables

```bash
# Verify environment variable is set
echo $NEXT_PUBLIC_API_BASE_URL

# Or check in browser console
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
```

### 3. Test API Endpoints

Use browser DevTools Network tab to:
- Monitor API requests
- Check response status codes
- Verify CORS headers
- Check request/response timing

### 4. Review Error Logs

Check browser console for:
- Timeout errors
- Network errors
- CORS errors
- Authentication errors

## Best Practices

1. **Production Setup**:
   - Use HTTPS for all API communication
   - Implement proper CORS configuration
   - Use environment-specific API URLs
   - Monitor API response times

2. **Development Setup**:
   - Use local backend when possible
   - Configure CORS for localhost
   - Use proxy for development if needed

3. **Error Handling**:
   - Always handle timeout errors gracefully
   - Provide user-friendly error messages
   - Log errors for debugging
   - Implement retry logic for transient errors

## Related Files

- `services/api.ts` - API base URL configuration
- `services/auth.ts` - Authentication and authenticatedFetch
- `utils/request.ts` - Request wrapper with timeout/retry
- `utils/errorHandler.ts` - Error parsing and formatting
- `services/health.ts` - Health check utility

## Notes

- Timeout errors in the error log are primarily infrastructure/network issues
- The application's error handling is well-implemented with proper logging
- 30-second timeout is reasonable for most API operations
- Automatic retry logic helps with transient network issues

