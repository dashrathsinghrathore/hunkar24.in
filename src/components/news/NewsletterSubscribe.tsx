import React, { useState } from 'react';
import { Mail, CheckCircle2, Bell, Shield, Sparkles, Send } from 'lucide-react';

export const NewsletterSubscribe: React.FC = () => {
  const [email, setEmail] = useState('');
  const [selectedEdition, setSelectedEdition] = useState<'all' | 'morning' | 'jobs'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('hunkar24_newsletter_subscribed') === 'true';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('कृपया एक वैध ईमेल पता दर्ज करें (उदा. yourname@example.com)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to server endpoint if available
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          edition: selectedEdition,
          subscribedAt: new Date().toISOString()
        })
      }).catch(() => {
        // Graceful fallback for static/Netlify hosting
      });

      // Save locally
      localStorage.setItem('hunkar24_newsletter_subscribed', 'true');
      localStorage.setItem('hunkar24_subscriber_email', email.trim());
      setIsSubscribed(true);
      setEmail('');
    } catch {
      localStorage.setItem('hunkar24_newsletter_subscribed', 'true');
      setIsSubscribed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="my-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-red-950 text-white border border-stone-800 shadow-xl">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 md:p-10 max-w-4xl mx-auto text-center">
        {/* Brand badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/40 border border-red-700/60 text-red-300 text-xs font-bold mb-4 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>हुंकार 24 डिजिटल न्यूज़लेटर सेवा</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-newspaper-headline text-stone-100 leading-tight mb-3">
          दिनभर की बड़ी खबरें, सीधे आपके इनबॉक्स में!
        </h2>

        <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed mb-6">
          राजस्थान की निष्पक्ष आवाज़, ब्रेकिंग न्यूज़, सरकारी योजनाएं एवं भर्ती अलर्ट। हर सुबह और शाम का 3 मिनट का त्वरित समाचार बुलेटिन।
        </p>

        {isSubscribed ? (
          <div className="bg-emerald-950/60 border border-emerald-700/70 rounded-xl p-5 max-w-lg mx-auto flex items-center gap-3 text-left">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-200">
                आपकी सदस्यता सक्रिय है! (Subscribed Successfully)
              </h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                हुंकार 24 का दैनिक न्यूज़ बुलेटिन आपके ईमेल पर भेजा जाएगा। हमारे साथ जुड़ने के लिए धन्यवाद!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            {/* Edition Choice Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-stone-400 font-medium mr-1">पसंदीदा बुलेटिन:</span>
              <button
                type="button"
                onClick={() => setSelectedEdition('all')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  selectedEdition === 'all'
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                सभी समाचार (दैनिक 2 बार)
              </button>
              <button
                type="button"
                onClick={() => setSelectedEdition('morning')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  selectedEdition === 'morning'
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                प्रातःकालीन मुख्य खबरें (7 AM)
              </button>
              <button
                type="button"
                onClick={() => setSelectedEdition('jobs')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  selectedEdition === 'jobs'
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                शिक्षा, नौकरी व योजनाएं
              </button>
            </div>

            {/* Input & Subscribe Button */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="अपना ईमेल पता दर्ज करें (उदा. rahul@gmail.com)"
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/90 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950 cursor-pointer shrink-0"
              >
                {isSubmitting ? (
                  <span>दर्ज हो रहा है...</span>
                ) : (
                  <>
                    <span>मुफ्त सदस्यता लें</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 text-left font-medium">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400 pt-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% नि:शुल्क एवं सुरक्षित</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>कभी भी अनसब्सक्राइब करें</span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
