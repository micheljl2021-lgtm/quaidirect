/**
 * Centralized CORS configuration for all Edge Functions
 * Use this helper to ensure consistent CORS handling across the project
 * 
 * SECURITY: Restricted to quaidirect.fr domains only
 */

// Allowed origins for CORS - production domains only
const ALLOWED_ORIGINS = [
  'https://quaidirect.fr',
  'https://www.quaidirect.fr',
  'https://quaidirect.lovable.app', // Development/preview
];

/**
 * Get CORS headers with origin validation
 * @param origin - The request origin
 * @returns CORS headers with validated origin or default
 */
export const getCorsHeaders = (origin?: string | null): Record<string, string> => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : 'https://quaidirect.fr';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
};

// Default restrictive CORS headers (for backward compatibility)
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle CORS preflight requests with origin validation
 * @param req - The incoming request
 * @returns Response for OPTIONS requests, null otherwise
 */
export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    return new Response(null, { headers: getCorsHeaders(origin) });
  }
  return null;
};

/**
 * Create a JSON response with CORS headers
 * @param data - The response data
 * @param status - HTTP status code (default 200)
 * @param origin - The request origin for CORS
 * @returns Response with JSON content and CORS headers
 */
export const jsonResponse = (data: unknown, status = 200, origin?: string | null): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });
};

/**
 * Create an error response with CORS headers
 * @param message - Error message
 * @param status - HTTP status code (default 400)
 * @param origin - The request origin for CORS
 * @returns Response with error JSON and CORS headers
 */
export const errorResponse = (message: string, status = 400, origin?: string | null): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });
};
