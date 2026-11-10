/**
 * Gemini AI News Transformation Engine for Hunkar 24 (हुंकार 24)
 * 
 * Takes raw news headlines and snippets from multiple news APIs (Currents, Mediastack,
 * GNews, NewsData, NewsAPI, BBC Hindi, Google News) and generates professional,
 * grammatically flawless Hindi news articles with unique headlines and structured summaries.
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let aiInstance: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    aiInstance = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.warn('[GeminiTransformer] Initialization notice:', err);
  }
}

export interface TransformedHindiArticle {
  headline: string;
  summary: string;
  content: string;
  category: string;
  district?: string;
  isBreaking: boolean;
  tags: string[];
}

/**
 * Transforms raw news data into high-grade Hindi journalistic copy using Gemini 3.8 Flash
 */
export async function transformRawNewsWithGemini(
  rawTitle: string,
  rawDescription: string,
  sourceName = 'हुंकार 24 डिजिटल डेस्क'
): Promise<TransformedHindiArticle> {
  const cleanTitle = rawTitle.replace(/\s+-\s+[^-]+$/, '').trim();
  const cleanDesc = rawDescription.replace(/<[^>]*>/g, '').trim();

  // Try Gemini AI generation
  if (aiInstance) {
    try {
      const prompt = `You are a Senior Editor and Fact-Checking Journalist for 'HUNKAR 24' (हुंकार 24), Rajasthan's leading digital news network.
Transform the following raw news story into an authentic, natural, professional Hindi news report.

NON-NEGOTIABLE JOURNALISTIC RULES:
1. STRICT NEWS-RELATED CONTENT ONLY: Every word must directly relate to this specific news event.
2. COMPLETELY PROHIBITED FILLER — NEVER USE THESE PHRASES:
   - "संबंधित विभागों में व्यापक हलचल देखी जा रही है"
   - "प्रशासन स्थिति पर पैनी नज़र रख रहा है"
   - "आने वाले समय में सकारात्मक परिणाम सामने आएंगे"
   - "आम जनता को किसी भी प्रकार की भ्रामक सूचनाओं से बचने का आग्रह किया गया है"
   - "हुंकार 24 की टीम लगातार नज़र बनाए रखेगी"
   - "यह घटनाक्रम बेहद महत्वपूर्ण माना जा रहा है"
   - "इस मामले में आगे क्या होगा, यह देखना महत्वपूर्ण होगा"
3. DO NOT INVENT FACTS: Never invent quotes, reactions, statistics, expert opinions, official statements, or future consequences.
4. NATURAL ARTICLE LENGTH: Length depends ONLY on available facts. If the source provides only 2-3 facts, write a concise 2-paragraph report. Do not force 5 paragraphs or inject filler.
5. SUBJECT ACCURACY:
   - Panchayat election: Focus on voting dates, phases, candidates, polling arrangements.
   - Education: Focus on exams, dates, syllabus, official notices.
   - Agriculture: Focus on mandi prices, crop arrivals, quality, market conditions.
   - Politics: Focus on statements, allegations with source attribution, election developments.
   - Schemes: Focus on eligibility, benefits, application procedures, official orders.
   - Crime: Focus strictly on confirmed police details.
   - Viral news: Clearly distinguish verified facts from social media claims.

Format JSON Response:
{
  "headline": "Punchy, factual Hindi headline (12-18 words)",
  "summary": "Crisp 2-sentence summary of the actual facts",
  "content": "Professional Hindi news report (pure facts, Markdown headings only if logical)",
  "category": "agriculture" | "jobs" | "schemes" | "rajasthan" | "national" | "education" | "sports" | "politics" | "crime" | "weather",
  "district": "jaipur" | "sikar" | "churu" | "bikaner" | "jodhpur" | "kota" | "udaipur" | "barmer" | "nagaur" | "ajmer" | null,
  "isBreaking": boolean,
  "tags": ["tag1", "tag2", "tag3"],
  "imageDescription": "Detailed visual description of a realistic photo or symbolic illustration that directly represents this specific news subject"
}

Raw News Item:
Title: ${cleanTitle}
Description: ${cleanDesc || cleanTitle}
Source: ${sourceName}

Respond ONLY with valid JSON.`;

      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.headline && parsed.content) {
          return {
            headline: parsed.headline.trim(),
            summary: parsed.summary?.trim() || cleanTitle,
            content: parsed.content.trim(),
            category: parsed.category || 'rajasthan',
            district: parsed.district || undefined,
            isBreaking: Boolean(parsed.isBreaking),
            tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : ['हुंकार 24', 'ताज़ा खबर']
          };
        }
      }
    } catch (err: any) {
      console.warn('[GeminiTransformer] Gemini processing error, utilizing journalistic fallback:', err.message);
    }
  }

  // Resilient journalistic fallback if Gemini is offline or rate-limited
  return fallbackJournalisticCopy(cleanTitle, cleanDesc, sourceName);
}

/**
 * Resilient deterministic journalistic copy generator — strictly fact-based, zero filler
 */
function fallbackJournalisticCopy(cleanTitle: string, cleanDesc: string, sourceName: string): TransformedHindiArticle {
  const lower = `${cleanTitle} ${cleanDesc}`.toLowerCase();
  let district: string | undefined = undefined;

  if (lower.includes('जयपुर') || lower.includes('jaipur')) district = 'jaipur';
  else if (lower.includes('सीकर') || lower.includes('sikar')) district = 'sikar';
  else if (lower.includes('चूरू') || lower.includes('churu')) district = 'churu';
  else if (lower.includes('बीकानेर') || lower.includes('bikaner')) district = 'bikaner';
  else if (lower.includes('जोधपुर') || lower.includes('jodhpur')) district = 'jodhpur';
  else if (lower.includes('कोटा') || lower.includes('kota')) district = 'kota';
  else if (lower.includes('उदयपुर') || lower.includes('udaipur')) district = 'udaipur';
  else if (lower.includes('बाड़मेर') || lower.includes('barmer')) district = 'barmer';
  else if (lower.includes('नागौर') || lower.includes('nagaur')) district = 'nagaur';
  else if (lower.includes('अजमेर') || lower.includes('ajmer')) district = 'ajmer';

  let category = 'rajasthan';
  if (lower.includes('किसान') || lower.includes('कृषि') || lower.includes('मंडी') || lower.includes('सरसों') || lower.includes('फसल') || lower.includes('ग्वार') || lower.includes('चना') || lower.includes('मूंगफली')) {
    category = 'agriculture';
  } else if (lower.includes('भर्ती') || lower.includes('नौकरी') || lower.includes('rpsc') || lower.includes('reet') || lower.includes('कांस्टेबल') || lower.includes('पद')) {
    category = 'jobs';
  } else if (lower.includes('योजना') || lower.includes('सब्सिडी') || lower.includes('अनुदान') || lower.includes('पेंशन') || lower.includes('पीएम किसान') || lower.includes('कुसुम') || lower.includes('आधार')) {
    category = 'schemes';
  } else if (lower.includes('शिक्षा') || lower.includes('स्कूल') || lower.includes('कॉलेज') || lower.includes('परीक्षा') || lower.includes('बोर्ड')) {
    category = 'education';
  } else if (lower.includes('चुनाव') || lower.includes('सरपंच') || lower.includes('पार्टी') || lower.includes('कांग्रेस') || lower.includes('भाजपा') || lower.includes('बेनीवाल')) {
    category = 'politics';
  } else if (lower.includes('भारत') || lower.includes('प्रधानमंत्री') || lower.includes('सुप्रीम कोर्ट') || lower.includes('संसद') || lower.includes('रेलवे')) {
    category = 'national';
  }

  const isBreaking = category === 'agriculture' || category === 'jobs';
  const summary = cleanDesc.length > 20 ? cleanDesc : `${cleanTitle}। इस विषय पर प्राप्त प्राथमिक सूचनाएं।`;

  // Clean, factual content without forced fake paragraphs
  const content = `${cleanTitle}\n\n${summary}`;

  return {
    headline: cleanTitle,
    summary: summary.slice(0, 220),
    content,
    category,
    district,
    isBreaking,
    tags: ['हुंकार 24', category, district || 'राजस्थान'].filter(Boolean) as string[]
  };
}
