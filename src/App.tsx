import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { RealTimeAlertBanner } from './components/RealTimeAlertBanner';
import { TeacherJournal } from './components/TeacherJournal';
import { HomeroomDashboard } from './components/HomeroomDashboard';
import { ParentPortal } from './components/ParentPortal';
import { PedagogicalFile } from './components/PedagogicalFile';
import { ExcelManager } from './components/ExcelManager';
import { BehaviorReportsGenerator } from './components/BehaviorReportsGenerator';
import { AdminPanel } from './components/AdminPanel';
import { SCHOOL_INFO } from './data/initialData';
import { Sparkles, Shield, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRole, setCurrentRole, session, setIsLoginModalOpen } = useApp();

  // Privacy Guard: If no staff session is active, user is strictly restricted to the parent portal
  React.useEffect(() => {
    if (!session && currentRole !== 'parent') {
      setCurrentRole('parent');
    }
  }, [session, currentRole, setCurrentRole]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 font-['Assistant',sans-serif]">
      {/* Top Header & Navigation */}
      <Header />

      {/* Real-time floating alert for urgent broadcasts (staff only) */}
      <RealTimeAlertBanner />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {session && currentRole === 'admin' && <AdminPanel />}
        {session && currentRole === 'teacher' && <TeacherJournal />}
        {session && currentRole === 'homeroom' && <HomeroomDashboard />}
        {session && currentRole === 'behavior_reports' && <BehaviorReportsGenerator />}
        {session && currentRole === 'pedagogical' && <PedagogicalFile />}
        {session && currentRole === 'excel' && <ExcelManager />}
        {(!session || currentRole === 'parent') && <ParentPortal />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center sm:text-right">
            <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>{SCHOOL_INFO.name}</strong> ({SCHOOL_INFO.nameArabic}) | סמל מוסד:{' '}
              {SCHOOL_INFO.institutionSymbol} | {SCHOOL_INFO.programName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 flex-wrap justify-center">
            {session ? (
              <>
                {session.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setCurrentRole('admin')}
                      className="hover:text-cyan-300 transition-colors font-bold text-amber-400 flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      ניהול מערכת
                    </button>
                    <span>•</span>
                  </>
                )}
                {(session.role === 'admin' || session.role === 'teacher' || session.isDualRole) && (
                  <>
                    <button
                      onClick={() => setCurrentRole('teacher')}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      יומן מורה
                    </button>
                    <span>•</span>
                  </>
                )}
                {(session.role === 'admin' || session.role === 'homeroom' || session.isDualRole) && (
                  <>
                    <button
                      onClick={() => setCurrentRole('homeroom')}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      לוח מחנכות
                    </button>
                    <span>•</span>
                  </>
                )}
                <button
                  onClick={() => setCurrentRole('parent')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  פורטל הורים
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-medium">פורטל הורים ותלמידים (אזור אישי מאובטח)</span>
                <span>•</span>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-cyan-400" />
                  כניסת סגל מוסמך (מקלדת קוד)
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
