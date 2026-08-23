import React, { useState, useEffect } from 'react';
import {
  Brain,
  RefreshCw,
  MessageSquare,
  Share2,
  Tag,
  Send,
  CheckCircle2,
  Search,
  Sparkles,
} from 'lucide-react';
import { AgentMemoryEntry, AgentMessageRecord } from '../types.js';

export default function AgentMemoryBusView() {
  const [entries, setEntries] = useState<AgentMemoryEntry[]>([]);
  const [messages, setMessages] = useState<AgentMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [targetAgent, setTargetAgent] = useState('manager');
  const [senderAgent, setSenderAgent] = useState('architect');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const [entriesRes, msgRes] = await Promise.allSettled([
        fetch('/api/memory/entries'),
        fetch('/api/memory/messages?limit=50'),
      ]);

      if (entriesRes.status === 'fulfilled' && entriesRes.value.ok) {
        const data = await entriesRes.value.json();
        if (data.success && data.data) {
          setEntries(data.data);
        }
      }

      if (msgRes.status === 'fulfilled' && msgRes.value.ok) {
        const data = await msgRes.value.json();
        if (data.success && data.data) {
          setMessages(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching agent memory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
    const interval = setInterval(fetchMemory, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setNotification(null);
    try {
      const res = await fetch('/api/memory/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgent: senderAgent,
          toAgent: targetAgent,
          message: newMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        setNotification({
          message: `تم إرسال الرسالة إلى الذاكرة المشتركة للوكيل ${targetAgent.toUpperCase()} وتخزينها بنجاح!`,
          type: 'success',
        });
        fetchMemory();
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'خطأ في إرسال الرسالة', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const content = (e.content || '').toLowerCase();
    const agent = (e.authorAgent || e.sourceAgent || '').toLowerCase();
    const title = (e.title || '').toLowerCase();
    const tags = Array.isArray(e.tags) ? e.tags : [];
    const search = searchFilter.toLowerCase();
    return (
      content.includes(search) ||
      agent.includes(search) ||
      title.includes(search) ||
      tags.some((t) => (t || '').toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                الذاكرة المشتركة وقناة تواصل الوكلاء (Shared Memory & Agent Bus)
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono">
                  {entries.length} سجلات معرفية
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                تنسيق جماعي فوري بين الوكلاء الـ 14 وتبادل السياق والقرارات والمهام المعقدة بدون فقدان للذاكرة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-memory"
            onClick={fetchMemory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث الذاكرة
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-zinc-300"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge & Context Entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              السبورة المركزية وسجلات المعرفة المشتركة (Blackboard Memory)
            </h3>
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-2.5" />
              <input
                type="text"
                placeholder="بحث في الذاكرة..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pr-8 pl-2 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/50">
                    الوكيل: {(entry.authorAgent || entry.sourceAgent || 'AGENT').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(entry.createdAt || entry.timestamp || Date.now()).toLocaleTimeString('ar-EG')}
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-sans">{entry.content}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entry.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-cyan-400 ml-auto">
                    {entry.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Inter-Agent Messages & Dispatcher */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            حوارات الوكلاء المباشرة (Direct Agent-to-Agent Bus)
          </h3>

          {/* Dispatcher Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">الوكيل المرسل:</label>
                <select
                  value={senderAgent}
                  onChange={(e) => setSenderAgent(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                >
                  <option value="architect">كبير مهندسي النظم (Architect)</option>
                  <option value="manager">المدير العام المنسق (Manager)</option>
                  <option value="devops">مهندس النشر والعمليات (DevOps)</option>
                  <option value="frontend">مهندس ومصمم الواجهات (Frontend)</option>
                  <option value="security">حارس الأمان والامتثال (Security)</option>
                  <option value="qa">حارس الجودة الآلي (QA)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">الوكيل المستهدف:</label>
                <select
                  value={targetAgent}
                  onChange={(e) => setTargetAgent(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                >
                  <option value="manager">المدير العام المنسق (Manager)</option>
                  <option value="developer">المطور البرمجي الشامل (Developer)</option>
                  <option value="frontend">مهندس ومصمم الواجهات (Frontend)</option>
                  <option value="devops">مهندس النشر والعمليات (DevOps)</option>
                  <option value="qa">حارس الجودة الآلي (QA)</option>
                  <option value="payments">مسؤول مدفوعات Whop (Payments)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">الرسالة / الأمر البرمجي في القناة المشتركة:</label>
              <textarea
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="أدخل رسالة التنسيق بين الوكلاء..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'جاري الإرسال...' : 'بث الرسالة في قناة الوكلاء المشتركة'}</span>
            </button>
          </form>

          {/* Messages Stream */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{msg.fromAgent.toUpperCase()}</span>
                    <span className="text-zinc-500">➜</span>
                    <span className="font-mono font-bold text-cyan-400">{msg.toAgent.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString('ar-EG')}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
