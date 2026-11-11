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
import { SCHOOL_INFO } from './data/initialData';
import { Sparkles, Shield, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRole, setCurrentRole } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 font-['Assistant',sans-serif]">
      {/* Top Header & Navigation */}
      <Header />

      {/* Real-time floating alert for urgent broadcasts */}
      <RealTimeAlertBanner />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRole === 'teacher' && <TeacherJournal />}
        {currentRole === 'homeroom' && <HomeroomDashboard />}
        {currentRole === 'behavior_reports' && <BehaviorReportsGenerator />}
        {currentRole === 'parent' && <ParentPortal />}
        {currentRole === 'pedagogical' && <PedagogicalFile />}
        {currentRole === 'excel' && <ExcelManager />}
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
            <button
              onClick={() => setCurrentRole('teacher')}
              className="hover:text-cyan-300 transition-colors"
            >
              יומן מורה
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentRole('homeroom')}
              className="hover:text-cyan-300 transition-colors"
            >
              לוח מחנכות
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentRole('behavior_reports')}
              className="hover:text-cyan-300 transition-colors"
            >
              דוחות התנהגות
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentRole('parent')}
              className="hover:text-cyan-300 transition-colors"
            >
              פורטל הורים (ת.ז)
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentRole('excel')}
              className="hover:text-cyan-300 transition-colors"
            >
              ניהול אקסל
            </button>
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
