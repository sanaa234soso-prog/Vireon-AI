import { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Key,
  Database,
  GitBranch,
  CreditCard,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { IntegrationConfig, OwnerProfile } from '../types.js';

interface SecurityAndIntegrationsProps {
  integrations: IntegrationConfig[];
  owner: OwnerProfile;
  onRefresh: () => void;
}

export default function SecurityAndIntegrations({
  integrations,
  owner,
  onRefresh,
}: SecurityAndIntegrationsProps) {
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; message: string; latencyMs?: number };
  }>({});

  const handleTestConnection = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            success: data.data.success,
            message: data.data.message,
            latencyMs: data.data.latencyMs,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { success: false, message: data.error || 'فشل الاختبار' },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'خطأ في الاتصال' },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whop':
        return CreditCard;
      case 'github':
        return GitBranch;
      case 'database':
        return Database;
      default:
        return Server;
    }
  };

  return (
    <div className="space-y-6">
      {/* Zero Trust & Super Admin Security Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  خزنة الأمان الشامل Zero-Trust وتكاملات الخدمات
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  حماية مشددة على الخادم
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                جميع المفاتيح والرموز السرية معزولة ومشفرة ولا تُرسل مطلقاً إلى المتصفح.
              </p>
            </div>
          </div>

          {/* Owner Profile Badge */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-left sm:text-right">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">المالك والمسؤول الأعلى</span>
            <span className="text-xs font-bold text-white font-mono block" dir="ltr">{owner.email}</span>
            <span className="text-[10px] text-emerald-400 font-mono">الدور: مالك النظام (المصادقة الثنائية نشطة)</span>
          </div>
        </div>

        {/* Security Posture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">نموذج الصلاحيات RBAC</span>
            <span className="text-xs font-bold font-mono text-emerald-400">مالك أحادي / حظر الوصول العام</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">حجب الرموز والمفاتيح السرية</span>
            <span className="text-xs font-bold font-mono text-emerald-400">100% محمية عبر خادم البروكسي</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">بوابة العمليات عالية الخطورة</span>
            <span className="text-xs font-bold font-mono text-emerald-400">اعتماد يدوي تفاعلي إلزامي</span>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider px-1">
            الخدمات الخارجية والمفاتيح المتصلة
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((int) => {
            const Icon = getProviderIcon(int.provider);
            const isTesting = testingProvider === int.provider;
            const result = testResults[int.provider];

            return (
              <div
                key={int.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{int.name}</h4>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{int.provider}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      int.status === 'connected'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {int.status === 'connected' ? 'متصل وجاهز' : int.status}
                  </span>
                </div>

                {/* Masked Secret Key */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>قناع المفتاح السري:</span>
                    <span className="text-zinc-500">مشفر ومحمي</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300" dir="ltr">
                    {int.maskedKey}
                  </div>
                </div>

                {/* Required Setup Info */}
                <div className="text-[11px] font-mono text-zinc-500 space-y-1">
                  <span>متغيرات البيئة المطلوبة: {int.requiredFields.join(', ')}</span>
                </div>

                {/* Test Result Box if tested */}
                {result && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      result.success
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold font-mono">
                      {result.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>{result.success ? 'تم التحقق من الاتصال بنجاح' : 'تنبيه في الإعدادات'}</span>
                      {result.latencyMs && (
                        <span className="text-[10px] opacity-80" dir="ltr">({result.latencyMs}ms)</span>
                      )}
                    </div>
                    <p className="font-sans leading-relaxed text-[11px]">{result.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <a
                    href={int.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <span>توثيق المطورين</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    id={`btn-test-integration-${int.provider}`}
                    onClick={() => handleTestConnection(int.provider)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
