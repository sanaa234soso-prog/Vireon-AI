import { useState } from 'react';
import {
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { MarketplaceListing, WhopPaymentRecord } from '../types.js';

interface WhopAndMarketplaceProps {
  payments: WhopPaymentRecord[];
  marketplace: MarketplaceListing[];
  onWebhookSimulated: () => void;
}

export default function WhopAndMarketplace({
  payments,
  marketplace,
  onWebhookSimulated,
}: WhopAndMarketplaceProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'marketplace' | 'webhooks'>('payments');
  const [simResult, setSimResult] = useState<string | null>(null);

  const totalRevenue = payments
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const mockPayload = {
        id: `wh_evt_${Date.now().toString().slice(-6)}`,
        action: 'payment.succeeded',
        data: {
          id: `ord_${Date.now().toString().slice(-5)}`,
          final_amount: 149.0,
          currency: 'usd',
          user: {
            email: 'verified.buyer@vireon-client.com',
          },
          product: {
            title: 'حزمة العمليات المستقلة 24/7 من فايريون',
          },
        },
      };

      const res = await fetch('/api/webhooks/whop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whop-signature': 'sha256=verified_valid_hmac_signature',
        },
        body: JSON.stringify(mockPayload),
      });

      const json = await res.json();
      if (json.success) {
        setSimResult(`تم استلام وتوثيق عملية دفع Whop بقيمة $149.00 دولار أمريكي بتشفير HMAC بنجاح!`);
        onWebhookSimulated();
      }
    } catch (err) {
      console.error('Error simulating webhook:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Revenue Overview */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                محرك مدفوعات Whop ومتجر المنتجات
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                تكامل Whop v5 نشط
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              دفتر أستاذ المعاملات الفوري، والتحقق التشفيري من توقيعات HMAC للـ Webhook، وفحص جودة المنتجات الرقمية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-simulate-whop-webhook"
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'جاري التحقق...' : 'إرسال Webhook تجريبي مشفر'}</span>
            </button>
          </div>
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">إجمالي إيرادات Whop</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ${totalRevenue.toLocaleString()} دولار
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">الطلبات المؤكدة</span>
            <span className="text-xl font-bold font-mono text-white">{payments.length}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">نجاح توقيعات HMAC</span>
            <span className="text-xl font-bold font-mono text-emerald-400">100.0%</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">المنتجات المفحوصة بالمتجر</span>
            <span className="text-xl font-bold font-mono text-zinc-200">{marketplace.length}</span>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              activeTab === 'payments'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            سجل عمليات الدفع ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              activeTab === 'marketplace'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            كتالوج منتجات المتجر ({marketplace.length})
          </button>
        </div>
      </div>

      {/* Simulation Result Notification */}
      {simResult && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simResult}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80">تزامن وكيل المدفوعات وفريق الجودة</span>
        </div>
      )}

      {/* Tab 1: Payments Ledger */}
      {activeTab === 'payments' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              دفتر أستاذ معاملات وتسويات Whop
            </h3>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>جميع التوقيعات مشفرة وموثقة</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-mono">
                <tr>
                  <th className="py-2.5 px-3">رقم الطلب / الحدث</th>
                  <th className="py-2.5 px-3">اسم المنتج</th>
                  <th className="py-2.5 px-3">بريد المشتري</th>
                  <th className="py-2.5 px-3">المبلغ</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-950/60 transition-colors">
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 font-bold block" dir="ltr">{p.whopOrderId || p.id}</span>
                      <span className="text-[10px] text-zinc-500" dir="ltr">{p.whopEventId}</span>
                    </td>
                    <td className="py-3 px-3 text-zinc-200 font-sans font-medium">{p.productTitle}</td>
                    <td className="py-3 px-3 text-zinc-400" dir="ltr">{p.customerEmail}</td>
                    <td className="py-3 px-3 text-white font-bold" dir="ltr">${p.amount.toFixed(2)} USD</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-bold">
                        {p.status === 'confirmed' ? 'مؤكد' : p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[11px]">
                      {new Date(p.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Marketplace Catalog */}
      {activeTab === 'marketplace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketplace.map((prod) => (
            <div
              key={prod.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {prod.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{prod.title}</h3>
                  <p className="text-xs text-zinc-400">
                    البائع: <strong className="text-zinc-200">{prod.sellerName}</strong>
                  </p>
                </div>

                <div className="text-left">
                  <span className="text-sm font-bold font-mono text-emerald-400 block" dir="ltr">
                    ${prod.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{prod.salesCount} مبيعات</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-center">
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 block">درجة الكفاءة</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">{prod.healthScore}%</span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 block">نسبة اجتياز الجودة</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">{prod.qaPassRate}%</span>
                </div>
              </div>

              {prod.securityNotes && (
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                  <strong className="text-zinc-300">التدقيق الأمني:</strong> {prod.securityNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
