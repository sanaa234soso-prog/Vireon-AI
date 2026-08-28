import { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Shield,
  Monitor,
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallPwaModal({ isOpen, onClose }: InstallPwaModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect if already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Auto-detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActiveDeviceTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveDeviceTab('android');
    } else {
      setActiveDeviceTab('desktop');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>تثبيت تطبيق فايريون</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PWA APP
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                احصل على تجربة تطبيق هاتف وجهاز مكتبي أصلية وسريعة بملء الشاشة.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-zinc-200 font-bold block text-[11px]">سرعة فائقة</span>
            <span className="text-[10px] text-zinc-500 font-mono">تشغيل فوري</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <Smartphone className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-zinc-200 font-bold block text-[11px]">شاشة كاملة</span>
            <span className="text-[10px] text-zinc-500 font-mono">بدون أشرطة متصفح</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <Shield className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-zinc-200 font-bold block text-[11px]">مراقبة 24/7</span>
            <span className="text-[10px] text-zinc-500 font-mono">تنبيهات فورية</span>
          </div>
        </div>

        {/* If Native Browser Install is Available */}
        {deferredPrompt && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 text-center space-y-2.5">
            <span className="text-xs font-bold text-emerald-300 block">
              متصفحك يدعم التثبيت المباشر بنقرة واحدة!
            </span>
            <button
              onClick={handleNativeInstall}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق على جهازك الآن</span>
            </button>
          </div>
        )}

        {/* Device Switcher Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-center p-1 bg-zinc-950 rounded-xl border border-zinc-800 gap-1">
            <button
              onClick={() => setActiveDeviceTab('ios')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeDeviceTab === 'ios'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              آيفون / آيباد (iOS)
            </button>
            <button
              onClick={() => setActiveDeviceTab('android')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeDeviceTab === 'android'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              أندرويد (Android)
            </button>
            <button
              onClick={() => setActiveDeviceTab('desktop')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeDeviceTab === 'desktop'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكمبيوتر (PC / Mac)
            </button>
          </div>

          {/* Instructions Content */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3 text-xs leading-relaxed">
            {activeDeviceTab === 'ios' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-white font-medium">افتح الموقع في متصفح سفاري (Safari).</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-medium">اضغط على زر المشاركة</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                      <Share className="w-3 h-3 text-blue-400" /> Share
                    </span>
                    <span className="text-zinc-400">في أسفل الشاشة.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-medium">اختر</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold">
                      <PlusSquare className="w-3 h-3 text-emerald-400" /> إضافة إلى الشاشة الرئيسية (Add to Home Screen)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeDeviceTab === 'android' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-white font-medium">افتح الموقع في متصفح كروم (Chrome).</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="text-white font-medium">اضغط على القائمة (الثلاث نقاط) أعلى المتصفح.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-medium">اختر</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold">
                      <Download className="w-3 h-3 text-emerald-400" /> تثبيت التطبيق (Install App)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeDeviceTab === 'desktop' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-white font-medium">في متصفح Chrome أو Edge على الكمبيوتر.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-medium">اضغط على أيقونة التثبيت</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                      <Monitor className="w-3 h-3 text-emerald-400" /> في شريط العنوان أعلى المتصفح
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="text-white font-medium">سيفتح التطبيق كنافذة مستقلة فائقة السرعة على سطح المكتب.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500">
            {isInstalled ? '✅ التطبيق مثبت ويعمل في وضع Standalone' : 'آمن ومشفر 100% • خفيف الوزن'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
