// HUNKAR 24 – Centralized Configuration
// All URLs, domains, logos, and brand assets are centralized here.

export interface DistrictInfo {
  id: string;
  nameHi: string;
  nameEn: string;
  division: string;
  tehsils: string[];
}

export const SITE_CONFIG = {
  // Brand Configuration
  brandName: 'HUNKAR 24',
  brandNameHi: 'हुंकार 24',
  brandTagline: 'राजस्थान की बुलंद आवाज़!',
  brandTaglineEn: 'The Resounding Voice of Rajasthan',
  
  // Domains
  currentSiteUrl: 'https://hunkar24.netlify.app',
  futureCustomDomain: 'https://hunkar24.in',
  primarySiteUrl: import.meta.env.VITE_SITE_URL || 'https://hunkar24.netlify.app',
  
  // Official Supplied Logo
  // Local high-speed fallback asset + remote verified direct image URL
  logoUrl: '/assets/hunkar24-logo.png',
  remoteLogoUrl: 'https://i.ibb.co/bMrrmCqP/hunkar24.png',
  suppliedImgbbUrl: 'https://ibb.co/RkCCbsZ9',

  // Contact Details
  contact: {
    phone: '+91 94140 12345',
    whatsapp: '+91 94140 12345',
    email: 'news@hunkar24.in',
    officeAddress: 'हुंकार 24 मीडिया भवन, सिविल लाइन्स, जयपुर, राजस्थान - 302006',
    grievanceEmail: 'grievance@hunkar24.in',
    grievanceOfficer: 'संपादकीय शिकायत निवारण अधिकारी (Hunkar 24)'
  },

  // Official Social Media Channels
  social: {
    whatsappChannel: 'https://whatsapp.com/channel/0029VaHunkar24',
    whatsappDirect: 'https://wa.me/919414012345?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20%E0%A4%B9%E0%A5%81%E0%A4%82%E0%A4%95%E0%A4%BE%E0%A4%B0%2024%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20%E0%A4%96%E0%A4%AC%E0%A4%B0%20%E0%A4%AD%E0%A5%87%E0%A4%9C%E0%A4%A8%E0%A5%80%20%E0%A4%B9%E0%A5%88',
    telegram: 'https://t.me/hunkar24news',
    youtube: 'https://youtube.com/@hunkar24news',
    instagram: 'https://instagram.com/hunkar24news',
    facebook: 'https://facebook.com/hunkar24news',
    twitter: 'https://twitter.com/hunkar24news'
  },

  // E-Paper and App Settings
  epaperUrl: '#epaper',
  
  // AdSense Publisher ID placeholder
  adsensePublisherId: 'pub-0000000000000000'
};

// Rajasthan 50 Districts and Key Tehsils
export const RAJASTHAN_DISTRICTS: DistrictInfo[] = [
  { id: 'jaipur', nameHi: 'जयपुर', nameEn: 'Jaipur', division: 'जयपुर', tehsils: ['जयपुर', 'आमेर', 'सांगानेर', 'बस्सी', 'चाकसू', 'कोटपूतली', 'शाहपुरा', 'विराटनगर', 'दूदू'] },
  { id: 'jodhpur', nameHi: 'जोधपुर', nameEn: 'Jodhpur', division: 'जोधपुर', tehsils: ['जोधपुर', 'लूणी', 'बिलाड़ा', 'ओसियां', 'भोपालगढ़', 'फलोदी', 'बाप'] },
  { id: 'udaipur', nameHi: 'उदयपुर', nameEn: 'Udaipur', division: 'उदयपुर', tehsils: ['गिर्वा', 'बड़गांव', 'मावली', 'वल्लभनगर', 'कोटड़ा', 'झाड़ोल', 'सलूंबर', 'खेरवाड़ा'] },
  { id: 'kota', nameHi: 'कोटा', nameEn: 'Kota', division: 'कोटा', tehsils: ['लाडपुरा', 'दीगोद', 'पीपल्दा', 'रामगंजमंडी', 'सांगोद', 'कनवास'] },
  { id: 'bikaner', nameHi: 'बीकानेर', nameEn: 'Bikaner', division: 'बीकानेर', tehsils: ['बीकानेर', 'नोखा', 'लूणकरणसर', 'श्रीडूंगरगढ़', 'कोलायत', 'खाजूवाला'] },
  { id: 'ajmer', nameHi: 'अजमेर', nameEn: 'Ajmer', division: 'अजमेर', tehsils: ['अजमेर', 'ब्यावर', 'नसीराबाद', 'किशनगढ़', 'केकड़ी', 'पुष्कर', 'सरवाड़'] },
  { id: 'sikar', nameHi: 'सीकर', nameEn: 'Sikar', division: 'जयपुर', tehsils: ['सीकर', 'लक्ष्मणगढ़', 'फतेहपुर', 'दांतारामगढ़', 'नीमकाथाना', 'खंडेला', 'श्रीमाधोपुर', 'धोद'] },
  { id: 'jhunjhunu', nameHi: 'झुंझुनूं', nameEn: 'Jhunjhunu', division: 'जयपुर', tehsils: ['झुंझुनूं', 'चिड़ावा', 'नवलगढ़', 'खेतड़ी', 'सूरजगढ़', 'बुहाना', 'उदयपुरवाटी'] },
  { id: 'churu', nameHi: 'चूरू', nameEn: 'Churu', division: 'बीकानेर', tehsils: ['चूरू', 'राजगढ़ (सादुलपुर)', 'रतनगढ़', 'सुजानगढ़', 'सरदारशहर', 'तारानगर', 'बीदासर'] },
  { id: 'alwar', nameHi: 'अलवर', nameEn: 'Alwar', division: 'जयपुर', tehsils: ['अलवर', 'बहरोड़', 'तिजारा', 'राजगढ़', 'थानागाजी', 'किशनगढ़ बास', 'रामगढ़'] },
  { id: 'bharatpur', nameHi: 'भरतपुर', nameEn: 'Bharatpur', division: 'भरतपुर', tehsils: ['भरतपुर', 'डीग', 'कुम्हेर', 'बयाना', 'नदबई', 'वैर', 'कामां', 'नगर'] },
  { id: 'barmer', nameHi: 'बाड़मेर', nameEn: 'Barmer', division: 'जोधपुर', tehsils: ['बाड़मेर', 'बालोतरा', 'सिवाना', 'बायतु', 'गुड़ामालानी', 'शिव', 'चौहटन'] },
  { id: 'nagaur', nameHi: 'नागौर', nameEn: 'Nagaur', division: 'अजमेर', tehsils: ['नागौर', 'डीडवाना', 'कुचामन', 'मकराना', 'लाडनूं', 'मेड़ता', 'डेगाना', 'खींवसर', 'जायल'] },
  { id: 'pali', nameHi: 'पाली', nameEn: 'Pali', division: 'जोधपुर', tehsils: ['पाली', 'सोजत', 'जैतारण', 'रोहट', 'बाली', 'सुमेरपुर', 'देसूरी', 'मारवाड़ जंक्शन'] },
  { id: 'bhilwara', nameHi: 'भीलवाड़ा', nameEn: 'Bhilwara', division: 'अजमेर', tehsils: ['भीलवाड़ा', 'शाहपुरा', 'मांडल', 'सहाड़ा', 'आसींद', 'मांडलगढ़', 'जहाजपुर', 'कोटड़ी'] },
  { id: 'ganganagar', nameHi: 'श्रीगंगानगर', nameEn: 'Sri Ganganagar', division: 'बीकानेर', tehsils: ['गंगानगर', 'करणपुर', 'सूरतगढ़', 'रायसिंहनगर', 'अनूपगढ़', 'विजयनगर', 'पदमपुर'] },
  { id: 'hanumangarh', nameHi: 'हनुमानगढ़', nameEn: 'Hanumangarh', division: 'बीकानेर', tehsils: ['हनुमानगढ़', 'पीलीबंगा', 'संगरिया', 'नोहर', 'भादरा', 'रावतसर', 'टिब्बी'] },
  { id: 'dausa', nameHi: 'दौसा', nameEn: 'Dausa', division: 'जयपुर', tehsils: ['दौसा', 'बांदीकुई', 'महुवा', 'लालसोट', 'सिकराय', 'रामगढ़ पचवारा'] },
  { id: 'tonk', nameHi: 'टोंक', nameEn: 'Tonk', division: 'अजमेर', tehsils: ['टोंक', 'निवाई', 'मालपुरा', 'देवली', 'उनियारा', 'टोडारायसिंह', 'पीपलू'] },
  { id: 'chittorgarh', nameHi: 'चित्तौड़गढ़', nameEn: 'Chittorgarh', division: 'उदयपुर', tehsils: ['चित्तौड़गढ़', 'कपासन', 'बेगूं', 'रावतभाटा', 'निम्बाहेड़ा', 'बड़ीसादड़ी', 'गंगरार'] }
];

export const DEFAULT_CATEGORIES = [
  { id: 'all', nameHi: 'होम', nameEn: 'Home', slug: 'home', order: 1, isVisible: true },
  { id: 'latest', nameHi: 'ताज़ा खबरें', nameEn: 'Latest News', slug: 'latest', order: 2, isVisible: true },
  { id: 'rajasthan', nameHi: 'राजस्थान', nameEn: 'Rajasthan', slug: 'rajasthan', order: 3, isVisible: true },
  { id: 'national', nameHi: 'देश', nameEn: 'National', slug: 'national', order: 4, isVisible: true },
  { id: 'international', nameHi: 'दुनिया', nameEn: 'International', slug: 'international', order: 5, isVisible: true },
  { id: 'politics', nameHi: 'राजनीति', nameEn: 'Politics', slug: 'politics', order: 6, isVisible: true },
  { id: 'crime', nameHi: 'अपराध', nameEn: 'Crime', slug: 'crime', order: 7, isVisible: true },
  { id: 'education', nameHi: 'शिक्षा', nameEn: 'Education', slug: 'education', order: 8, isVisible: true },
  { id: 'jobs', nameHi: 'नौकरी एवं रोजगार', nameEn: 'Jobs & Careers', slug: 'jobs', order: 9, isVisible: true },
  { id: 'schemes', nameHi: 'सरकारी योजनाएँ', nameEn: 'Govt Schemes', slug: 'schemes', order: 10, isVisible: true },
  { id: 'business', nameHi: 'व्यापार', nameEn: 'Business', slug: 'business', order: 11, isVisible: true },
  { id: 'agriculture', nameHi: 'कृषि एवं मंडी', nameEn: 'Agriculture', slug: 'agriculture', order: 12, isVisible: true },
  { id: 'tech', nameHi: 'तकनीक एवं AI', nameEn: 'Technology & AI', slug: 'tech', order: 13, isVisible: true },
  { id: 'sports', nameHi: 'खेल', nameEn: 'Sports', slug: 'sports', order: 14, isVisible: true },
  { id: 'entertainment', nameHi: 'मनोरंजन', nameEn: 'Entertainment', slug: 'entertainment', order: 15, isVisible: true },
  { id: 'health', nameHi: 'स्वास्थ्य', nameEn: 'Health', slug: 'health', order: 16, isVisible: true },
  { id: 'weather', nameHi: 'मौसम', nameEn: 'Weather', slug: 'weather', order: 17, isVisible: true },
  { id: 'video', nameHi: 'वीडियो न्यूज़', nameEn: 'Video News', slug: 'video', order: 18, isVisible: true },
  { id: 'ground-report', nameHi: 'ग्राउंड रिपोर्ट', nameEn: 'Ground Report', slug: 'ground-report', order: 19, isVisible: true },
  { id: 'gallery', nameHi: 'फोटो गैलरी', nameEn: 'Photo Gallery', slug: 'gallery', order: 20, isVisible: true }
];

export function getCanonicalUrl(path: string = ''): string {
  const base = SITE_CONFIG.primarySiteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
