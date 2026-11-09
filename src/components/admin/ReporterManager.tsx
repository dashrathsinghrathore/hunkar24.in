import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Mail, Phone, MapPin, Award } from 'lucide-react';
import { useNews } from '../../context/NewsContext';
import { RAJASTHAN_DISTRICTS } from '../../config/siteConfig';

export const ReporterManager: React.FC = () => {
  const { reporters, addReporter, updateReporter } = useNews();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'reporter' | 'editor'>('reporter');
  const [district, setDistrict] = useState('jaipur');
  const [tehsil, setTehsil] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    addReporter({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@hunkar24.in`,
      mobile: mobile.trim(),
      role,
      assignedDistrict: district,
      assignedTehsil: tehsil.trim() || undefined,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      status: 'active'
    });

    setShowAddModal(false);
    setName('');
    setEmail('');
    setMobile('');
  };

  const handleToggleStatus = (id: string, currentStatus: 'active' | 'inactive') => {
    updateReporter(id, { status: currentStatus === 'active' ? 'inactive' : 'active' });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <span>संवाददाता एवं रिपोर्टर नेटवर्क (Reporter Management)</span>
          </h2>
          <p className="text-xs text-stone-500">
            राजस्थान के सभी ज़िलों में तैनात हुंकार 24 के सत्यापित संवाददाताओं का प्रबंधन
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>नया रिपोर्टर जोड़ें</span>
        </button>
      </div>

      {/* Grid of Reporter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reporters.map(rep => {
          const distInfo = RAJASTHAN_DISTRICTS.find(d => d.id === rep.assignedDistrict);
          return (
            <div
              key={rep.id}
              className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rep.photoUrl}
                      alt={rep.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-red-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {rep.name}
                        </h4>
                        {rep.isVerified && (
                          <span title="सत्यापित आईडी">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        {rep.role}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    rep.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}>
                    {rep.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300 mt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>ज़िला: <strong>{distInfo ? distInfo.nameHi : rep.assignedDistrict}</strong> {rep.assignedTehsil ? `(${rep.assignedTehsil})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{rep.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{rep.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-stone-200 dark:border-stone-700 text-xs">
                <span className="font-semibold text-stone-500">
                  प्रकाशित समाचार: <strong className="text-stone-900 dark:text-stone-100">{rep.publishedArticleCount}</strong>
                </span>

                <button
                  onClick={() => handleToggleStatus(rep.id, rep.status)}
                  className="text-[11px] font-bold text-red-700 dark:text-red-400 hover:underline"
                >
                  {rep.status === 'active' ? 'निष्क्रिय करें' : 'सक्रिय करें'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Reporter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md border border-stone-200 dark:border-stone-800">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
              नया संवाददाता नामांकित करें
            </h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">संवाददाता का पूरा नाम *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">मोबाइल नंबर *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">ईमेल</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">ज़िला</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-2 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                  >
                    {RAJASTHAN_DISTRICTS.map(d => (
                      <option key={d.id} value={d.id}>{d.nameHi}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">तहसील</label>
                  <input
                    type="text"
                    value={tehsil}
                    onChange={e => setTehsil(e.target.value)}
                    placeholder="तहसील"
                    className="w-full px-2 py-2 border rounded-lg bg-stone-50 dark:bg-stone-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-700 text-white font-bold"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
