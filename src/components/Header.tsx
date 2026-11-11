import React, { useState, useEffect } from 'react';
import { useApp, AppRole } from '../context/AppContext';
import { SCHOOL_INFO } from '../data/initialData';
import { LoginModal } from './LoginModal';
import {
  BookOpen,
  Bell,
  UserCheck,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  School,
  Clock,
  Radio,
  LogOut,
  KeyRound,
  RotateCw,
  Lock,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    session,
    logout,
    switchDualMode,
    adminSettings,
    soundOn,
    setSoundOn,
    testSound,
    reports,
    selectedHomeroomClass,
    isLoginModalOpen,
    setIsLoginModalOpen,
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
  const normalizeClass = (cls?: string) => (cls || '').replace(/['"`״\s]/g, '').trim().toLowerCase();
  const unaddressedCount = reports.filter((r) => {
    if (r.addressedByHomeroom || r.behavior === 'normal') return false;
    if (session?.role === 'homeroom' && session?.homeroomClass) {
      return (
        r.className === session.homeroomClass ||
        normalizeClass(r.className) === normalizeClass(session.homeroomClass) ||
        (session.name && r.homeroomTeacher?.includes(session.name))
      );
    }
    return selectedHomeroomClass === 'all' || normalizeClass(r.className) === normalizeClass(selectedHomeroomClass);
  }).length;

  // Build navigation items based on current session and role
  const navItems: { id: AppRole; label: string; icon: React.ReactNode; badge?: number; requiresAuth?: boolean }[] = [];

  if (session?.role === 'admin') {
    navItems.push(
      {
        id: 'admin',
        label: '👑 ניהול מערכת והגדרות',
        icon: <ShieldCheck className="w-4 h-4 ml-1.5 text-amber-400" />,
      },
      {
        id: 'teacher',
        label: 'יומן שיעור מהיר (מורה)',
        icon: <BookOpen className="w-4 h-4 ml-1.5" />,
      },
      {
        id: 'homeroom',
        label: 'לוח מחנכות בזמן אמת',
        icon: <Bell className="w-4 h-4 ml-1.5" />,
        badge: unaddressedCount > 0 ? unaddressedCount : undefined,
      },
      {
        id: 'parent',
        label: 'פורטל הורים ותלמידים',
        icon: <UserCheck className="w-4 h-4 ml-1.5" />,
      }
    );
  } else if (session?.role === 'teacher') {
    navItems.push({
      id: 'teacher',
      label: 'יומן שיעור מהיר',
      icon: <BookOpen className="w-4 h-4 ml-1.5" />,
    });
    if (session.isDualRole) {
      navItems.push({
        id: 'homeroom',
        label: `לוח מחנכת (${session.homeroomClass})`,
        icon: <Bell className="w-4 h-4 ml-1.5" />,
        badge: unaddressedCount > 0 ? unaddressedCount : undefined,
      });
    }
    navItems.push({
      id: 'parent',
      label: 'פורטל הורים ותלמידים',
      icon: <UserCheck className="w-4 h-4 ml-1.5" />,
    });
  } else if (session?.role === 'homeroom') {
    navItems.push({
      id: 'homeroom',
      label: `לוח מחנכת (כיתה ${session.homeroomClass})`,
      icon: <Bell className="w-4 h-4 ml-1.5" />,
      badge: unaddressedCount > 0 ? unaddressedCount : undefined,
    });
    if (adminSettings.allowHomeroomPedagogicalAccess) {
      navItems.push({
        id: 'pedagogical',
        label: 'תיק תלמיד',
        icon: <Sparkles className="w-4 h-4 ml-1.5" />,
      });
    }
    if (session.isDualRole) {
      navItems.push({
        id: 'teacher',
        label: 'יומן שיעור מהיר',
        icon: <BookOpen className="w-4 h-4 ml-1.5" />,
      });
    }
    navItems.push({
      id: 'parent',
      label: 'פורטל הורים ותלמידים',
      icon: <UserCheck className="w-4 h-4 ml-1.5" />,
    });
  } else {
    // Guest / Parents: ONLY show parent portal.
    // Internal staff tools (teacher journal, homeroom board, admin) are completely hidden for privacy.
    // Staff members access their tools securely via the "כניסת צוות (מקלדת קוד) 🔑" button.
    navItems.push({
      id: 'parent',
      label: 'פורטל הורים ותלמידים - אזור אישי מאובטח',
      icon: <UserCheck className="w-4 h-4 ml-1.5" />,
    });
  }

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (item.requiresAuth && !session) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentRole(item.id);
  };

  return (
    <>
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

            {/* Right Controls: Staff Session / Login, Clock & Sound */}
            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              {/* Session / Login Button */}
              {session ? (
                <div className="flex items-center gap-2 bg-slate-800/95 border border-indigo-500/40 rounded-xl p-1.5 shadow-md">
                  <div className="px-2.5 py-1 text-right">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      {session.role === 'admin' && <span>👑 מנהל מערכת</span>}
                      {session.role === 'teacher' && <span>👨‍🏫 מורה: {session.name}</span>}
                      {session.role === 'homeroom' && (
                        <span>👩‍🏫 מחנכת כיתה {session.homeroomClass} ({session.name})</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {session.role === 'admin' && 'הרשאות ניהול מלאות'}
                      {session.role === 'teacher' &&
                        `שכבות: ${session.allowedGrades?.map((g) => `${g}'`).join(', ')}`}
                      {session.role === 'homeroom' && `נעול לכיתה ${session.homeroomClass}`}
                    </div>
                  </div>

                  {/* Dual Role Switcher */}
                  {session.isDualRole && (
                    <button
                      type="button"
                      onClick={() =>
                        switchDualMode(
                          session.activeDualMode === 'teacher' ? 'homeroom' : 'teacher'
                        )
                      }
                      title="החלף בין תפקיד מורה למחנכת"
                      className="px-2.5 py-1.5 bg-indigo-600/50 hover:bg-indigo-600 text-indigo-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-indigo-400/30"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-indigo-300" />
                      <span className="hidden sm:inline">
                        מעבר ל{session.activeDualMode === 'teacher' ? 'מחנכת' : 'מורה'}
                      </span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={logout}
                    title="יציאה מהחשבון וחזרה למקלדת הכניסה"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/40 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>יציאה מהחשבון</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>כניסת צוות (מקלדת קוד)</span>
                </button>
              )}

              {/* Clock */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentTime || '00:00:00'}</span>
              </div>

              {/* Sound Toggle */}
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
                      <span className="hidden sm:inline">צלצול פעיל</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">מושתק</span>
                    </>
                  )}
                </button>

                {soundOn && (
                  <button
                    onClick={testSound}
                    title="בדיקת צליל פעמון התראה"
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    🔔
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs: Visible ONLY to authenticated staff members */}
        {session ? (
          <div className="bg-slate-950/70 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-1.5 py-2">
              {navItems.map((item) => {
                const isActive = currentRole === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`relative flex items-center px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
        ) : (
          <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block"></span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  פורטל הורים ותלמידים • צפייה מאובטחת בתיק התלמיד האישי בלבד
                </span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center gap-2">
                <span>מערכת מוגנת לפי נוהל הגנת פרטיות קטינים במוסדות חינוך</span>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                >
                  כניסת מורים ומחנכות
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Secret Code Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
