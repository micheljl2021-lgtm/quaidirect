/**
 * Centralized CORS configuration for all Edge Functions
 * Use this helper to ensure consistent CORS handling across the project
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle CORS preflight requests
 * @param req - The incoming request
 * @returns Response for OPTIONS requests, null otherwise
 */
export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
};

/**
 * Create a JSON response with CORS headers
 * @param data - The response data
 * @param status - HTTP status code (default 200)
 * @returns Response with JSON content and CORS headers
 */
export const jsonResponse = (data: unknown, status = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

/**
 * Create an error response with CORS headers
 * @param message - Error message
 * @param status - HTTP status code (default 400)
 * @returns Response with error JSON and CORS headers
 */
export const errorResponse = (message: string, status = 400): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};
