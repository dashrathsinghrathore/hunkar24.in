import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';

interface PolicyModalProps {
  policyType: string | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  const getPolicyContent = () => {
    switch (policyType) {
      case 'editorial':
        return {
          title: 'पत्रकारिता आचार संहिता (Code of Ethics)',
          content: `**HUNKAR 24 (हुंकार 24) की डिजिटल पत्रकारिता आचार संहिता**

1. **निष्पक्षता एवं स्वतंत्रता:**
हुंकार 24 किसी भी राजनीतिक दल, व्यापारिक घराने या दबाव समूह से स्वतंत्र होकर पत्रकारिता करता है। हमारा एकमात्र उद्देश्य जनता के सरोकारों और निष्पक्ष सत्य को सामने लाना है।

2. **सत्यापन का सिद्धांत:**
प्रत्येक समाचार, विशेष रूप से आरोप-प्रत्यारोप या संवेदनशील घटना से जुड़े समाचारों को कम से कम दो स्वतंत्र विश्वसनीय स्रोतों से सत्यापित करने के पश्चात ही प्रकाशित किया जाता है।

3. **गोपनीयता एवं संवेदनशीलता:**
नाबालिगों, यौन उत्पीड़न पीड़ितों या संवेदनशील परिस्थितियों में शामिल व्यक्तियों की पहचान पूर्णतः गोपनीय रखी जाती है।

4. **विचार एवं विश्लेषण का स्पष्ट पृथक्करण:**
विश्लेषणात्मक आलेख, व्यक्तिगत विचार एवं विशेष टिप्पणियां सामान्य समाचार रिपोर्टिंग से स्पष्ट रूप से अलग चिन्हित किए जाते हैं।`
        };

      case 'fact-check':
        return {
          title: 'तथ्य जांच नीति (Fact Checking Policy)',
          content: `**हुंकार 24 फैक्ट-चेक प्रोटोकॉल**

- **वायरल दावों की जांच:** सोशल मीडिया और डिजिटल प्लेटफॉर्म पर फैलने वाले भ्रामक दावों, मॉर्फ्ड तस्वीरों और झूठे सरकारी आदेशों की गहराई से पड़ताल की जाती है।
- **आधिकारिक डेटा स्रोत:** हम भारत सरकार, राजस्थान सरकार, राज्य विधानसभा, न्यायालयों एवं प्रमाणित अनुसंधान संस्थानों के मूल अभिलेखों से तथ्यों का मिलान करते हैं।
- **पारदर्शिता:** फैक्ट-चेक रिपोर्ट में स्पष्ट रूप से बताया जाता है कि दावा क्या था, सच्चाई क्या है और हमारे निष्कर्ष का आधार क्या है।`
        };

      case 'corrections':
        return {
          title: 'संशोधन एवं खंडन नीति (Corrections Policy)',
          content: `**भूल सुधार एवं त्वरित संशोधन नीति**

- हुंकार 24 अपनी खबरों में पूर्ण सटीकता के लिए प्रतिबद्ध है। यदि किसी खबर में अनजाने में कोई तथ्यात्मक त्रुटि होती है, तो उसे तुरंत सुधारा जाता है।
- समाचार के अंत में 'संशोधन नोट' (Correction Note) जोड़कर पाठकों को यह स्पष्ट बताया जाता है कि क्या बदलाव किया गया है और किस समय अद्यतित किया गया।
- किसी भी त्रुटि की सूचना पाठक सीधे 'गलती की रिपोर्ट करें' बटन अथवा grievance@hunkar24.in पर भेज सकते हैं।`
        };

      case 'privacy':
        return {
          title: 'गोपनीयता नीति (Privacy Policy)',
          content: `**डिजिटल डेटा सुरक्षा एवं गोपनीयता**

1. **डेटा संग्रह:** हुंकार 24 केवल वेबसाइट के सुचारु संचालन, न्यूज़लेटर तथा पाठक प्रतिक्रिया के लिए न्यूनतम आवश्यक जानकारी एकत्र करता है।
2. **कुकीज एवं एनालिटिक्स:** उपयोगकर्ता अनुभव को बेहतर बनाने के लिए मानक कुकीज का उपयोग किया जाता है।
3. **तृतीय पक्ष साझाकरण:** हम पाठकों की व्यक्तिगत जानकारी (जैसे फोन नंबर, ईमेल) किसी भी तीसरे पक्ष या विज्ञापनदाता को नहीं बेचते।`
        };

      case 'terms':
        return {
          title: 'नियम एवं शर्तें (Terms & Conditions)',
          content: `**हुंकार 24 डिजिटल उपयोग की शर्तें**

- इस वेबसाइट पर प्रकाशित समस्त सामग्री (टेक्स्ट, फोटो, वीडियो एवं लोगो) कॉपीराइट कानून के तहत संरक्षित है।
- पूर्व लिखित अनुमति के बिना किसी भी सामग्री का व्यावसायिक पुनरुत्पादन निषिद्ध है।
- जन-रिपोर्टर द्वारा भेजी जाने वाली खबरों में कॉपीराइट उल्लंघन या मानहानिकारक सामग्री नहीं होनी चाहिए।`
        };

      case 'grievance':
        return {
          title: 'शिकायत निवारण अधिकारी (Grievance Redressal)',
          content: `**सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश और डिजिटल मीडिया आचार संहिता) नियम, 2021 के अंतर्गत अनुपालन:**

- **शिकायत अधिकारी:** विधिक नोडल अधिकारी (Hunkar 24)
- **व्हाट्सऐप सहायता:** 7726084809
- **आधिकारिक चैनल:** @HUNKAR24 (Telegram) / WhatsApp Group

*प्राप्त शिकायतों की 24 घंटे में पावती दी जाती है और 15 कार्य दिवसों के भीतर निवारण किया जाता है।*`
        };

      default:
        return {
          title: 'नीति विवरण',
          content: 'विवरण उपलब्ध नहीं है।'
        };
    }
  };

  const policy = getPolicyContent();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold font-newspaper-headline">
              {policy.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-stone-800 dark:text-stone-200 leading-relaxed space-y-4">
          {policy.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50 dark:bg-stone-950">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 dark:bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-stone-800"
          >
            समझ गए (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
