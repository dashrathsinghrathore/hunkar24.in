/**
 * HUNKAR 24 — Topic-Accurate News Visual Intelligence Engine
 * 
 * Ensures that EVERY news article displays a visually authentic, high-resolution,
 * contextually accurate photo matching the exact subject matter (Crops, Mandi, 
 * RPSC exams, Solar pumps, Dams/ERCP, Railways, Police, Monsoon/Weather, etc.)
 */

export interface TopicVisual {
  keywords: string[];
  imageUrl: string;
  caption: string;
}

// Master contextual topic image registry
export const TOPIC_IMAGE_REGISTRY: TopicVisual[] = [
  // 1. Agriculture: Mustard (सरसों) & Oilseeds
  {
    keywords: ['सरसों', 'mustard', 'तिलहन', 'तेल', 'सरसों भाव', 'सरसों आवक'],
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1200&q=80',
    caption: 'राजस्थान कृषि मंडी में सरसों की बंपर आवक एवं नीलामी'
  },
  // 2. Agriculture: Wheat (गेहूं) & Harvesting
  {
    keywords: ['गेहूं', 'wheat', 'अनाज', 'फसल', 'खरीफ', 'रबी', 'एमएसपी', 'msp'],
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    caption: 'खेतों में लहराती रबी फसल एवं समर्थन मूल्य खरीद'
  },
  // 3. Agriculture: Mandi Bhav & Grain Bags (मंडी भाव, बोरियां, नीलामी)
  {
    keywords: ['मंडी', 'mandi', 'बोरी', 'नीलामी', 'व्यापारी', 'मंडी भाव', 'अनाज मंडी'],
    imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
    caption: 'कृषि उपज मंडी में अनाज की बोरियां एवं नीलामी दृश्य'
  },
  // 4. Agriculture: Chickpea, Moong, Guar, Cumin (चना, ग्वार, जीरा, मूंग)
  {
    keywords: ['चना', 'जीरा', 'ग्वार', 'मूंग', 'मोठ', 'दालें', 'इसबगोल'],
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80',
    caption: 'पश्चिमी राजस्थान की नकदी फसलें एवं दलहन'
  },
  // 5. Agriculture: Irrigation, Tubewell & Solar Pumps (कुसुम योजना, सोलर पंप, फव्वारा)
  {
    keywords: ['सोलर', 'कुसुम', 'पंप', 'सिंचाई', 'ट्यूबवेल', 'फव्वारा', 'solar pump'],
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    caption: 'खेतों में सौर ऊर्जा कृषि पंप संयंत्र एवं आधुनिक सिंचाई'
  },
  // 6. Schemes: ERCP, Dams, Water Canal & Pipelines (ईआरसीपी, बांध, बीसलपुर, नहर)
  {
    keywords: ['ercp', 'ईआरसीपी', 'बांध', 'नहर', 'पेयजल', 'बीसलपुर', 'जलदाय', 'पानी', 'canal', 'dam'],
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
    caption: 'पूर्वी राजस्थान नहर परियोजना एवं बांध जल भंडारण'
  },
  // 7. Education & Recruitment: RPSC, REET, Exams (भर्ती, परीक्षा, शिक्षक, rpsc, reet)
  {
    keywords: ['rpsc', 'reet', 'भर्ती', 'परीक्षा', 'प्रवेश पत्र', 'रिजल्ट', 'नौकरी', 'शिक्षक भर्ती', 'exam', 'job'],
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    caption: 'राजस्थान प्रतियोगी परीक्षा एवं भर्ती तैयारी में जुटे अभ्यर्थी'
  },
  // 8. Education: Schools, Colleges, Students (स्कूल, कॉलेज, छात्र, विश्वविद्यालय)
  {
    keywords: ['स्कूल', 'कॉलेज', 'शिक्षा', 'विद्यार्थी', 'छात्र', 'विश्वविद्यालय', 'बोर्ड', 'school', 'student'],
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    caption: 'स्मार्ट क्लासरूम एवं उच्च शिक्षा संस्थान'
  },
  // 9. Transportation: Indian Railways & Vande Bharat (रेलवे, वंदे भारत, ट्रेन)
  {
    keywords: ['रेलवे', 'ट्रेन', 'वंदे भारत', 'रेल', 'स्टेशन', 'लोको', 'railway', 'train', 'vande bharat'],
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80',
    caption: 'भारतीय रेलवे एवं सेमी-हाई स्पीड वंदे भारत एक्सप्रेस'
  },
  // 10. Weather & Monsoon: Rain, Storm, Heatwave (बारिश, मानसून, मौसम, ओलावृष्टि, आंधी)
  {
    keywords: ['बारिश', 'मानसून', 'मौसम', 'ओलावृष्टि', 'तापमान', 'लू', 'शीतलहर', 'rain', 'weather'],
    imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80',
    caption: 'राजस्थान में मौसमी बदलाव एवं वर्षा का प्रभाव'
  },
  // 11. Police & Law Enforcement: Crime, Investigation (पुलिस, सुरक्षा, कानून, जांच)
  {
    keywords: ['पुलिस', 'थाना', 'अपराध', 'सुरक्षा', 'जांच', 'गिरफ्तार', 'कार्रवाई', 'police', 'crime'],
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    caption: 'प्रशासनिक सतर्कता एवं कानून-व्यवस्था'
  },
  // 12. Governance & Politics: Rajasthan Assembly, Cabinet (कैबिनेट, सरकार, विधानसभा, बजट)
  {
    keywords: ['कैबिनेट', 'विधानसभा', 'मुख्यमंत्री', 'सरकार', 'बजट', 'प्रशासन', 'मंत्री', 'politics', 'government'],
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    caption: 'राजस्थान शासन सचिवालय एवं प्रशासनिक निर्णय'
  },
  // 13. Health & Medical: Hospital, Doctor, Medicine (अस्पताल, स्वास्थ्य, डॉक्टर, दवा)
  {
    keywords: ['अस्पताल', 'स्वास्थ्य', 'डॉक्टर', 'दवा', 'इलाज', 'चिकित्सा', 'hospital', 'health'],
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    caption: 'राजकीय चिकित्सालय एवं स्वास्थ्य सेवाएं'
  },
  // 14. Sports & Athletics: Cricket, Stadium, Tournament (क्रिकेट, खेलकूद, टूर्नामेंट, पदक)
  {
    keywords: ['क्रिकेट', 'खेल', 'टूर्नामेंट', 'खिलाड़ी', 'स्टेडियम', 'पदक', 'sports', 'cricket'],
    imageUrl: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80',
    caption: 'खेलकूद एवं राज्य स्तरीय खेल प्रतियोगिता'
  },
  // 15. Technology & Digital India: AI, Internet, Mobile (तकनीक, इंटरनेट, मोबाइल, साइबर)
  {
    keywords: ['तकनीक', 'इंटरनेट', 'मोबाइल', 'साइबर', 'सॉफ्टवेयर', 'ai', 'tech', 'digital'],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    caption: 'डिजिटल नवाचार एवं तकनीकी प्रगति'
  },
  // 16. Business, Markets, Economy (व्यापार, शेयर, बाजार, सोना, चांदी)
  {
    keywords: ['व्यापार', 'बाजार', 'सोना', 'चांदी', 'जीएसटी', 'उद्योग', 'कारोबार', 'business', 'economy'],
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    caption: 'व्यापारिक प्रतिष्ठान एवं वित्तीय बाजार'
  },
  // 17. Jaipur (जयपुर): Pink City Landmarks
  {
    keywords: ['जयपुर', 'jaipur', 'सांगानेर', 'आमेर', 'हवामहल'],
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    caption: 'राजधानी जयपुर का ऐतिहासिक परिदृश्य'
  },
  // 18. Churu, Bikaner, Desert (चूरू, बीकानेर, शेखावाटी, थार मरुस्थल)
  {
    keywords: ['चूरू', 'churu', 'बीकानेर', 'bikaner', 'शेखावाटी', 'मरुस्थल', 'रेत'],
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    caption: 'थार मरुस्थल एवं शेखावाटी अंचल का सांस्कृतिक वैभव'
  },
  // 19. Sikar, Jhunjhunu (सीकर, झुंझुनूं, खाटूश्यामजी)
  {
    keywords: ['सीकर', 'sikar', 'झुंझुनूं', 'jhunjhunu', 'खाटूश्यामजी'],
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    caption: 'शेखावाटी अंचल का कृषि एवं ग्रामीण अंचल'
  },
  // 20. Jodhpur, Udaipur (जोधपुर, उदयपुर, मेहरानगढ़, झीलों की नगरी)
  {
    keywords: ['जोधपुर', 'jodhpur', 'उदयपुर', 'udaipur', 'मेवाड़', 'मारवाड़'],
    imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
    caption: 'ऐतिहासिक धरोहर एवं सांस्कृतिक गौरव'
  }
];

/**
 * Given article text, category, and district, returns the best-matching authentic news photo.
 */
export function getTopicAccurateImage(
  titleOrContent: string,
  category = 'rajasthan',
  district?: string,
  providedUrl?: string
): { imageUrl: string; caption: string } {
  // If a valid, non-placeholder remote URL is already provided and not broken
  if (
    providedUrl &&
    providedUrl.startsWith('http') &&
    !providedUrl.includes('placeholder') &&
    !providedUrl.includes('unsplash.com/photo-1504711434969-e33886168f5c') // default generic
  ) {
    return {
      imageUrl: providedUrl,
      caption: 'हुंकार 24 समाचार संदर्भ दृश्य'
    };
  }

  const textToScan = `${titleOrContent || ''} ${category || ''} ${district || ''}`.toLowerCase();

  // Find the registry entry with the highest keyword match
  let bestMatch: TopicVisual | null = null;
  let highestScore = 0;

  for (const item of TOPIC_IMAGE_REGISTRY) {
    let score = 0;
    for (const kw of item.keywords) {
      if (textToScan.includes(kw.toLowerCase())) {
        score += kw.length > 4 ? 3 : 1; // Longer matching keywords score higher
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return {
      imageUrl: bestMatch.imageUrl,
      caption: bestMatch.caption
    };
  }

  // Fallback by category
  const catMatch = TOPIC_IMAGE_REGISTRY.find(i => i.keywords.includes(category.toLowerCase()));
  if (catMatch) {
    return {
      imageUrl: catMatch.imageUrl,
      caption: catMatch.caption
    };
  }

  // Default Rajasthan Landmark Visual
  return {
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    caption: 'हुंकार 24 — राजस्थान की बुलंद आवाज़'
  };
}
