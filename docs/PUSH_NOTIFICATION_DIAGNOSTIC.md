# Push Notification Diagnostic Feature

## Overview

This feature adds a comprehensive diagnostic tool for debugging push notification issues. It helps identify common problems and provides actionable steps to resolve them.

## Components

### 1. PushDiagnostic Component (`src/components/PushDiagnostic.tsx`)

Main diagnostic component that displays real-time status of:

- **Browser Support**: Checks if the browser supports Notification and ServiceWorker APIs
- **Permission Status**: Shows current notification permission (default/granted/denied)
- **Service Worker**: Indicates if a service worker is registered
- **VAPID Key**: Verifies that the VAPID public key is configured
- **Subscription Status**: Shows if the user is subscribed to push notifications
- **Endpoint**: Displays the push subscription endpoint (truncated for security)

#### Features:
- Color-coded status indicators (green/amber/red)
- Detailed error messages with browser-specific instructions
- Action buttons:
  - **Subscribe**: Requests permission and subscribes to push notifications
  - **Unsubscribe**: Removes push subscription
  - **Send Test Push**: Triggers a test notification
- Console logging with `[Push]` prefix for debugging
- Real-time status refresh

### 2. PushDiagnostic Page (`src/pages/PushDiagnostic.tsx`)

Wrapper page that:
- Requires authentication
- Displays the PushDiagnostic component
- Uses consistent layout with Header

### 3. Edge Function (`supabase/functions/send-test-push/index.ts`)

Server-side function that:
- Authenticates the requesting user
- Retrieves their push subscriptions from the database
- Sends a test notification using the Web Push Protocol
- Returns detailed results (success/failure for each subscription)

## Integration

### Dashboard Links

The diagnostic tool is accessible from:
1. **Fisherman Dashboard** (`/dashboard/pecheur`) - Button with Activity icon
2. **Admin Dashboard** (`/dashboard/admin`) - Button with Activity icon

### Routing

- URL: `/push-diagnostic`
- Lazy-loaded route for optimal performance
- Requires authentication (redirects to `/auth` if not logged in)

## Usage

### For End Users

1. Navigate to the diagnostic page from your dashboard
2. Review the status indicators:
   - ✓ Green = Working correctly
   - ⚠ Amber = Warning or not configured
   - ✗ Red = Error or blocked
3. Follow the action buttons:
   - If not subscribed: Click "S'abonner aux notifications"
   - To test: Click "Envoyer un push de test"
   - To disable: Click "Se désabonner"

### For Developers

The component logs detailed information to the console with the `[Push]` prefix:

```javascript
[Push] Starting diagnostics check...
[Push] Browser support: true
[Push] Permission status: granted
[Push] VAPID key present: true
[Push] Service Worker registered: true
[Push] Subscription: Active
[Push] Endpoint: https://fcm.googleapis.com/...
```

## Common Issues and Solutions

### 1. "Votre navigateur ne supporte pas les notifications push"
- **Cause**: Browser doesn't support Notification or ServiceWorker APIs
- **Solution**: Use a modern browser (Chrome, Firefox, Edge, Safari)

### 2. "Vous avez bloqué les notifications"
- **Cause**: User previously denied notification permission
- **Solution**: 
  - Chrome: Settings → Privacy and security → Site Settings → Notifications
  - Firefox: Settings → Privacy & Security → Permissions → Notifications
  - Safari: Preferences → Websites → Notifications

### 3. "Configuration serveur incomplète"
- **Cause**: VAPID_PUBLIC_KEY environment variable is not set
- **Solution**: Set `VITE_VAPID_PUBLIC_KEY` in `.env` file

### 4. "Service Worker non enregistré"
- **Cause**: Service worker failed to register
- **Solution**: 
  - Check if `/sw.js` exists in the public directory
  - Verify no console errors related to service worker
  - Try refreshing the page

## Technical Details

### Environment Variables

- `VITE_VAPID_PUBLIC_KEY`: Public VAPID key for push notifications (required)
- `VAPID_PRIVATE_KEY`: Private VAPID key (server-side, required for edge function)

### Database Schema

The component interacts with the `push_subscriptions` table:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

- `supabase.functions.invoke('send-test-push')`: Sends test push notification

### Browser Compatibility

- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ iOS 16.4+, macOS 13+
- Opera: ✓ Full support

## Security Considerations

1. **Endpoint Truncation**: Subscription endpoints are truncated in the UI to prevent exposure
2. **Authentication Required**: All push operations require authentication
3. **User Consent**: Permission is explicitly requested before subscribing
4. **VAPID Keys**: Public key is client-side, private key is server-side only

## Future Enhancements

Potential improvements:
- Add notification history view
- Show notification delivery statistics
- Add custom notification test messages
- Export diagnostic report
- Batch notification testing
- Push notification analytics

## Related Files

- `src/components/PushNotificationToggle.tsx` - Toggle component (reused logic)
- `supabase/functions/send-drop-notification/index.ts` - Production push function
- `public/sw.js` - Service worker file

## Support

For issues or questions:
- Check console logs with `[Push]` prefix
- Use the diagnostic tool to identify specific problems
- Contact support with diagnostic results
