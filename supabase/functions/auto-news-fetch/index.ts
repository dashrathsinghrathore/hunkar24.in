// Supabase Edge Function: auto-news-fetch
// Scheduled 30-minute background news collection & auto-publishing
// Deploy: supabase functions deploy auto-news-fetch

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sensitive topics routed to editorial review (Requirement 4)
const SENSITIVE_KEYWORDS = [
  'दुष्कर्म', 'हत्या', 'विवाद', 'दंगा', 'सांप्रदायिक', 'भ्रष्टाचार', 'धर्मांतरण',
  'मानहानि', 'आरोप', 'घोटाला', 'चमत्कारी इलाज', 'चुनाव धांधली', 'साजिश',
  'suicide', 'rape', 'murder', 'riot', 'communal', 'terror', 'bomb', 'bribe',
  'defamation', 'allegation', 'scam', 'election fraud', 'conspiracy', 'unverified'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const newsDataKey = Deno.env.get('NEWSDATA_KEY') || 'pub_eb74f86ee8034c1aa709628311675476';
    const gnewsKey = Deno.env.get('GNEWS_KEY') || 'f545e6f443b432ec4297d0aef0f930e6';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalFetched = 0;
    let autoPublishedCount = 0;
    const errors: string[] = [];

    // 1. Fetch NewsData.io (Hindi News)
    try {
      const newsDataRes = await fetch(
        `https://newsdata.io/api/1/latest?apikey=${newsDataKey}&country=in&language=hi&size=10`
      );
      if (newsDataRes.ok) {
        const data = await newsDataRes.json();
        const articles = data.results || [];
        totalFetched += articles.length;

        for (const art of articles) {
          const title = art.title || '';
          const desc = art.description || '';
          const fullText = `${title} ${desc}`.toLowerCase();

          // Check sensitive flags
          const isSensitive = SENSITIVE_KEYWORDS.some(kw => fullText.includes(kw));
          const publishStatus = isSensitive ? 'pending_review' : 'approved';

          if (publishStatus === 'approved') autoPublishedCount++;

          await supabase.from('news_imported_articles').upsert(
            {
              canonical_url: art.link,
              original_title: title,
              title_hindi: title,
              summary_hindi: desc.slice(0, 300) || title,
              category: 'rajasthan',
              primary_source_name: art.source_id || 'NewsData Hindi',
              primary_source_url: art.link,
              image_url: art.image_url || null,
              published_at: art.pubDate ? new Date(art.pubDate).toISOString() : new Date().toISOString(),
              status: publishStatus,
              verification_level: isSensitive ? 'sensitive_topic' : 'single_source'
            },
            { onConflict: 'canonical_url' }
          );
        }
      }
    } catch (e: any) {
      errors.push(`NewsData error: ${e.message}`);
    }

    // 2. Fetch GNews (Attributed headlines)
    try {
      const gnewsRes = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=general&lang=hi&country=in&max=10&apikey=${gnewsKey}`
      );
      if (gnewsRes.ok) {
        const data = await gnewsRes.json();
        const articles = data.articles || [];
        totalFetched += articles.length;

        for (const art of articles) {
          const title = art.title || '';
          const desc = art.description || '';
          const fullText = `${title} ${desc}`.toLowerCase();
          const isSensitive = SENSITIVE_KEYWORDS.some(kw => fullText.includes(kw));
          const publishStatus = isSensitive ? 'pending_review' : 'approved';

          if (publishStatus === 'approved') autoPublishedCount++;

          await supabase.from('news_imported_articles').upsert(
            {
              canonical_url: art.url,
              original_title: title,
              title_hindi: title,
              summary_hindi: desc.slice(0, 300) || title,
              category: 'national',
              primary_source_name: art.source?.name || 'GNews Source',
              primary_source_url: art.url,
              image_url: art.image || null,
              published_at: art.publishedAt || new Date().toISOString(),
              status: publishStatus,
              verification_level: isSensitive ? 'sensitive_topic' : 'single_source'
            },
            { onConflict: 'canonical_url' }
          );
        }
      }
    } catch (e: any) {
      errors.push(`GNews error: ${e.message}`);
    }

    // 3. Record fetch job execution log
    await supabase.from('news_fetch_jobs').insert({
      job_type: 'cron_edge_function_30min',
      articles_fetched: totalFetched,
      articles_imported: totalFetched,
      status: errors.length > 0 ? 'completed_with_warnings' : 'success',
      completed_at: new Date().toISOString(),
      error_log: errors.join('; ')
    });

    return new Response(
      JSON.stringify({
        success: true,
        totalFetched,
        autoPublishedCount,
        errors,
        schedule: 'every_30_minutes',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
