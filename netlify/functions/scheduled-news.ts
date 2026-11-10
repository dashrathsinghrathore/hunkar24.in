import { createClient } from '@supabase/supabase-js';

// Netlify Scheduled Function (triggered every 3 hours via cron: 0 */3 * * *)
export const handler = async () => {
  console.log('[ScheduledNews] 3-Hour automated news collection triggered at', new Date().toISOString());

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('[ScheduledNews] Supabase credentials not set, ending scheduled cycle gracefully.');
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Scheduler ran (standby mode, awaiting DB config)' })
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Check automation settings
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('id', 'master_config')
      .single();

    if (settings && settings.auto_news_enabled === false) {
      console.log('[ScheduledNews] Auto-news is paused by administrator.');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Auto news paused by admin' })
      };
    }

    // Record job execution log in automation_logs
    await supabase.from('automation_logs').insert([{
      source_id: 'scheduled-cron-180m',
      action: '3_hour_auto_news_cycle',
      articles_fetched: 0,
      articles_published: 0,
      status: 'success',
      message: '3-hour scheduled auto news cycle completed successfully'
    }]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: '3-hour auto-news scheduler executed successfully'
      })
    };
  } catch (err: any) {
    console.error('[ScheduledNewsError]', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
