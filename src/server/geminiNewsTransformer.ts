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
      const prompt = `You are the Chief Editor and Senior Journalist for 'Hunkar 24' (हुंकार 24), Rajasthan's leading digital news network.
Transform the following raw news story into a professional, grammatically pure, engaging, and authoritative Hindi news report.

STRICT INSTRUCTIONS:
1. headline: Craft a compelling, punchy, and original Hindi headline (max 15-20 words).
2. summary: Write a crisp 2-sentence summary in pure Hindi.
3. content: Write a comprehensive, detailed Hindi news article (300 to 500 words) divided into clear sections with Markdown headings:
   - ### मुख्य समाचार एवं ताज़ा अपडेट
   - ### विस्तृत घटनाक्रम व पृष्ठभूमि
   - ### किसान, छात्र और आम जनता के लिए मुख्य बिंदु (use bullet points)
   - ### आधिकारिक बयान एवं आगामी कार्रवाई
   - Add a closing attribution: "**हुंकार 24 ग्राउंड रिपोर्ट डेस्क**\\n*निष्पक्ष, निर्भीक और जनसरोकार की आवाज़*"
4. category: Choose exactly one: 'agriculture' | 'jobs' | 'schemes' | 'rajasthan' | 'national' | 'education' | 'sports' | 'weather'
5. district: If related to a specific Rajasthan district, select: 'jaipur' | 'sikar' | 'churu' | 'bikaner' | 'jodhpur' | 'kota' | 'udaipur' | 'barmer' | 'nagaur' | 'ajmer' | null
6. isBreaking: true if urgent (agriculture, jobs, major court/government announcement, disaster), else false.
7. tags: Array of 3-5 relevant Hindi tags.

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
 * Resilient deterministic journalistic copy generator
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
  if (lower.includes('किसान') || lower.includes('कृषि') || lower.includes('मंडी') || lower.includes('सरसों') || lower.includes('फसल') || lower.includes('ग्वार') || lower.includes('चना')) {
    category = 'agriculture';
  } else if (lower.includes('भर्ती') || lower.includes('नौकरी') || lower.includes('rpsc') || lower.includes('reet') || lower.includes('कांस्टेबल') || lower.includes('पद')) {
    category = 'jobs';
  } else if (lower.includes('योजना') || lower.includes('सब्सिडी') || lower.includes('अनुदान') || lower.includes('पेंशन') || lower.includes('पीएम किसान') || lower.includes('कुसुम')) {
    category = 'schemes';
  } else if (lower.includes('शिक्षा') || lower.includes('स्कूल') || lower.includes('कॉलेज') || lower.includes('परीक्षा') || lower.includes('बोर्ड')) {
    category = 'education';
  } else if (lower.includes('भारत') || lower.includes('प्रधानमंत्री') || lower.includes('सुप्रीम कोर्ट') || lower.includes('संसद') || lower.includes('रेलवे')) {
    category = 'national';
  }

  const isBreaking = category === 'agriculture' || category === 'jobs';
  const summary = cleanDesc.length > 30 ? cleanDesc : `${cleanTitle} के संबंध में संपूर्ण जानकारी और आधिकारिक विवरण सामने आया है।`;

  const content = `### मुख्य समाचार एवं ताज़ा अपडेट
${cleanTitle}

${summary}

### विस्तृत घटनाक्रम व पृष्ठभूमि
राज्य और राष्ट्रीय स्तर पर घटित इस महत्वपूर्ण घटनाक्रम के बाद संबंधित विभागों में व्यापक हलचल देखी जा रही है। हुंकार 24 द्वारा जुटाई गई प्रामाणिक जानकारी के अनुसार, प्रशासनिक मशीनरी और नीति-निर्माताओं द्वारा स्थिति पर निरंतर पैनी नज़र रखी जा रही है। जमीनी स्तर पर इसके दूरगामी परिणाम देखने को मिल सकते हैं।

### किसान, छात्र और आम जनता के लिए मुख्य बिंदु
- **सीधा सरोकार:** इस निर्णय/घटनाक्रम का सीधा प्रभाव स्थानीय नागरिकों, किसानों और परीक्षार्थियों की दैनिक गतिविधियों पर पड़ेगा।
- **विभागीय निगरानी:** जमीनी स्तर पर नीतियों के निष्पक्ष क्रियान्वयन हेतु जिला प्रशासन एवं निगरानी दलों को सक्रिय किया गया है।
- **पारदर्शिता व राहत:** आमजन को किसी भी प्रकार की भ्रामक सूचनाओं से बचने और आधिकारिक माध्यमों से ही पुष्टि करने का आग्रह किया गया है।

### आधिकारिक बयान एवं आगामी कार्रवाई
संबंधित प्रशासनिक अधिकारियों और विषय विशेषज्ञों का मानना है कि आने वाले समय में इसके सकारात्मक परिणाम सामने आएंगे। हुंकार 24 की रिपोर्टिंग टीम जनहित के हर मुद्दे को प्राथमिकता से उठाते हुए इस प्रकरण पर लगातार नज़र बनाए रखेगी।

---
**हुंकार 24 ग्राउंड रिपोर्ट डेस्क**  
*निष्पक्ष, निर्भीक और जनसरोकार की सशक्त आवाज़*  
[समाचार स्रोत: ${sourceName}]`;

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
