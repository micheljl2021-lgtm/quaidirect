import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

interface FCMMessage {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

interface SendNotificationRequest {
  userIds?: string[];
  tokens?: string[];
  message: FCMMessage;
}

// Get OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour

  // Create JWT header and payload
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  // Base64url encode
  const base64url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Sign with private key using Web Crypto API
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send FCM notification to a single token - returns userId if available
async function sendToToken(
  token: string,
  userId: string | null,
  message: FCMMessage,
  accessToken: string,
  projectId: string
): Promise<{ success: boolean; userId: string | null; error?: string }> {
  try {
    const fcmPayload = {
      message: {
        token: token,
        notification: {
          title: message.title,
          body: message.body,
        },
        webpush: {
          notification: {
            icon: message.icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
          },
          fcm_options: {
            link: message.data?.url || '/arrivages',
          },
        },
        data: message.data || {},
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FCM send failed for token ${token.substring(0, 20)}...:`, errorText);
      return { success: false, userId, error: errorText };
    }

    console.log(`FCM notification sent to token ${token.substring(0, 20)}...`);
    return { success: true, userId };
  } catch (error) {
    console.error('FCM send error:', error);
    return { success: false, userId, error: String(error) };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Validate internal call or auth
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    
    const hasValidInternalSecret = expectedSecret && internalSecret === expectedSecret;
    const hasAuthHeader = authHeader.startsWith('Bearer ');
    
    if (!hasValidInternalSecret && !hasAuthHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: SendNotificationRequest = await req.json();
    const { userIds, tokens: directTokens, message } = body;

    if (!message?.title || !message?.body) {
      return new Response(JSON.stringify({ error: 'message.title and message.body required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Firebase service account
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      return new Response(JSON.stringify({ error: 'Firebase service account not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid Firebase service account JSON' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const projectId = serviceAccount.project_id;
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Firebase project_id not found in service account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token
    console.log('Getting Firebase access token...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained');

    // Track tokens with their userIds for fallback reporting
    let tokenUserMap: { token: string; userId: string | null }[] = [];
    
    // If direct tokens provided (no userId mapping)
    if (directTokens && directTokens.length > 0) {
      tokenUserMap = directTokens.map(token => ({ token, userId: null }));
    }

    // If userIds provided, fetch their FCM tokens from database
    const usersWithoutTokens: string[] = [];
    
    if (userIds && userIds.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: subscriptions, error } = await supabase
        .from('fcm_tokens')
        .select('token, user_id')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching FCM tokens:', error);
      } else if (subscriptions) {
        // Map tokens to their userIds
        for (const sub of subscriptions) {
          tokenUserMap.push({ token: sub.token, userId: sub.user_id });
        }
        
        // Find users without any token
        const usersWithTokens = new Set(subscriptions.map(s => s.user_id));
        for (const userId of userIds) {
          if (!usersWithTokens.has(userId)) {
            usersWithoutTokens.push(userId);
          }
        }
      } else {
        // No tokens at all, all users need fallback
        usersWithoutTokens.push(...userIds);
      }
    }

    // Remove duplicate tokens
    const seenTokens = new Set<string>();
    tokenUserMap = tokenUserMap.filter(({ token }) => {
      if (seenTokens.has(token)) return false;
      seenTokens.add(token);
      return true;
    });

    console.log(`Sending to ${tokenUserMap.length} tokens, ${usersWithoutTokens.length} users without tokens`);

    if (tokenUserMap.length === 0 && usersWithoutTokens.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No tokens to send to',
        sent: 0,
        failed: 0,
        failedUserIds: [],
        usersWithoutTokens: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notifications
    const results = await Promise.all(
      tokenUserMap.map(({ token, userId }) => 
        sendToToken(token, userId, message, accessToken, projectId)
      )
    );

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Collect userIds that failed to receive push notification
    const failedUserIds = results
      .filter(r => !r.success && r.userId)
      .map(r => r.userId as string);

    console.log(`FCM notifications: ${sent} sent, ${failed} failed`);
    console.log(`Users needing fallback: ${failedUserIds.length} failed + ${usersWithoutTokens.length} without tokens`);

    return new Response(JSON.stringify({ 
      message: 'Notifications processed',
      sent,
      failed,
      failedUserIds,
      usersWithoutTokens,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-fcm-notification:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
