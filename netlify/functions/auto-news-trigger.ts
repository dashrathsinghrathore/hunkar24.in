import { handler as cronHandler } from './auto-news-cron';

/**
 * Netlify HTTP endpoint for /api/auto-news-trigger and /api/news-engine/fetch
 * 
 * Unlike scheduled cron functions which return 403 on direct HTTP access,
 * this function accepts direct HTTP GET and POST requests from the client or admin panel.
 */
export const handler = async (event: any, context: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: 'OK'
    };
  }

  try {
    const result = await cronHandler(event);
    return {
      ...result,
      headers: {
        ...corsHeaders,
        ...(result.headers || {}),
        'Content-Type': 'application/json'
      }
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: err.message || 'Auto news trigger error'
      })
    };
  }
};
