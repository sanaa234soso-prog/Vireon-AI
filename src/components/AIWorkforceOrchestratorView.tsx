import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Send,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Target,
  Sparkles,
  Bot
} from 'lucide-react';
import { WorkforceTeam, CrossTeamMission, AgentProfile } from '../types.js';

interface Props {
  agents: AgentProfile[];
  onOpenCommandTerminal?: () => void;
}

export default function AIWorkforceOrchestratorView({ agents }: Props) {
  const [teams, setTeams] = useState<WorkforceTeam[]>([]);
  const [missions, setMissions] = useState<CrossTeamMission[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<WorkforceTeam | null>(null);
  const [selectedMission, setSelectedMission] = useState<CrossTeamMission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchPrompt, setDispatchPrompt] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchTeamsAndMissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams || []);
        setMissions(data.missions || []);
        if (data.teams?.length > 0 && !selectedTeam) {
          setSelectedTeam(data.teams[0]);
        }
        if (data.missions?.length > 0 && !selectedMission) {
          setSelectedMission(data.missions[0]);
        }
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndMissions();
  }, []);

  const handleDispatchMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchPrompt.trim()) return;

    setIsDispatching(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/manager/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: dispatchPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          text: 'تم استلام المبادرة وتوزيعها بين الفرق بنجاح بواسطة AI CTO / Orchestrator.',
          type: 'success',
        });
        setDispatchPrompt('');
        fetchTeamsAndMissions();
      } else {
        setFeedbackMsg({ text: data.error || 'تعذر توزيع المبادرة', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-workforce-orchestrator">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                AI CTO & Master Orchestrator Engine
              </span>
              <span className="text-xs text-slate-400">10 فرق متكاملة • 14 وكيلاً نشطاً • تعاون لحظي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              خادم إدارة وتنسيق قوى الذكاء الاصطناعي (AI Workforce)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              يقوم الخادم المركزي بتوزيع المهام المعقدة، إدارة التسليم التبادلي بين الفرق (Handoffs)، ومزامنة الجهود بين التطوير والمعمارية والأمان والجودة لضمان تشغيل ومراقبة جميع التطبيقات بأعلى موثوقية.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchTeamsAndMissions}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              تحديث الفرق
            </button>
          </div>
        </div>

        {/* AI CTO Quick Dispatch Bar */}
        <form onSubmit={handleDispatchMission} className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Bot className="w-4 h-4 text-emerald-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
            <input
              type="text"
              value={dispatchPrompt}
              onChange={(e) => setDispatchPrompt(e.target.value)}
              placeholder="وجّه مبادرة فنية أو مهمة كبرى للـ AI CTO لتوزيعها تلقائياً بين الفرق المختصة..."
              className="w-full ps-10 pe-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={isDispatching || !dispatchPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-900/30 shrink-0"
          >
            {isDispatching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            توجيه المبادرة للفرق
          </button>
        </form>

        {feedbackMsg && (
          <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Grid: 10 Cross-Functional Teams */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            الفرق المتكاملة العاملة كوحدة واحدة (Cross-Functional Teams)
          </h2>
          <span className="text-xs text-slate-400">10 فرق متخصصة مترابطة عبر خطوط تسليم تلقائية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {teams.map((team) => {
            const isSelected = selectedTeam?.id === team.id;
            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {team.nameEn}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {team.slaResponseTimeSec}s SLA
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{team.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {team.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{team.memberAgentIds.length} وكيل</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-medium">صحة {team.healthScore}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Details & Active Cross-Team Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selected Team Deep Dive */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          {selectedTeam ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs text-emerald-400 font-mono font-medium">{selectedTeam.nameEn}</span>
                  <h3 className="text-base font-bold text-white">{selectedTeam.name}</h3>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  معدل الاستجابة {selectedTeam.slaResponseTimeSec} ثانية
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">المسؤوليات الأساسية:</h4>
                <ul className="space-y-1.5">
                  {selectedTeam.responsibilities.map((resp, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">الوكلاء المنتسبون للفريق:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTeam.memberAgentIds.map((agentId) => {
                    const agentProfile = agents.find((a) => a.id === agentId);
                    return (
                      <div key={agentId} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {agentId.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{agentProfile?.name || agentId}</p>
                          <p className="text-[10px] text-slate-400 truncate">{agentProfile?.title || 'وكيل تشغيلي'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedTeam.lastHandoff && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-indigo-500/20 space-y-1">
                  <div className="flex items-center justify-between text-xs text-indigo-400">
                    <span className="font-semibold flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5" />
                      آخر تسليم تبادلي (Handoff)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(selectedTeam.lastHandoff.timestamp).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    من الوكيل <span className="text-white font-mono">{selectedTeam.lastHandoff.fromAgent}</span> إلى <span className="text-white font-mono">{selectedTeam.lastHandoff.toAgent}</span>: "{selectedTeam.lastHandoff.mission}"
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              اختر فريقاً لعرض تفاصيله وأعضائه
            </div>
          )}
        </div>

        {/* Right: Active Cross-Team Missions */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              المبادرات المشتركة النشطة (Active Cross-Team Missions)
            </h3>
            <span className="text-xs text-slate-400">{missions.length} مبادرة جارية</span>
          </div>

          <div className="space-y-3.5">
            {missions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedMission?.id === mission.id
                    ? 'bg-slate-950 border-indigo-500/60 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {mission.priority}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{mission.appName}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    الإنجاز: {mission.progressPercent}%
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1">{mission.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{mission.objective}</p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${mission.progressPercent}%` }}
                  />
                </div>

                {/* Milestones & Handoff trail preview */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>المحطة الحالية: <span className="text-slate-200 font-medium">{mission.currentMilestone}</span></span>
                    <span className="text-indigo-400 font-mono text-[11px]">{mission.involvedTeamIds.length} فرق مشاركة</span>
                  </div>

                  {/* Handoff logs */}
                  {mission.handOffLogs?.length > 0 && (
                    <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        سلسلة التعاون والتسليم المشترك:
                      </p>
                      {mission.handOffLogs.slice(-2).map((log, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="font-mono text-emerald-400">{log.fromAgent}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="font-mono text-indigo-400">{log.toAgent}</span>
                          <span className="text-slate-400 truncate">({log.handoffNotes})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
