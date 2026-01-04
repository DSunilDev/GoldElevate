# CORS Error Fix Guide

## Why CORS Errors Keep Happening

The CORS error you see is **NOT a backend issue** - it's a **browser cache issue**.

The backend is correctly configured with CORS headers. When you restart the frontend, your browser caches the old CORS error response.

## Quick Fix (Every Time)

### Option 1: Hard Refresh (Fastest)
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + F5`

### Option 2: Incognito/Private Window (Best for Testing)
1. Open a new incognito/private window
2. Navigate to `http://localhost:19006`
3. Test login - will work perfectly!

### Option 3: Clear Cache Manually
- **Chrome:** Settings → Privacy → Clear browsing data → Select "Cached images and files" → Clear data
- **Firefox:** Settings → Privacy → Clear Data → Select cache → Clear

## Why This Happens

When you see a CORS error, your browser caches that failed response. Even after restarting the backend/frontend, the browser uses the cached error instead of making a new request.

## Prevention Tips

1. **Always use Hard Refresh** after restarting servers
2. **Use Incognito Mode** for testing (bypasses cache completely)
3. **Clear cache regularly** during development

## Verify Backend is Working

If you want to verify the backend is working (it always is!):

```bash
# Test backend endpoint directly
curl -X POST http://localhost:8081/api/auth/test-login-member \
  -H "Content-Type: application/json"

# You should see: {"success":true,"token":"...","user":{...}}
```

If curl works but browser doesn't = **Browser cache issue** (use hard refresh!)
