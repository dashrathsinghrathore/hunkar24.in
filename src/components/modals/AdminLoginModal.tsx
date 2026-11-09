import React, { useState } from 'react';
import { X, Shield, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useNews } from '../../context/NewsContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const { setAdminUser } = useNews();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('कृपया अधिकृत पासवर्ड दर्ज करें');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'अमान्य क्रेडेंशियल्स');
          setIsLoading(false);
          return;
        }

        if (data.token) {
          sessionStorage.setItem('hunkar24_admin_token', data.token);
        }
        setAdminUser(data.user || { id: 'usr-admin-01', name: 'प्रशासक', role: 'super_admin' });
        onLoginSuccess();
        onClose();
        return;
      }

      // Netlify / Static hosting fallback verification
      if (password.trim() === 'jaimaakarni86') {
        const token = `hunkar24-admin-${Date.now()}`;
        sessionStorage.setItem('hunkar24_admin_token', token);
        setAdminUser({ id: 'usr-admin-01', name: 'प्रशासक', role: 'super_admin', email: 'admin@hunkar24.in', avatarUrl: '' });
        onLoginSuccess();
        onClose();
      } else {
        setError('अमान्य पासवर्ड। कृपया सही प्रशासक पासवर्ड दर्ज करें।');
      }
    } catch {
      if (password.trim() === 'jaimaakarni86') {
        const token = `hunkar24-admin-${Date.now()}`;
        sessionStorage.setItem('hunkar24_admin_token', token);
        setAdminUser({ id: 'usr-admin-01', name: 'प्रशासक', role: 'super_admin', email: 'admin@hunkar24.in', avatarUrl: '' });
        onLoginSuccess();
        onClose();
      } else {
        setError('सर्वर प्रमाणीकरण में त्रुटि। कृपया पासवर्ड जांचें।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 overflow-hidden text-white">
        <div className="bg-stone-950 p-6 text-center border-b border-stone-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800/60 text-red-500 mx-auto flex items-center justify-center mb-2">
            <Shield className="w-5 h-5" />
          </div>
          <BrandLogo variant="splash" showTagline={false} className="justify-center mb-1" />
          <h3 className="text-sm font-bold text-stone-200 mt-1">
            प्रशासनिक नियंत्रण कक्ष प्रमाणीकरण
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-300 mb-1.5">
                प्रशासक पासवर्ड (Administrator Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  disabled={isLoading}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="सुरक्षित पासवर्ड दर्ज करें"
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-hidden focus:border-red-600 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-3 text-stone-500 hover:text-stone-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:bg-stone-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>सत्यापित किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <span>प्रवेश करें</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
