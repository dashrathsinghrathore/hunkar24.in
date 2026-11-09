import React, { useState } from 'react';
import { X, Megaphone, CheckCircle2, AlertCircle, Send, DollarSign } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const BusinessPromotionModal: React.FC = () => {
  const { isPromotionModalOpen, setIsPromotionModalOpen, submitPromotionRequest } = useNews();

  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('कोचिंग एवं शिक्षण संस्थान');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [preferredPlacement, setPreferredPlacement] = useState('homepage_banner');
  const [campaignDurationDays, setCampaignDurationDays] = useState(15);
  const [budgetInr, setBudgetInr] = useState(5000);

  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isPromotionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!businessName.trim() || !contactPerson.trim() || !mobile.trim()) {
      setErrorMsg('कृपया संस्थान का नाम, संपर्क व्यक्ति एवं मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setErrorMsg('कृपया विज्ञापन अभियान का शीर्षक व विवरण लिखें।');
      return;
    }

    const reqId = submitPromotionRequest({
      businessName: businessName.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      whatsapp: (whatsapp || mobile).trim(),
      email: email.trim() || undefined,
      category,
      title: title.trim(),
      description: description.trim(),
      posterUrl: posterUrl.trim() || undefined,
      preferredPlacement,
      campaignDurationDays,
      budgetInr
    });

    setSubmittedId(reqId);
  };

  const handleClose = () => {
    setIsPromotionModalOpen(false);
    setSubmittedId(null);
    setBusinessName('');
    setContactPerson('');
    setMobile('');
    setTitle('');
    setDescription('');
    setPosterUrl('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black font-newspaper-headline flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-200" />
              <span>हुंकार 24 व्यापार एवं विज्ञापन प्रचार पोर्टल</span>
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">
              स्कूल, कॉलेज, कोचिंग, हॉस्पिटल एवं स्थानीय प्रतिष्ठानों का प्रभावी डिजिटल प्रचार
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {submittedId ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-stone-900 dark:text-stone-100 font-newspaper-headline mb-2">
                विज्ञापन आवेदन सफलतापूर्वक दर्ज हुआ!
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto mb-4">
                हुंकार 24 विज्ञापन टीम आपके प्रस्ताव की समीक्षा कर 2 घंटे के भीतर आपसे संपर्क करेगी।
              </p>

              <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-lg inline-block border border-stone-200 dark:border-stone-700 font-mono font-bold text-amber-700 dark:text-amber-400 text-sm mb-6">
                प्रस्ताव आईडी: {submittedId}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-colors"
                >
                  पूर्ण हुआ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Business Name & Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    व्यापार / संस्थान का नाम <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्री करणी कंप्यूटर संस्थान"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    संपर्क अधिकारी / प्रोपराइटर <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="नाम लिखें"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Mobile, WhatsApp, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    मोबाइल नंबर <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10 अंकों का नंबर"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    व्हाट्सऐप नंबर
                  </label>
                  <input
                    type="tel"
                    placeholder="व्हाट्सऐप नंबर"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ईमेल पता (वैकल्पिक)
                  </label>
                  <input
                    type="email"
                    placeholder="business@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  व्यापार श्रेणी
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                >
                  <option value="कोचिंग एवं शिक्षण संस्थान">कोचिंग एवं शिक्षण संस्थान / स्कूल / कॉलेज</option>
                  <option value="अस्पताल एवं क्लिनिक">अस्पताल, क्लिनिक एवं स्वास्थ्य सेवाएं</option>
                  <option value="रियल एस्टेट एवं प्रॉपर्टी">रियल एस्टेट, प्लॉटिंग एवं निर्माण</option>
                  <option value="कृषि खाद बीज एवं यंत्र">कृषि खाद, बीज एवं उपकरण</option>
                  <option value="होटल एवं रेस्टोरेंट">होटल, रिसॉर्ट एवं मैरिज गार्डन</option>
                  <option value="ऑटोमोबाइल शोरूम">ऑटोमोबाइल, ट्रैक्टर एवं वाहन डीलरशिप</option>
                  <option value="अन्य स्थानीय व्यापार">अन्य स्थानीय व्यवसाय / सेवा</option>
                </select>
              </div>

              {/* Campaign Title & Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  प्रचार / ऑफर का शीर्षक <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. नए सत्र के लिए 20% छात्रवृत्ति छूट के साथ प्रवेश प्रारंभ"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ऑफर एवं प्रचार का विस्तृत विवरण
                </label>
                <textarea
                  rows={3}
                  placeholder="मुख्य विशेषताएं, पता, फोन नंबर तथा विशेष छूट का विवरण दें..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

              {/* Placement, Duration & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                    पसंदीदा विज्ञापन स्थान
                  </label>
                  <select
                    value={preferredPlacement}
                    onChange={e => setPreferredPlacement(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  >
                    <option value="homepage_banner">होमपेज टॉप बैनर</option>
                    <option value="middle_feed">मध्य समाचार बैनर</option>
                    <option value="sidebar">साइडबार प्रीमियम कार्ड</option>
                    <option value="article_page">समाचार पृष्ठ बैनर</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                    अभियान अवधि
                  </label>
                  <select
                    value={campaignDurationDays}
                    onChange={e => setCampaignDurationDays(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  >
                    <option value={7}>7 दिन (1 सप्ताह)</option>
                    <option value={15}>15 दिन</option>
                    <option value={30}>30 दिन (1 माह)</option>
                    <option value={90}>90 दिन (3 माह)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                    अनुमानित बजट (₹)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={budgetInr}
                    onChange={e => setBudgetInr(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>विज्ञापन अनुरोध भेजें</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
