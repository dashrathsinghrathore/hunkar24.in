/**
 * HUNKAR 24 (हुंकार 24) - News Utilities
 * Standardized reading time calculation, text sanitization, and source attribution
 */

/**
 * Calculates estimated reading time in minutes based on Hindi / general word count.
 * Average Hindi reading speed is ~150-180 words per minute.
 */
export function estimateReadingTime(content?: string, summary?: string, fallback = 2): number {
  const fullText = `${content || ''} ${summary || ''}`.trim();
  if (!fullText) return fallback;

  // Strip markdown, html tags and extra symbols
  const cleaned = fullText.replace(/<[^>]*>/g, '').replace(/[*#_`|]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  
  if (words.length === 0) return fallback;
  const minutes = Math.ceil(words.length / 160);
  return Math.max(1, Math.min(minutes, 15));
}

/**
 * Sanitizes headlines, removing dangling pipes, unescaped HTML, or trailing sources.
 */
export function sanitizeHeadline(headline?: string, fallback = 'राजस्थान की ताज़ा खबर'): string {
  if (!headline) return fallback;
  const clean = headline
    .replace(/<[^>]*>/g, '')
    .replace(/^\|\s*|\s*\|\s*$/g, '')
    .replace(/\s+-\s+[^-]+$/, '') // Remove trailing " - Dainik Bhaskar" in RSS titles
    .trim();

  return clean.length > 5 ? clean : fallback;
}

/**
/**
 * Prohibited generic AI-filler phrases to completely ban across all articles.
 */
export const PROHIBITED_GENERIC_FILLER = [
  'संबंधित विभागों में व्यापक हलचल देखी जा रही है',
  'प्रशासन स्थिति पर पैनी नज़र रख रहा है',
  'आने वाले समय में सकारात्मक परिणाम सामने आएंगे',
  'आम जनता को किसी भी प्रकार की भ्रामक सूचनाओं से बचने का आग्रह किया गया है',
  'हुंकार 24 की टीम लगातार नज़र बनाए रखेगी',
  'यह घटनाक्रम बेहद महत्वपूर्ण माना जा रहा है',
  'इस मामले में आगे क्या होगा, यह देखना महत्वपूर्ण होगा',
  'राज्य और राष्ट्रीय स्तर पर घटित इस महत्वपूर्ण घटनाक्रम के बाद संबंधित विभागों में व्यापक हलचल देखी जा रही है',
  'हुंकार 24 द्वारा जुटाई गई प्रामाणिक जानकारी के अनुसार, प्रशासनिक मशीनरी और नीति-निर्माताओं द्वारा स्थिति पर निरंतर पैनी नज़र रखी जा रही है',
  'जमीनी स्तर पर इसके दूरगामी परिणाम देखने को मिल सकते हैं',
  'हुंकार 24 की ग्राउंड रिपोर्टिंग टीम आमजन और पाठकों तक सबसे सटीक व निष्पक्ष तथ्य पहुंचाने के लिए निरंतर कार्यरत है',
  'मामले से संबंधित विस्तृत आधिकारिक दिशानिर्देश जारी होते ही बुलेटिन को अपडेट किया जाएगा'
];

/**
 * Strips prohibited filler phrases and boilerplate blocks from text.
 */
export function stripGenericFiller(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // Remove full boilerplate heading blocks if they were artificially injected
  cleaned = cleaned.replace(/### विस्तृत घटनाक्रम व पृष्ठभूमि[\s\S]*?(?=###|---|$)/g, (match) => {
    if (match.includes('संबंधित विभागों में व्यापक हलचल') || match.includes('पैनी नज़र रखी जा रही')) {
      return '';
    }
    return match;
  });

  cleaned = cleaned.replace(/### किसान, छात्र और आम जनता के लिए मुख्य बिंदु[\s\S]*?(?=###|---|$)/g, (match) => {
    if (match.includes('सीधा सरोकार') && match.includes('विभागीय निगरानी') && match.includes('पारदर्शिता व राहत')) {
      return '';
    }
    return match;
  });

  cleaned = cleaned.replace(/### आधिकारिक बयान एवं आगामी कार्रवाई[\s\S]*?(?=###|---|$)/g, (match) => {
    if (match.includes('सकारात्मक परिणाम सामने आएंगे') || match.includes('लगातार नज़र बनाए रखेगी')) {
      return '';
    }
    return match;
  });

  cleaned = cleaned.replace(/\*\*महत्वपूर्ण विवरण एवं पृष्ठभूमि:\*\*[\s\S]*?(?=\n\n|$)/g, '');

  for (const filler of PROHIBITED_GENERIC_FILLER) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped, 'gi'), '');
  }

  // Remove empty bullets or dangling headers
  cleaned = cleaned
    .replace(/^[-*]\s*$/gm, '')
    .replace(/^###?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

/**
 * Sanitizes summaries and descriptions.
 * Guarantees fact-based journalism without meaningless filler.
 */
export function sanitizeSummary(summary?: string, headline?: string, category = 'राजस्थान'): string {
  const clean = stripGenericFiller(
    (summary || '')
      .replace(/<[^>]*>/g, '')
      .replace(/^\|\s*|\s*\|\s*$/g, '')
      .trim()
  );

  if (!clean || clean === '|' || clean.length < 10) {
    return headline ? headline.trim() : 'ताज़ा समाचार रिपोर्ट।';
  }

  return clean;
}

/**
 * Sanitizes full content, ensuring clean factual news without generic filler.
 * Length strictly respects available facts.
 */
export function sanitizeContent(content?: string, summary?: string, headline?: string, sourceName?: string): string {
  const clean = stripGenericFiller((content || '').trim());
  if (clean && clean !== '|' && clean.length > 30) {
    return clean;
  }

  const baseSummary = sanitizeSummary(summary, headline);
  const head = headline ? headline.trim() : '';

  if (clean && clean.length > 0 && clean !== '|') {
    return clean;
  }

  if (baseSummary && baseSummary !== head) {
    return baseSummary;
  }

  return head || 'विस्तृत विवरण संकलित किया जा रहा है।';
}

