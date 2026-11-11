import React from 'react';
import { useApp } from '../context/AppContext';
import { getWhatsAppShareUrl } from '../utils/whatsapp';
import {
  AlertTriangle,
  Sparkles,
  X,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  Volume2,
} from 'lucide-react';

export const RealTimeAlertBanner: React.FC = () => {
  const { latestAlert, clearLatestAlert, toggleAddressed, setCurrentRole, setSelectedHomeroomClass, session } =
    useApp();

  // Strict privacy rule: Real-time discipline alerts are strictly for authenticated staff members (never parents)
  if (!session || !latestAlert) return null;

  // Homeroom teachers only see alerts for their assigned class; Admins see all
  if (session.role === 'homeroom' && session.homeroomClass !== latestAlert.className && !session.isDualRole) {
    return null;
  }

  const isExcellence = latestAlert.behavior === 'excellence';
  const whatsappUrl = getWhatsAppShareUrl(latestAlert);

  const handleGoToHomeroom = () => {
    setSelectedHomeroomClass(latestAlert.className);
    setCurrentRole('homeroom');
    clearLatestAlert();
  };

  const handleMarkHandled = () => {
    toggleAddressed(latestAlert.id);
    clearLatestAlert();
  };

  return (
    <aside
      aria-label="התראת מורה בזמן אמת"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div
        className={`rounded-2xl shadow-2xl p-4 border backdrop-blur-xl ${
          isExcellence
            ? 'bg-gradient-to-br from-amber-950/95 via-slate-900/95 to-emerald-950/95 border-amber-500/40 text-white'
            : 'bg-gradient-to-br from-rose-950/95 via-slate-900/95 to-slate-900/95 border-rose-500/50 text-white'
        }`}
      >
        {/* Header line */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                isExcellence
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40 animate-pulse'
              }`}
            >
              {isExcellence ? (
                <Sparkles className="w-5 h-5 text-amber-300" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  התראת מורה בזמן אמת (Live)
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  צלצול הופעל
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                שיעור {latestAlert.subject} | שעה {latestAlert.lessonPeriod} | מורה:{' '}
                {latestAlert.teacherName}
              </p>
            </div>
          </div>
          <button
            onClick={clearLatestAlert}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="סגור התראה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student & Incident Details */}
        <div className="my-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-white">
              {latestAlert.studentName}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              כיתה {latestAlert.className} (מחנכת: {latestAlert.homeroomTeacher})
            </span>
          </div>

          {/* Full description */}
          <div className="mt-2 p-2.5 bg-black/40 rounded-xl border border-white/10 text-sm text-slate-200 leading-relaxed font-sans">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">
              {isExcellence ? '🌟 פירוט המצוינות:' : '⚠️ פירוט האירוע המדויק מהמורה:'}
            </div>
            <p className="font-medium whitespace-pre-wrap">{latestAlert.description || 'ללא פירוט'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 flex-wrap">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>שלח וואטסאפ להורה</span>
          </a>

          <button
            onClick={handleGoToHomeroom}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>לוח מחנכת</span>
          </button>

          <button
            onClick={handleMarkHandled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>סמן כטופל</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
