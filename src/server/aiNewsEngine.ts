import { GoogleGenAI } from '@google/genai';
import { RawNewsArticle } from './newsProviders';
import { ProcessedArticle, cleanCanonicalUrl } from './deduplicationEngine';
import { getTopicAccurateImage } from '../utils/newsImageMatcher';

// Sensitive topic keywords for risk classification & editorial review routing (Requirement 4)
const SENSITIVE_KEYWORDS = [
  'दुष्कर्म', 'हत्या', 'विवाद', 'दंगा', 'सांप्रदायिक', 'भ्रष्टाचार', 'धर्मांतरण',
  'मानहानि', 'आरोप', 'घोटाला', 'चमत्कारी इलाज', 'चुनाव धांधली', 'साजिश',
  'suicide', 'rape', 'murder', 'riot', 'communal', 'terror', 'bomb', 'bribe',
  'defamation', 'allegation', 'scam', 'election fraud', 'conspiracy', 'unverified'
];

// Rajasthan districts dictionary for keyword extraction
const RAJASTHAN_DISTRICT_KEYWORDS: Record<string, string[]> = {
  jaipur: ['जयपुर', 'jaipur', 'सांगानेर', 'आमेर', 'विद्याधर नगर'],
  churu: ['चूरू', 'churu', 'सादुलपुर', 'रतनगढ़', 'सुजानगढ़', 'सरदारशहर', 'तारानगर'],
  sikar: ['सीकर', 'sikar', 'लक्ष्मणगढ़', 'फतेहपुर', 'नीमकाथाना', 'खाटूश्यामजी'],
  bikaner: ['बीकानेर', 'bikaner', 'नोखा', 'लूणकरणसर', 'कोलायत'],
  jodhpur: ['जोधपुर', 'jodhpur', 'ओसियां', 'फलोदी', 'लूणी'],
  udaipur: ['उदयपुर', 'udaipur', 'झाड़ोल', 'वल्लभनगर', 'सलूंबर'],
  kota: ['कोटा', 'kota', 'लाडपुरा', 'रामगंजमंडी'],
  ajmer: ['अजमेर', 'ajmer', 'पुष्कर', 'ब्यावर', 'किशनगढ़'],
  nagaur: ['नागौर', 'nagaur', 'डीडवाना', 'कुचामन', 'मकराना', 'मेड़ता'],
  barmer: ['बाड़मेर', 'barmer', 'बालोतरा', 'सिवाना', 'बायतु'],
  alwar: ['अलवर', 'alwar', 'बहरोड़', 'भिवाड़ी', 'तिजारा'],
  bharatpur: ['भरतपुर', 'bharatpur', 'डीग', 'बयाना'],
  ganganagar: ['श्रीगंगानगर', 'ganganagar', 'सूरतगढ़', 'अनूपगढ़'],
  hanumangarh: ['हनुमानगढ़', 'hanumangarh', 'नोहर', 'भादरा']
};

export async function processArticleWithAI(
  raw: RawNewsArticle,
  duplicateSources: RawNewsArticle[] = []
): Promise<ProcessedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isEnglish = raw.language === 'en' || !/[\u0900-\u097F]/.test(raw.title);

  // Check for sensitive keywords
  const fullTextToInspect = `${raw.title} ${raw.description} ${raw.content}`.toLowerCase();
  const sensitiveFlags: string[] = [];
  for (const kw of SENSITIVE_KEYWORDS) {
    if (fullTextToInspect.includes(kw)) {
      sensitiveFlags.push(kw);
    }
  }

  // Detect district
  let detectedDistrict = raw.districtSuggestion;
  if (!detectedDistrict) {
    for (const [distKey, keywords] of Object.entries(RAJASTHAN_DISTRICT_KEYWORDS)) {
      if (keywords.some(k => fullTextToInspect.includes(k.toLowerCase()))) {
        detectedDistrict = distKey;
        break;
      }
    }
  }

  // Consolidate sources
  const allSources = [
    {
      sourceId: raw.sourceId,
      sourceName: raw.sourceName,
      url: raw.url
    },
    ...duplicateSources.map(d => ({
      sourceId: d.sourceId,
      sourceName: d.sourceName,
      url: d.url
    }))
  ];

  const verificationLevel = sensitiveFlags.length > 0
    ? 'sensitive_topic'
    : allSources.length > 1
    ? 'multiple_sources'
    : 'single_source';

  // If Gemini API is available and key is configured, use Google GenAI
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the lead Hindi editor for 'HUNKAR 24 (हुंकार 24)'.
Task: Process this news item into authentic, natural, neutral, accurate Hindi journalism.
Rules:
- Generate a natural, punchy Hindi headline (under 20 words).
- If English, translate faithfully into clear Hindi. Do not change facts or invent quotes.
- Generate an original, concise Hindi summary (60-90 words).
- Generate a detailed, professional Hindi news article content (250-400 words) with clear headings and bullet points.
- Extract 4-6 relevant Hindi tags.
- Suggest a category strictly from: rajasthan, national, international, politics, education, jobs, schemes, business, agriculture, tech, sports, entertainment, weather.

Article Title: ${raw.title}
Article Body/Snippet: ${raw.description || raw.content}
Source Name: ${raw.sourceName}
Detected District: ${detectedDistrict || 'None'}

Return ONLY valid JSON in this exact structure without markdown backticks:
{
  "titleHindi": "...",
  "summaryHindi": "...",
  "contentHindi": "...",
  "category": "...",
  "district": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "tags": ["..."]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        id: `auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sourceArticles: allSources,
        canonicalUrl: cleanCanonicalUrl(raw.url),
        titleHindi: parsed.titleHindi || raw.title,
        summaryHindi: parsed.summaryHindi || raw.description || raw.title,
        contentHindi: parsed.contentHindi || `${parsed.summaryHindi || raw.description}\n\n[मूल स्रोत: ${raw.sourceName}]`,
        originalTitle: raw.title,
        originalLanguage: isEnglish ? 'en' : 'hi',
        category: parsed.category || raw.categorySuggestion || (detectedDistrict ? 'rajasthan' : 'national'),
        district: parsed.district || detectedDistrict || undefined,
        imageUrl: getTopicAccurateImage(raw.title, parsed.category || 'rajasthan', parsed.district || detectedDistrict, raw.imageUrl).imageUrl,
        imageSource: raw.sourceName,
        publishedAt: raw.publishedAt,
        verificationLevel,
        sensitiveFlags,
        seoTitle: parsed.seoTitle || `${parsed.titleHindi || raw.title} | हुंकार 24`,
        seoDescription: parsed.seoDescription || (parsed.summaryHindi || '').slice(0, 150),
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['हुंकार 24', 'ताज़ा खबर'],
        duplicateCount: duplicateSources.length,
        similarityScore: duplicateSources.length > 0 ? 0.85 : 1.0
      };
    } catch (err) {
      console.warn('Gemini processing fallback to rule-based engine:', err);
    }
  }

  // Deterministic rule-based fallback (Guarantees zero-crash continuous operation)
  const cleanRawTitle = (raw.title || '')
    .replace(/\s+-\s+[^-]+$/, '')
    .replace(/^[|\s]+|[|\s]+$/g, '')
    .trim();

  const fallbackTitle = isEnglish
    ? `[अपडेट] ${cleanRawTitle}`
    : cleanRawTitle;

  let cleanRawDesc = (raw.description || '')
    .replace(/<[^>]*>/g, '')
    .replace(/^[|\s]+|[|\s]+$/g, '')
    .trim();

  if (!cleanRawDesc || cleanRawDesc === '|' || cleanRawDesc.length < 20) {
    cleanRawDesc = `${fallbackTitle} को लेकर नवीनतम घटनाक्रम सामने आया है। हुंकार 24 डिजिटल डेस्क द्वारा प्राप्त जानकारी के अनुसार संबंधित अधिकारियों एवं स्थानीय प्रशासन ने स्थिति का संज्ञान लिया है।`;
  }

  const fallbackSummary = cleanRawDesc;

  const fullArticleContent = `${fallbackTitle}

${cleanRawDesc}

**महत्वपूर्ण विवरण एवं पृष्ठभूमि:**
- राज्य एवं ज़िला प्रशासन द्वारा इस विषय पर आवश्यक प्रशासनिक कदम उठाए जा रहे हैं।
- हुंकार 24 की ग्राउंड रिपोर्टिंग टीम आमजन और पाठकों तक सबसे सटीक व निष्पक्ष तथ्य पहुंचाने के लिए निरंतर कार्यरत है।
- मामले से संबंधित विस्तृत आधिकारिक दिशानिर्देश जारी होते ही बुलेटिन को अपडेट किया जाएगा।

[समाचार स्रोत: ${raw.sourceName || 'हुंकार 24 विशेष डेस्क'} | राजस्थान डिजिटल न्यूज़ नेटवर्क]`;

  const fallbackCategory = detectedDistrict
    ? 'rajasthan'
    : raw.categorySuggestion || 'national';

  return {
    id: `auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sourceArticles: allSources,
    canonicalUrl: cleanCanonicalUrl(raw.url),
    titleHindi: fallbackTitle,
    summaryHindi: fallbackSummary,
    contentHindi: fullArticleContent,
    originalTitle: raw.title,
    originalLanguage: isEnglish ? 'en' : 'hi',
    category: fallbackCategory,
    district: detectedDistrict,
    imageUrl: getTopicAccurateImage(raw.title, fallbackCategory, detectedDistrict, raw.imageUrl).imageUrl,
    imageSource: raw.sourceName,
    publishedAt: raw.publishedAt,
    verificationLevel,
    sensitiveFlags,
    seoTitle: `${fallbackTitle} | हुंकार 24`,
    seoDescription: fallbackSummary.slice(0, 150),
    tags: [detectedDistrict || 'राजस्थान', raw.sourceName, 'हुंकार 24', 'ताज़ा खबर'],
    duplicateCount: duplicateSources.length,
    similarityScore: duplicateSources.length > 0 ? 0.85 : 1.0
  };
}
