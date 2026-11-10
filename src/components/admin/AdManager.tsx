import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Power,
  ExternalLink,
  Eye,
  MousePointerClick,
  Calendar,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { AdPlacement, AdvertisementCampaign } from '../../types';

export const AdManager: React.FC = () => {
  const { advertisements, addAdvertisement, toggleAdStatus, deleteAdvertisement } = useNews();

  const [showAddModal, setShowAddModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [placement, setPlacement] = useState<AdPlacement>('homepage_top');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [pricingInr, setPricingInr] = useState(10000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('2026-12-31');
  const [showPreview, setShowPreview] = useState(false);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const totalImpressions = advertisements.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = advertisements.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const totalRevenue = advertisements.reduce((acc, a) => acc + (a.pricingInr || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim() || !imageUrl.trim() || !targetUrl.trim()) return;

    addAdvertisement({
      campaignTitle: campaignTitle.trim(),
      advertiserName: advertiserName.trim() || 'अधिकृत विज्ञापनदाता',
      placement,
      imageUrl: imageUrl.trim(),
      targetUrl: targetUrl.trim(),
      desktopVisible: true,
      mobileVisible: true,
      status: 'active',
      startDate,
      endDate,
      pricingInr,
      paymentStatus: 'completed',
      approved: true,
      createdByAdmin: true,
      isDemo: false
    });

    // Also persist to server if server is running
    fetch('/api/ads/manage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('hunkar24_admin_token') || ''}`
      },
      body: JSON.stringify({
        action: 'create',
        ad: {
          campaignTitle: campaignTitle.trim(),
          advertiserName: advertiserName.trim() || 'अधिकृत विज्ञापनदाता',
          placement,
          imageUrl: imageUrl.trim(),
          targetUrl: targetUrl.trim(),
          startDate,
          endDate,
          pricingInr
        }
      })
    }).catch(() => {});

    setShowAddModal(false);
    setCampaignTitle('');
    setAdvertiserName('');
    setImageUrl('');
    setTargetUrl('');
    setShowPreview(false);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" />
            <span>विज्ञापन एवं प्रायोजन नियंत्रण केंद्र (Ad & Monetization Suite)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            समस्त डेमो/डिफ़ॉल्ट विज्ञापन हटा दिए गए हैं। केवल प्रशासक द्वारा निर्मित व सक्रिय विज्ञापन ही सार्वजनिक वेबसाइट पर प्रदर्शित होंगे।
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setShowPreview(false);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>नया विज्ञापन बनाएं</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
          <span className="text-xs font-bold text-stone-500 block mb-1">कुल सक्रिय विज्ञापन इम्प्रेशन</span>
          <div className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>{(totalImpressions ?? 0).toLocaleString('hi-IN')}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
          <span className="text-xs font-bold text-stone-500 block mb-1">कुल पाठक क्लिक्स</span>
          <div className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-emerald-600" />
            <span>{(totalClicks ?? 0).toLocaleString('hi-IN')}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
          <span className="text-xs font-bold text-stone-500 block mb-1">सक्रिय अभियान कुल मूल्य</span>
          <div className="text-xl font-mono font-bold text-emerald-600 flex items-center gap-1">
            <span>₹{(totalRevenue ?? 0).toLocaleString('hi-IN')}</span>
          </div>
        </div>
      </div>

      {/* Advertisements List */}
      {advertisements.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-stone-900/50">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
            सभी डिफ़ॉल्ट एवं डेमो विज्ञापन सफलतापूर्वक हटा दिए गए हैं
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
            सार्वजनिक वेबसाइट पर कोई भी प्लेसहोल्डर या फ़र्ज़ी विज्ञापन नहीं दिखेगा। नया वास्तविक विज्ञापन लाइव करने के लिए ऊपर &quot;नया विज्ञापन बनाएं&quot; बटन पर क्लिक करें।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {advertisements.map(ad => (
            <div
              key={ad.id}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={ad.imageUrl}
                  alt=""
                  className="w-24 h-14 object-cover rounded-lg border border-stone-200 dark:border-stone-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                      {ad.placement}
                    </span>
                    <span className="text-xs text-stone-500">प्रायोजक: {ad.advertiserName}</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {ad.campaignTitle}
                  </h4>
                  <a
                    href={ad.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span className="truncate max-w-xs">{ad.targetUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="font-mono font-bold block">
                    {(ad.impressions ?? 0).toLocaleString('hi-IN')} दृश्य
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">{ad.clicks || 0} क्लिक्स</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">
                    ₹{(ad.pricingInr ?? 0).toLocaleString('hi-IN')}
                  </span>
                  <span className="text-[10px] text-stone-400">{ad.endDate} तक</span>
                </div>

                <button
                  onClick={() => toggleAdStatus(ad.id)}
                  className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    ad.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                  title={ad.status === 'active' ? 'विज्ञापन रोकें (Pause)' : 'विज्ञापन सक्रिय करें (Resume)'}
                >
                  <Power className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteAdvertisement(ad.id)}
                  className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="विलोपित करें (Delete)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Ad Modal with Live Preview */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-xl border border-stone-200 dark:border-stone-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                नया अधिकृत विज्ञापन बनाएं
              </h3>
              <span className="text-[11px] text-stone-500 font-mono">
                प्रशासक सत्यापन आवश्यक
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                  अभियान का शीर्षक (Campaign Title) *
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={e => setCampaignTitle(e.target.value)}
                  placeholder="उदा. श्री करणी स्किल सेंटर - नवीन सत्र प्रवेश"
                  className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    विज्ञापनदाता का नाम (Advertiser Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={advertiserName}
                    onChange={e => setAdvertiserName(e.target.value)}
                    placeholder="उदा. करणी एजुकेशन सोसाइटी"
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    प्रदर्शन स्थान (Placement) *
                  </label>
                  <select
                    value={placement}
                    onChange={e => setPlacement(e.target.value as AdPlacement)}
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-semibold"
                  >
                    <option value="homepage_top">होमपेज शीर्ष बैनर (Homepage Top)</option>
                    <option value="before_feed">समाचार फीड से पूर्व (Before News Feed)</option>
                    <option value="between_cards">समाचार कार्डों के मध्य (Between Cards)</option>
                    <option value="article_banner">समाचार लेख बैनर (Article Page Banner)</option>
                    <option value="category_banner">श्रेणी पृष्ठ बैनर (Category Page Banner)</option>
                    <option value="sidebar">साइडबार बैनर (Sidebar Banner)</option>
                    <option value="mobile_sticky">मोबाइल बॉटम स्टिकी (Mobile Placement)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">
                    बैनर पोस्टर इमेज (Image URL / Upload) *
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 cursor-pointer font-bold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>डिवाइस से अपलोड करें</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://... या ऊपर दिए अपलोड बटन से चुनें"
                  className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                  गंतव्य लिंक (Target Destination URL) *
                </label>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://wa.me/... या वेबसाइट URL"
                  className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    प्रारंभ तिथि (Start Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    समाप्ति तिथि (Expiry Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    शुल्क (Pricing ₹)
                  </label>
                  <input
                    type="number"
                    value={pricingInr}
                    onChange={e => setPricingInr(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-mono"
                  />
                </div>
              </div>

              {/* Live Preview Toggle & Box */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(prev => !prev)}
                  className="text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 cursor-pointer mb-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? 'लाइव पूर्वावलोकन छुपाएं' : 'प्रकाशन पूर्व लाइव पूर्वावलोकन (Preview)'}</span>
                </button>

                {showPreview && imageUrl && (
                  <div className="p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950">
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                      <span>विज्ञापन / SPONSORED</span>
                      <span>{advertiserName || 'प्रायोजक'}</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden h-24 border border-stone-200 dark:border-stone-800 bg-stone-900">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 text-white">
                        <span className="text-xs font-bold truncate">{campaignTitle || 'विज्ञापन शीर्षक'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold cursor-pointer transition-colors shadow-sm"
                >
                  विज्ञापन सुरक्षित एवं लाइव करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
