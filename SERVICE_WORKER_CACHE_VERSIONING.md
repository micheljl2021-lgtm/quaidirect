# Service Worker Cache Versioning

## Overview
This document describes the cache versioning implementation for the QuaiDirect service worker to prevent issues with mixed old and new files after deployments.

## Problem Statement
Previously, the service worker used fixed cache names (`quaidirect-v2`, `quaidirect-runtime`, etc.) which caused:
- Mixed old and new files after deployments
- Sporadic 404 errors that disappeared after refresh
- Route mismatches between old cached JS and new routes
- Poor user experience during updates

## Solution Implemented

### 1. Dynamic Cache Versioning
Cache names now include a timestamp that's automatically injected at build time:
```javascript
const CACHE_VERSION = '2025-12-13T02-44-28'; // Auto-generated during build
const CACHE_NAME = `quaidirect-v2-${CACHE_VERSION}`;
const RUNTIME_CACHE = `quaidirect-runtime-${CACHE_VERSION}`;
const STATIC_CACHE = `quaidirect-static-${CACHE_VERSION}`;
const API_CACHE = `quaidirect-api-${CACHE_VERSION}`;
```

### 2. Automatic Old Cache Cleanup
The service worker's activation event now:
- Identifies all cache names that don't match the current version
- Deletes old caches to prevent mixed file states
- Logs cleanup operations for debugging
- Takes immediate control of all pages

```javascript
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker activated with version:', CACHE_VERSION);
      return self.clients.claim();
    })
  );
});
```

### 3. Build-Time Version Injection
A Vite plugin in `vite.config.ts` automatically replaces `__CACHE_VERSION__` with a timestamp:
```typescript
function injectServiceWorkerVersion() {
  return {
    name: 'inject-sw-version',
    apply: 'build',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        let content = fs.readFileSync(swPath, 'utf-8');
        content = content.replace(/__CACHE_VERSION__/g, timestamp);
        fs.writeFileSync(swPath, content);
        console.log(`Service Worker cache version set to: ${timestamp}`);
      }
    }
  };
}
```

### 4. Automatic Update Mechanism
The service worker registration in `index.html` now:
- Checks for updates every hour
- Automatically activates new service workers
- Reloads the page when a new version takes control
- Prevents multiple reloads with a flag

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Handle updates automatically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      });
    
    // Reload page when new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
```

### 5. Enhanced Message Handling
The service worker now supports additional message types:
- `SKIP_WAITING`: Force immediate activation
- `CLEAR_CACHE`: Clear a specific cache
- `GET_VERSION`: Query the current cache version
- `FORCE_UPDATE`: Clear all caches and force update

## Benefits

1. **No More Mixed Files**: Each deployment gets unique cache names
2. **Clean Updates**: Old caches are automatically removed
3. **Better UX**: Users get the latest version without manual cache clearing
4. **Automatic Recovery**: Service worker updates are detected and applied automatically
5. **Debugging Support**: Version logging helps track deployments

## Deployment Process

1. Run `npm run build` - this automatically:
   - Generates a unique timestamp
   - Injects it into the service worker
   - Builds all assets with cache busting

2. Deploy the `dist` folder to your hosting provider

3. Users will:
   - Receive the new service worker
   - Have old caches cleaned up automatically
   - Be on the latest version within an hour (or on next visit)

## Verification

After deployment, check the browser console for:
```
SW registered: ServiceWorkerRegistration {...}
Service Worker activated with version: 2025-12-13T02-44-28
Deleting old cache: quaidirect-v2-2025-12-12T01-30-15
Deleting old cache: quaidirect-runtime-2025-12-12T01-30-15
...
```

## Troubleshooting

### Issue: Service worker not updating
**Solution**: Check for update manually:
```javascript
navigator.serviceWorker.getRegistration().then(reg => reg.update());
```

### Issue: Old caches not being deleted
**Solution**: Force update:
```javascript
navigator.serviceWorker.controller.postMessage({ type: 'FORCE_UPDATE' });
```

### Issue: Need to check current version
**Solution**: Query the version:
```javascript
const channel = new MessageChannel();
navigator.serviceWorker.controller.postMessage(
  { type: 'GET_VERSION' },
  [channel.port2]
);
channel.port1.onmessage = (event) => {
  console.log('Current SW version:', event.data.version);
};
```

## Files Modified

1. `/public/sw.js` - Updated cache names and activation logic
2. `/vite.config.ts` - Added version injection plugin
3. `/index.html` - Enhanced service worker registration

## Testing

To test the implementation:

1. Build and deploy version 1
2. Visit the site and verify cache names in DevTools > Application > Cache Storage
3. Build and deploy version 2
4. Revisit the site or wait for automatic update
5. Verify old caches are deleted and new version is active
6. Check console logs for version messages

## Future Enhancements

Potential improvements:
- Add user notification for updates (optional toast)
- Implement more granular cache control
- Add metrics for cache hit rates
- Implement background sync for offline operations
