import React, { useState, useEffect } from 'react';
import { useApp, AppRole } from '../context/AppContext';
import { SCHOOL_INFO } from '../data/initialData';
import {
  BookOpen,
  Bell,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Volume2,
  VolumeX,
  Sparkles,
  School,
  Clock,
  Radio,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    soundOn,
    setSoundOn,
    testSound,
    reports,
    selectedHomeroomClass,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate unaddressed alerts count for homeroom tab
  const unaddressedCount = reports.filter(
    (r) =>
      !r.addressedByHomeroom &&
      r.behavior !== 'normal' &&
      (selectedHomeroomClass === 'all' || r.className === selectedHomeroomClass)
  ).length;

  const navItems: { id: AppRole; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'teacher',
      label: 'יומן שיעור מהיר',
      icon: <BookOpen className="w-4 h-4 ml-1.5" />,
    },
    {
      id: 'homeroom',
      label: 'לוח מחנכות בזמן אמת',
      icon: <Bell className="w-4 h-4 ml-1.5" />,
      badge: unaddressedCount > 0 ? unaddressedCount : undefined,
    },
    {
      id: 'behavior_reports',
      label: 'הפקת דוחות התנהגות',
      icon: <FileText className="w-4 h-4 ml-1.5" />,
    },
    {
      id: 'parent',
      label: 'פורטל הורים ותלמידים',
      icon: <UserCheck className="w-4 h-4 ml-1.5" />,
    },
    {
      id: 'pedagogical',
      label: 'תיק תלמיד וישיבות פדגוגיות',
      icon: <Sparkles className="w-4 h-4 ml-1.5" />,
    },
    {
      id: 'excel',
      label: 'ניהול מסד נתונים ואקסל',
      icon: <FileSpreadsheet className="w-4 h-4 ml-1.5" />,
    },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-indigo-900/50 sticky top-0 z-40">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/30">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -left-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Rubik']">
                  עמ"ט <span className="text-cyan-400">Live</span>
                </h1>
                <span className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                  עתודה מדעית טכנולוגית (STEM)
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  שידור חי
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <School className="w-3.5 h-3.5 text-cyan-400" />
                <span>{SCHOOL_INFO.name}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-300">סמל מוסד: {SCHOOL_INFO.institutionSymbol}</span>
                <span className="text-slate-400">|</span>
                <span className="text-cyan-300 font-medium">{SCHOOL_INFO.academicYear}</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Clock & Sound Chime */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime || '00:00:00'}</span>
            </div>

            {/* Sound Toggle & Test */}
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setSoundOn(!soundOn)}
                title={soundOn ? 'השתק צלצול התראות' : 'הפעל צלצול התראות'}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                  soundOn
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {soundOn ? (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>צלצול פעיל</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span>מושתק</span>
                  </>
                )}
              </button>

              {soundOn && (
                <button
                  onClick={testSound}
                  title="בדיקת צליל פעמון התראה"
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 rounded transition-colors"
                >
                  בדיקה 🔔
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-950/70 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentRole === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentRole(item.id)}
                className={`relative flex items-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="mr-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-white bg-rose-600 rounded-full animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
