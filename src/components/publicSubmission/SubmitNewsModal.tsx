import React, { useState } from 'react';
import { X, Send, Upload, AlertCircle, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

export const SubmitNewsModal: React.FC = () => {
  const { isSubmitNewsOpen, setIsSubmitNewsOpen, submitPublicNews } = useNews();

  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('jaipur');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isSubmitNewsOpen) return null;

  const currentDist = RAJASTHAN_DISTRICTS.find(d => d.id === district) || RAJASTHAN_DISTRICTS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!headline.trim() || !description.trim()) {
      setErrorMsg('कृपया शीर्षक एवं समाचार का पूर्ण विवरण दर्ज करें।');
      return;
    }
    if (!submitterName.trim() || !mobile.trim()) {
      setErrorMsg('कृपया अपना नाम एवं वैध मोबाइल नंबर प्रदान करें ताकि हुंकार 24 टीम पुष्टि कर सके।');
      return;
    }
    if (!consentGiven) {
      setErrorMsg('कृपया घोषणा एवं सहमति चेकबॉक्स को चुनें।');
      return;
    }

    const trackingId = submitPublicNews({
      headline: headline.trim(),
      description: description.trim(),
      district: currentDist.nameHi,
      tehsil: tehsil.trim() || currentDist.nameHi,
      village: village.trim(),
      imageUrls: imageUrl.trim() ? [imageUrl.trim()] : ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'],
      videoUrl: videoUrl.trim() || undefined,
      submitterName: submitterName.trim(),
      mobile: mobile.trim(),
      whatsapp: (whatsapp || mobile).trim(),
      email: email.trim() || undefined,
      consentGiven: true
    });

    // Also persist to server endpoint asynchronously
    fetch('/api/public-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: headline.trim(),
        description: description.trim(),
        district: currentDist.nameHi,
        submitterName: submitterName.trim(),
        mobile: mobile.trim()
      })
    }).catch(() => {});

    setSubmittedId(trackingId);
  };

  const handleClose = () => {
    setIsSubmitNewsOpen(false);
    setSubmittedId(null);
    setHeadline('');
    setDescription('');
    setSubmitterName('');
    setMobile('');
    setWhatsapp('');
    setEmail('');
    setImageUrl('');
    setVideoUrl('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-red-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black font-newspaper-headline flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <span>हुंकार जन-रिपोर्टर: अपनी खबर भेजें</span>
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              आपके गांव, ढाणी, शहर की समस्याओं और घटनाओं को बनाएं प्रमुख खबर
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-red-200 hover:text-white hover:bg-red-800"
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
                समाचार सफलतापूर्वक प्राप्त हुआ!
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto mb-4">
                आपकी खबर हुंकार 24 के न्यूज़ डेस्क को प्रेषित कर दी गई है। सत्यापन उपरांत इसे पोर्टल पर प्रकाशित किया जाएगा।
              </p>

              <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-lg inline-block border border-stone-200 dark:border-stone-700 font-mono font-bold text-red-700 dark:text-red-400 text-sm mb-6">
                ट्रैकिंग संदर्भ संख्या: {submittedId}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-lg bg-red-700 text-white font-bold text-sm hover:bg-red-800 transition-colors"
                >
                  बंद करें
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

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  खबर का मुख्य शीर्षक <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. सीकर के धोद में पेयजल संकट, ग्रामीणों ने दिया ज्ञापन..."
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* District, Tehsil, Village */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ज़िला <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  >
                    {RAJASTHAN_DISTRICTS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nameHi} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    तहसील / कस्बा
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. लक्ष्मणगढ़"
                    value={tehsil}
                    onChange={e => setTehsil(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    गांव / ढाणी / मोहल्ला
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. जाजोद"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  खबर का पूर्ण विवरण (क्या, कब, कहाँ और क्यों हुआ?) <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="पूरी घटना, समस्या या मांग का विस्तारपूर्वक उल्लेख करें..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Image URL & Video Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    तस्वीर URL (Image Link / Cloud Upload)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... फोटो का लिंक"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    वीडियो लिंक (YouTube / Instagram / Drive)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... वीडियो लिंक"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Submitter Details */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  संवाददाता / प्रेषक की जानकारी (गोपनीयता सुरक्षित रखी जाएगी)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      आपका शुभ नाम <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="नाम लिखें"
                      value={submitterName}
                      onChange={e => setSubmitterName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      मोबाइल नंबर <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10 अंकों का नंबर"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      व्हाट्सऐप नंबर (वैकल्पिक)
                    </label>
                    <input
                      type="tel"
                      placeholder="व्हाट्सऐप नंबर"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <label className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-600"
                />
                <span>
                  मैं प्रमाणित करता/करती हूँ कि मेरे द्वारा भेजी गई जानकारी सत्य एवं तथ्यपरक है। हुंकार 24 को इसे सत्यापित कर प्रकाशित करने का पूर्ण अधिकार है।
                </span>
              </label>

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
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>समाचार भेजें (Submit News)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
